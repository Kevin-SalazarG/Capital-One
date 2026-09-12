import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import type { BusinessState } from "../../platform/database/business-state.js";
import { DatabaseService, type DatabaseScope } from "../../platform/database/database.service.js";
import { ApiError } from "../../platform/http/api-error.js";
import { calendarDate, remainingAmount } from "./commitments.service.js";
import type { BudgetInput, BudgetList, BudgetResult } from "./commitment-schemas.js";

@Injectable()
export class BudgetsService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(scope: DatabaseScope): Promise<BudgetList> {
    return this.database.transaction(scope, (state) =>
      this.listInTransaction(state, scope.businessId),
    );
  }

  async set(scope: DatabaseScope, input: BudgetInput): Promise<BudgetList> {
    if (input.periodStart > input.periodEnd)
      throw new ApiError("INVALID_PERIOD", "Revisa el periodo del presupuesto.", 400);
    return this.database.transaction(scope, async (state) => {
      await this.database.advanceVersion(state, scope.businessId, input.expectedVersion);
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);
      const sameCategory = state.budgets.filter(
        (row) => row.businessId === scope.businessId && row.category === input.category,
      );
      const exact = sameCategory.find(
        (row) =>
          row.periodStart.getTime() === periodStart.getTime() &&
          row.periodEnd.getTime() === periodEnd.getTime(),
      );
      if (
        sameCategory.some(
          (row) =>
            row.id !== exact?.id && row.periodStart <= periodEnd && row.periodEnd >= periodStart,
        )
      )
        throw new ApiError(
          "BUDGET_PERIOD_CONFLICT",
          "Los periodos de una categoría no pueden superponerse.",
          409,
        );
      const budget = exact ?? {
        id: randomUUID(),
        businessId: scope.businessId,
        category: input.category,
        periodStart,
        periodEnd,
        amount: new Decimal(input.amount),
      };
      budget.amount = new Decimal(input.amount);
      if (!exact) state.budgets.push(budget);
      state.auditEvents.push({
        id: randomUUID(),
        ...scope,
        action: "budget.updated",
        entityId: budget.id,
        metadata: {},
        createdAt: new Date(),
      });
      return this.listInTransaction(state, scope.businessId);
    });
  }

  async listInTransaction(state: BusinessState, businessId: string): Promise<BudgetList> {
    if (state.business.id !== businessId)
      throw new ApiError("BUSINESS_ACCESS_DENIED", "No tienes acceso a este negocio.", 403);
    const budgets = state.budgets
      .filter((row) => row.businessId === businessId)
      .sort(
        (left, right) =>
          left.periodStart.getTime() - right.periodStart.getTime() ||
          left.id.localeCompare(right.id),
      );
    if (budgets.length > 100)
      throw new ApiError(
        "BUDGET_INPUT_LIMIT",
        "Hay demasiados presupuestos para esta consulta.",
        422,
      );
    const items: BudgetResult[] = [];
    for (const budget of budgets) {
      const commitments = state.commitments.filter(
        (row) =>
          row.businessId === businessId &&
          row.kind === "outflow" &&
          row.category === budget.category &&
          row.dueDate >= budget.periodStart &&
          row.dueDate <= budget.periodEnd &&
          row.status !== "settled" &&
          row.status !== "cancelled",
      );
      const movements = state.movements.filter(
        (row) =>
          row.businessId === businessId &&
          row.direction === "outflow" &&
          row.status === "completed" &&
          row.bookedDate >= budget.periodStart &&
          row.bookedDate <= budget.periodEnd &&
          row.bookedDate <= state.business.cutoff,
      );
      if (commitments.length > 500 || movements.length > 500)
        throw new ApiError(
          "BUDGET_INPUT_LIMIT",
          "El periodo supera el límite de movimientos.",
          422,
        );
      let paid = new Decimal(0);
      for (const movement of movements) {
        let allocated = new Decimal(0);
        for (const match of state.reconciliations.filter(
          (row) => row.businessId === businessId && row.movementId === movement.id && row.active,
        )) {
          allocated = allocated.plus(match.amount);
          const commitment = state.commitments.find(
            (row) => row.businessId === businessId && row.id === match.commitmentId,
          );
          if (!commitment)
            throw new ApiError(
              "DATA_INCONSISTENT",
              "No fue posible consultar un estado completo.",
              503,
            );
          if (commitment.category === budget.category) paid = paid.plus(match.amount);
        }
        if ((movement.category ?? "uncategorized") === budget.category)
          paid = paid.plus(movement.amount.minus(allocated));
      }
      const committed = commitments.reduce(
        (sum, commitment) => sum.plus(remainingAmount(commitment, state.reconciliations)),
        new Decimal(0),
      );
      const adjustable = commitments
        .filter((row) => row.negotiable && row.source === "manual")
        .reduce(
          (sum, commitment) => sum.plus(remainingAmount(commitment, state.reconciliations)),
          new Decimal(0),
        );
      items.push({
        id: budget.id,
        category: budget.category,
        periodStart: calendarDate(budget.periodStart),
        periodEnd: calendarDate(budget.periodEnd),
        amount: budget.amount.toFixed(2),
        paid: paid.toFixed(2),
        committedUnpaid: committed.toFixed(2),
        remaining: budget.amount.minus(paid).minus(committed).toFixed(2),
        adjustable: adjustable.toFixed(2),
      });
    }
    return { items, planningVersion: state.business.planningVersion };
  }
}
