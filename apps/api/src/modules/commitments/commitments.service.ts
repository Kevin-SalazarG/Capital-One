import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import * as v from "valibot";
import type {
  BusinessState,
  Commitment,
  Reconciliation,
} from "../../platform/database/business-state.js";
import { DatabaseService, type DatabaseScope } from "../../platform/database/database.service.js";
import { ApiError } from "../../platform/http/api-error.js";
import type { PageQuery } from "../../platform/http/http-schemas.js";
import type { NormalizedBill } from "../banking/banking-provider.js";
import { cashEventSchema, type CashEvent } from "../planning/domain/forecast-schema.js";
import { commitmentResultSchema, reconciliationSchema } from "./commitment-schemas.js";
import type {
  AdjustmentInput,
  CommitmentInput,
  CommitmentList,
  CommitmentResult,
  CommitmentWrite,
  CorrectionInput,
  ReconciliationInput,
  ReconciliationResult,
  RecurringInput,
} from "./commitment-schemas.js";

@Injectable()
export class CommitmentsService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(scope: DatabaseScope, page: PageQuery): Promise<CommitmentList> {
    return this.database.transaction(scope, async (state) => {
      const rows = state.commitments
        .filter((row) => row.businessId === scope.businessId)
        .sort(
          (left, right) =>
            left.dueDate.getTime() - right.dueDate.getTime() || left.id.localeCompare(right.id),
        );
      return {
        items: rows
          .slice(page.offset, page.offset + page.limit)
          .map((row) => mapCommitment(row, state.reconciliations)),
        total: rows.length,
        planningVersion: state.business.planningVersion,
      };
    });
  }

  async create(scope: DatabaseScope, input: CommitmentInput): Promise<CommitmentWrite> {
    return this.database.transaction(scope, async (state) => {
      assertPositive(input.amount);
      const version = await this.database.advanceVersion(
        state,
        scope.businessId,
        input.expectedVersion,
      );
      const commitment = newCommitment(scope.businessId, fields(input));
      state.commitments.push(commitment);
      this.audit(state, scope, "commitment.created", commitment.id);
      return {
        commitment: mapCommitment(commitment, state.reconciliations),
        planningVersion: version,
      };
    });
  }

  async update(scope: DatabaseScope, id: string, input: CommitmentInput): Promise<CommitmentWrite> {
    return this.database.transaction(scope, async (state) => {
      const version = await this.database.advanceVersion(
        state,
        scope.businessId,
        input.expectedVersion,
      );
      const existing = state.commitments.find(
        (row) => row.id === id && row.businessId === scope.businessId,
      );
      if (!existing) throw new ApiError("NOT_FOUND", "Compromiso no encontrado.", 404);
      if (
        existing.source !== "manual" ||
        existing.decisionId ||
        existing.status === "settled" ||
        receivedAmount(existing, state.reconciliations).gt(0)
      )
        throw new ApiError(
          "COMMITMENT_IMMUTABLE",
          "Este compromiso requiere corregir su evidencia antes de editarlo.",
          409,
        );
      assertPositive(input.amount);
      Object.assign(existing, fields(input), { updatedAt: new Date() });
      this.audit(state, scope, "commitment.updated", id);
      return {
        commitment: mapCommitment(existing, state.reconciliations),
        planningVersion: version,
      };
    });
  }

  async adjust(scope: DatabaseScope, id: string, input: AdjustmentInput): Promise<CommitmentWrite> {
    return this.database.transaction(scope, async (state) => {
      const version = await this.database.advanceVersion(
        state,
        scope.businessId,
        input.expectedVersion,
      );
      const existing = state.commitments.find(
        (row) => row.id === id && row.businessId === scope.businessId,
      );
      if (!existing) throw new ApiError("NOT_FOUND", "Compromiso no encontrado.", 404);
      if (
        !existing.negotiable ||
        existing.kind !== "outflow" ||
        existing.source !== "manual" ||
        existing.status === "settled" ||
        existing.status === "cancelled" ||
        receivedAmount(existing, state.reconciliations).gt(input.amount)
      )
        throw new ApiError("EXPENSE_NOT_ADJUSTABLE", "El gasto no admite ese ajuste.", 409);
      assertPositive(input.amount);
      existing.amount = new Decimal(input.amount);
      existing.updatedAt = new Date();
      this.audit(state, scope, "overhead.adjusted", id);
      return {
        commitment: mapCommitment(existing, state.reconciliations),
        planningVersion: version,
      };
    });
  }

  async recurring(scope: DatabaseScope, input: RecurringInput): Promise<CommitmentList> {
    return this.database.transaction(scope, async (state) => {
      assertPositive(input.amount);
      const version = await this.database.advanceVersion(
        state,
        scope.businessId,
        input.expectedVersion,
      );
      const items: CommitmentResult[] = [];
      for (const date of monthlyDates(input.dueDate, input.dayOfMonth, input.occurrences)) {
        const occurrenceKey = `manual:${input.seriesId}:${date}`;
        let commitment = state.commitments.find(
          (row) => row.businessId === scope.businessId && row.occurrenceKey === occurrenceKey,
        );
        if (commitment) {
          if (
            !commitment.amount.eq(input.amount) ||
            commitment.kind !== input.kind ||
            commitment.title !== input.title
          )
            throw new ApiError(
              "OCCURRENCE_CONFLICT",
              "La recurrencia ya existe con otros datos.",
              409,
            );
        } else {
          commitment = newCommitment(scope.businessId, {
            ...fields(input),
            dueDate: new Date(date),
            occurrenceKey,
          });
          state.commitments.push(commitment);
        }
        items.push(mapCommitment(commitment, state.reconciliations));
      }
      this.audit(state, scope, "commitment.series_created", input.seriesId);
      return { items, total: items.length, planningVersion: version };
    });
  }

  async reconcile(scope: DatabaseScope, input: ReconciliationInput): Promise<ReconciliationResult> {
    return this.database.transaction(scope, async (state) => {
      const duplicate = state.reconciliations.find(
        (row) =>
          row.businessId === scope.businessId &&
          row.movementId === input.movementId &&
          row.commitmentId === input.commitmentId &&
          row.active,
      );
      if (duplicate) {
        if (!duplicate.amount.eq(input.amount))
          throw new ApiError(
            "RECONCILIATION_CONFLICT",
            "El movimiento ya tiene una conciliación diferente.",
            409,
          );
        return mapReconciliation(duplicate, state.business.planningVersion);
      }
      const version = await this.database.advanceVersion(
        state,
        scope.businessId,
        input.expectedVersion,
      );
      const commitment = state.commitments.find(
        (row) => row.id === input.commitmentId && row.businessId === scope.businessId,
      );
      const movement = state.movements.find(
        (row) => row.id === input.movementId && row.businessId === scope.businessId,
      );
      if (!commitment || !movement)
        throw new ApiError("NOT_FOUND", "No se encontró el movimiento o compromiso.", 404);
      assertPositive(input.amount);
      const applied = state.reconciliations
        .filter(
          (row) =>
            row.businessId === scope.businessId && row.movementId === movement.id && row.active,
        )
        .reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
      if (
        commitment.status === "cancelled" ||
        movement.status !== "completed" ||
        movement.bookedDate > state.business.cutoff ||
        movement.direction !== commitment.kind ||
        applied.plus(input.amount).gt(movement.amount) ||
        receivedAmount(commitment, state.reconciliations).plus(input.amount).gt(commitment.amount)
      )
        throw new ApiError(
          "RECONCILIATION_INVALID",
          "La conciliación excede el pendiente o no corresponde a dinero observado.",
          409,
        );
      const reconciliation: Reconciliation = {
        id: randomUUID(),
        businessId: scope.businessId,
        movementId: movement.id,
        commitmentId: commitment.id,
        amount: new Decimal(input.amount),
        evidence: { note: input.evidence },
        active: true,
        createdBy: scope.userId,
        createdAt: new Date(),
        correctedAt: null,
      };
      state.reconciliations.push(reconciliation);
      this.audit(state, scope, "reconciliation.created", reconciliation.id);
      return mapReconciliation(reconciliation, version);
    });
  }

  async correctReconciliation(
    scope: DatabaseScope,
    id: string,
    input: CorrectionInput,
  ): Promise<ReconciliationResult> {
    return this.database.transaction(scope, async (state) => {
      const version = await this.database.advanceVersion(
        state,
        scope.businessId,
        input.expectedVersion,
      );
      const existing = state.reconciliations.find(
        (row) => row.id === id && row.businessId === scope.businessId && row.active,
      );
      if (!existing) throw new ApiError("NOT_FOUND", "Conciliación activa no encontrada.", 404);
      existing.active = false;
      existing.correctedAt = new Date();
      state.auditEvents.push({
        id: randomUUID(),
        ...scope,
        action: "reconciliation.corrected",
        entityId: id,
        metadata: { evidence: input.evidence },
        createdAt: new Date(),
      });
      return mapReconciliation(existing, version);
    });
  }

  async forecastEventsInTransaction(
    state: BusinessState,
    businessId: string,
  ): Promise<CashEvent[]> {
    const rows = state.commitments
      .filter((row) => row.businessId === businessId && row.status !== "cancelled")
      .sort((left, right) => left.id.localeCompare(right.id));
    if (rows.length > 500)
      throw new ApiError(
        "PLANNING_INPUT_LIMIT",
        "El calendario supera el límite de evaluación.",
        422,
      );
    return rows
      .filter(
        (row) => remainingAmount(row, state.reconciliations).gt(0) && row.status !== "settled",
      )
      .map((row) =>
        v.parse(cashEventSchema, {
          id: row.id,
          label: row.title,
          date: calendarDate(row.dueDate),
          amount: remainingAmount(row, state.reconciliations).toFixed(2),
          direction: row.kind,
          status: row.status,
          category: row.category,
          negotiable: row.negotiable,
          ...(row.conservativeDate && row.status === "conditional"
            ? { conservativeDate: calendarDate(row.conservativeDate) }
            : {}),
        }),
      );
  }

  async hasReconciledDecisionAdvanceInTransaction(
    state: BusinessState,
    businessId: string,
    decisionId: string,
  ): Promise<boolean> {
    const advance = state.commitments.find(
      (row) =>
        row.businessId === businessId &&
        row.decisionId === decisionId &&
        row.kind === "inflow" &&
        row.occurrenceKey?.endsWith(":advance"),
    );
    return advance !== undefined && remainingAmount(advance, state.reconciliations).isZero();
  }

  async setSupplierAgreementInTransaction(
    state: BusinessState,
    businessId: string,
    decisionId: string,
    confirmed: boolean,
  ): Promise<void> {
    for (const commitment of state.commitments.filter(
      (row) =>
        row.businessId === businessId &&
        row.decisionId === decisionId &&
        row.conservativeDate !== null &&
        (row.status === "expected" || row.status === "conditional"),
    )) {
      commitment.status = confirmed ? "expected" : "conditional";
      commitment.updatedAt = new Date();
    }
  }

  async registerEventsInTransaction(
    state: BusinessState,
    businessId: string,
    decisionId: string,
    events: readonly CashEvent[],
  ): Promise<void> {
    for (const event of events) {
      if (new Decimal(event.amount).isZero()) continue;
      state.commitments.push(
        newCommitment(businessId, {
          decisionId,
          title: event.label,
          kind: event.direction,
          amount: new Decimal(event.amount),
          dueDate: new Date(event.date),
          status: event.status,
          category: event.category,
          negotiable: event.negotiable,
          source: "decision",
          occurrenceKey: `decision:${decisionId}:${event.id}`,
          conservativeDate: event.conservativeDate ? new Date(event.conservativeDate) : null,
        }),
      );
    }
  }

  async importBillsInTransaction(
    state: BusinessState,
    scope: DatabaseScope,
    bills: readonly NormalizedBill[],
    cutoffDate: string,
  ): Promise<void> {
    const horizon = new Date(cutoffDate);
    horizon.setUTCDate(horizon.getUTCDate() + 30);
    for (const bill of bills) {
      const prefix = `nessie:bill:${bill.externalId}:`;
      if (bill.status === "cancelled") {
        for (const commitment of state.commitments.filter(
          (row) =>
            row.businessId === scope.businessId &&
            row.occurrenceKey?.startsWith(prefix) &&
            (row.status === "expected" || row.status === "conditional") &&
            row.dueDate >= new Date(cutoffDate) &&
            remainingAmount(row, state.reconciliations).gt(0),
        )) {
          commitment.status = "cancelled";
          commitment.updatedAt = new Date();
        }
        continue;
      }
      if (bill.status === "completed") {
        if (bill.paymentDate > cutoffDate)
          throw new ApiError(
            "BILL_STATE_CONFLICT",
            "El pago del proveedor queda después del corte observado.",
            409,
          );
        for (const commitment of state.commitments.filter(
          (row) =>
            row.businessId === scope.businessId &&
            row.occurrenceKey === `${prefix}${bill.paymentDate}`,
        )) {
          commitment.status = "settled";
          commitment.updatedAt = new Date();
        }
        continue;
      }
      const dates =
        bill.status === "recurring"
          ? monthlyDates(bill.upcomingDate, bill.recurringDay, 2).filter(
              (date) => date <= calendarDate(horizon),
            )
          : [bill.upcomingDate];
      for (const date of dates) {
        const occurrenceKey = `${prefix}${date}`;
        const existing = state.commitments.find(
          (row) => row.businessId === scope.businessId && row.occurrenceKey === occurrenceKey,
        );
        if (existing && receivedAmount(existing, state.reconciliations).gt(bill.amount))
          throw new ApiError(
            "BILL_RECONCILIATION_CONFLICT",
            "El importe del proveedor contradice una conciliación existente.",
            409,
          );
        if (existing) {
          existing.amount = new Decimal(bill.amount);
          existing.updatedAt = new Date();
        } else
          state.commitments.push(
            newCommitment(scope.businessId, {
              title: bill.nickname || bill.payee,
              kind: "outflow",
              amount: new Decimal(bill.amount),
              dueDate: new Date(date),
              category: "uncategorized",
              status: "expected",
              source: "nessie_bill",
              occurrenceKey,
            }),
          );
      }
    }
  }

  private audit(
    state: BusinessState,
    scope: DatabaseScope,
    action: string,
    entityId: string,
  ): void {
    state.auditEvents.push({
      id: randomUUID(),
      ...scope,
      action,
      entityId,
      metadata: {},
      createdAt: new Date(),
    });
  }
}

type CommitmentFields = Pick<
  Commitment,
  "title" | "kind" | "amount" | "dueDate" | "category" | "status"
> &
  Partial<
    Pick<Commitment, "negotiable" | "occurrenceKey" | "conservativeDate" | "decisionId" | "source">
  >;

function newCommitment(businessId: string, input: CommitmentFields): Commitment {
  return {
    id: randomUUID(),
    businessId,
    negotiable: false,
    source: "manual",
    occurrenceKey: null,
    conservativeDate: null,
    decisionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

function fields(input: CommitmentInput | RecurringInput): CommitmentFields {
  return {
    title: input.title,
    kind: input.kind,
    amount: new Decimal(input.amount),
    dueDate: new Date(input.dueDate),
    category: input.category,
    status: input.status,
    negotiable: input.negotiable,
  };
}

function assertPositive(amount: string): void {
  if (new Decimal(amount).lte(0))
    throw new ApiError("INVALID_AMOUNT", "El importe debe ser positivo.", 400);
}
export function calendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
export function receivedAmount(
  row: Commitment,
  reconciliations: readonly Reconciliation[],
): Decimal {
  return reconciliations
    .filter(
      (item) => item.businessId === row.businessId && item.commitmentId === row.id && item.active,
    )
    .reduce((sum, item) => sum.plus(item.amount), new Decimal(0));
}
export function remainingAmount(
  row: Commitment,
  reconciliations: readonly Reconciliation[],
): Decimal {
  return row.amount.minus(receivedAmount(row, reconciliations));
}

export function mapCommitment(
  row: Commitment,
  reconciliations: readonly Reconciliation[],
): CommitmentResult {
  const remaining = remainingAmount(row, reconciliations);
  return v.parse(commitmentResultSchema, {
    ...row,
    amount: row.amount.toFixed(2),
    dueDate: calendarDate(row.dueDate),
    receivedAmount: receivedAmount(row, reconciliations).toFixed(2),
    remainingAmount:
      row.status === "cancelled" || row.status === "settled" ? "0.00" : remaining.toFixed(2),
    status: remaining.isZero() ? "settled" : row.status,
  });
}
function mapReconciliation(row: Reconciliation, planningVersion: number): ReconciliationResult {
  return v.parse(reconciliationSchema, { ...row, amount: row.amount.toFixed(2), planningVersion });
}

export function monthlyDates(start: string, day: number, count: number): string[] {
  const first = new Date(start);
  const firstMonthEnd = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const firstCandidate = calendarDate(
    new Date(
      Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        Math.min(day, firstMonthEnd.getUTCDate()),
      ),
    ),
  );
  const startOffset = firstCandidate < start ? 1 : 0;
  return Array.from({ length: count }, (_, offset) => {
    const month = first.getUTCMonth() + startOffset + offset;
    const end = new Date(Date.UTC(first.getUTCFullYear(), month + 1, 0));
    return calendarDate(
      new Date(Date.UTC(first.getUTCFullYear(), month, Math.min(day, end.getUTCDate()))),
    );
  });
}
