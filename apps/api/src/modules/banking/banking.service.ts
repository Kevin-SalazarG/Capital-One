import { randomUUID } from "node:crypto";
import { HttpException, Inject, Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import * as v from "valibot";
import { APP_CONFIG, type AppConfig } from "../../config/app-config.js";
import type {
  BankAccount,
  BankMovement,
  Business,
  BusinessState,
  SyncRun,
} from "../../platform/database/business-state.js";
import { DatabaseService, type DatabaseScope } from "../../platform/database/database.service.js";
import { ApiError } from "../../platform/http/api-error.js";
import type { PageQuery } from "../../platform/http/http-schemas.js";
import { CommitmentsService } from "../commitments/commitments.service.js";
import {
  BankingProvider,
  BankingProviderError,
  type BankingSnapshot,
  type NormalizedMovement,
} from "./banking-provider.js";
import {
  bankAccountSchema,
  bankMovementListSchema,
  syncResultSchema,
  syncRunSchema,
  type BankAccountResult,
  type BankMovementListResult,
  type SourceFreshness,
  type SyncResult,
  type SyncRunResult,
} from "./banking-schemas.js";
import { bankingCalendarDate } from "./normalize-banking-data.js";

interface PreparedSync {
  readonly account: BankAccount;
  readonly business: Business;
  readonly run: SyncRun;
  readonly cutoffDate: string;
}

@Injectable()
export class BankingService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(BankingProvider) private readonly provider: BankingProvider,
    @Inject(CommitmentsService) private readonly commitments: CommitmentsService,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, "BANKING_MODE">,
  ) {}

  async getAccount(scope: DatabaseScope): Promise<BankAccountResult> {
    return this.database.transaction(scope, async (state) => {
      const { account, business } = this.readAccount(state, scope.businessId);
      const latestSync = latestRun(state, scope.businessId);
      const freshness = bankingFreshness(business, new Date());
      return v.parse(bankAccountSchema, {
        id: account.id,
        externalId: account.externalId,
        provider: account.provider,
        currency: business.currency,
        balance: business.openingBalance.toFixed(2),
        cutoffDate: dateString(business.cutoff),
        planningVersion: business.planningVersion,
        source: business.source,
        sourceSyncedAt: business.sourceSyncedAt?.toISOString() ?? null,
        freshness: latestSync?.status === "failed" && freshness === "current" ? "stale" : freshness,
        lastSyncStatus: latestSync?.status ?? null,
        lastSyncErrorCode: latestSync?.errorCode ?? null,
      });
    });
  }

  async listMovements(scope: DatabaseScope, page: PageQuery): Promise<BankMovementListResult> {
    return this.database.transaction(scope, async (state) => {
      const { account, business } = this.readAccount(state, scope.businessId);
      const rows = state.movements
        .filter((row) => row.businessId === scope.businessId && row.accountId === account.id)
        .sort(
          (left, right) =>
            right.bookedDate.getTime() - left.bookedDate.getTime() ||
            left.id.localeCompare(right.id),
        );
      return v.parse(bankMovementListSchema, {
        items: rows.slice(page.offset, page.offset + page.limit).map((movement) => ({
          ...movement,
          resource: movement.resourceType,
          amount: movement.amount.toFixed(2),
          currency: business.currency,
          date: dateString(movement.bookedDate),
        })),
        ...page,
        total: rows.length,
        planningVersion: business.planningVersion,
        source: business.source,
        sourceSyncedAt: business.sourceSyncedAt?.toISOString() ?? null,
      });
    });
  }

  async getSyncRun(scope: DatabaseScope, runId: string): Promise<SyncRunResult> {
    return this.database.transaction(scope, async (state) => {
      const run = state.syncRuns.find(
        (row) => row.businessId === scope.businessId && row.id === runId,
      );
      if (!run) throw new ApiError("NOT_FOUND", "La actualización no existe.", 404);
      return mapSyncRun(run);
    });
  }

  async getLatestSyncRun(scope: DatabaseScope): Promise<SyncRunResult | null> {
    return this.database.transaction(scope, async (state) => {
      const run = latestRun(state, scope.businessId);
      return run ? mapSyncRun(run) : null;
    });
  }

  async hasFailedLatestSyncInTransaction(
    state: BusinessState,
    businessId: string,
  ): Promise<boolean> {
    return latestRun(state, businessId)?.status === "failed";
  }

  async getSourceFreshnessInTransaction(
    state: BusinessState,
    businessId: string,
  ): Promise<SourceFreshness> {
    if (state.business.id !== businessId)
      throw new ApiError("BUSINESS_ACCESS_DENIED", "No tienes acceso a este negocio.", 403);
    const freshness = bankingFreshness(state.business, new Date());
    return freshness === "current" &&
      (await this.hasFailedLatestSyncInTransaction(state, businessId))
      ? "stale"
      : freshness;
  }

  async sync(
    scope: DatabaseScope,
    expectedVersion: number,
    signal?: AbortSignal,
  ): Promise<SyncResult> {
    const prepared = await this.prepareSync(scope, expectedVersion);
    try {
      const snapshot = await this.provider.load({
        customerId: prepared.account.connectionId,
        accountId: prepared.account.externalId,
        cutoffDate: prepared.cutoffDate,
        timezone: prepared.business.timezone,
        ...(signal ? { signal } : {}),
      });
      if (signal?.aborted) throw new BankingProviderError("PROVIDER_CANCELLED");
      return await this.publishSync(scope, prepared, snapshot);
    } catch (error: unknown) {
      const failure = mapSyncFailure(error);
      await this.markFailed(scope, prepared.run.id, failure.code);
      throw failure;
    }
  }

  private async prepareSync(scope: DatabaseScope, expectedVersion: number): Promise<PreparedSync> {
    const prepared = await this.database.transaction(scope, async (state) => {
      const { account, business } = this.readAccount(state, scope.businessId);
      if (business.planningVersion !== expectedVersion)
        throw new ApiError(
          "PLANNING_VERSION_CONFLICT",
          "Recarga la versión actual antes de actualizar.",
          409,
        );
      const cutoffDate =
        this.config.BANKING_MODE === "nessie_live"
          ? bankingCalendarDate(new Date(), business.timezone)
          : dateString(business.cutoff);
      return { account, business, cutoffDate };
    });
    const run = await this.database.beginSync(scope, expectedVersion, prepared.cutoffDate);
    return { ...prepared, run };
  }

  private async publishSync(
    scope: DatabaseScope,
    prepared: PreparedSync,
    snapshot: BankingSnapshot,
  ): Promise<SyncResult> {
    if (
      snapshot.account.externalId !== prepared.account.externalId ||
      snapshot.account.customerId !== prepared.account.connectionId ||
      snapshot.cutoffDate !== prepared.cutoffDate ||
      snapshot.source !== this.config.BANKING_MODE
    )
      throw new BankingProviderError("PROVIDER_SCOPE_MISMATCH");
    if (
      snapshot.movements.some(
        (movement) => movement.status === "completed" && movement.date > snapshot.cutoffDate,
      )
    )
      throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
    return this.database.transaction(scope, async (state) => {
      const newer = state.syncRuns.some(
        (row) =>
          row.businessId === scope.businessId &&
          row.id !== prepared.run.id &&
          row.sequence > prepared.run.sequence &&
          (row.status === "running" || row.status === "succeeded"),
      );
      if (newer)
        throw new ApiError(
          "SYNC_SUPERSEDED",
          "Otra actualización más reciente requiere revisión.",
          409,
        );
      const planningVersion = await this.database.advanceVersion(
        state,
        scope.businessId,
        prepared.run.requestRevision,
      );
      this.assertSourceContinuity(state, scope, prepared.account, snapshot);
      for (const movement of snapshot.movements)
        this.upsertMovement(state, scope, prepared.account, movement);
      await this.commitments.importBillsInTransaction(
        state,
        scope,
        snapshot.bills,
        snapshot.cutoffDate,
      );
      state.business.openingBalance = new Decimal(snapshot.account.balance);
      state.business.cutoff = new Date(`${snapshot.cutoffDate}T00:00:00.000Z`);
      state.business.source = snapshot.source;
      state.business.sourceSyncedAt = new Date(snapshot.completedAt);
      state.business.updatedAt = new Date();
      const run = state.syncRuns.find(
        (row) => row.id === prepared.run.id && row.businessId === scope.businessId,
      );
      if (run?.status !== "running")
        throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
      run.status = "succeeded";
      run.source = snapshot.source;
      run.completedAt = new Date();
      run.errorCode = null;
      state.auditEvents.push({
        id: randomUUID(),
        ...scope,
        action: "banking.synchronized",
        entityId: run.id,
        metadata: {
          planningVersion,
          source: snapshot.source,
          movementCount: snapshot.movements.length,
          billCount: snapshot.bills.length,
        },
        createdAt: new Date(),
      });
      return v.parse(syncResultSchema, {
        run: mapSyncRun(run),
        planningVersion,
        movementCount: snapshot.movements.length,
        billCount: snapshot.bills.length,
        warnings: snapshot.warnings,
      });
    });
  }

  private async markFailed(scope: DatabaseScope, runId: string, errorCode: string): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.database.transaction(scope, async (state) => {
          const run = state.syncRuns.find(
            (row) =>
              row.businessId === scope.businessId && row.id === runId && row.status === "running",
          );
          if (run) {
            run.status = "failed";
            run.completedAt = new Date();
            run.errorCode = errorCode;
          }
        });
        return;
      } catch (error: unknown) {
        if (
          !(error instanceof ApiError) ||
          error.code !== "PLANNING_VERSION_CONFLICT" ||
          attempt === 2
        )
          throw error;
      }
    }
  }

  private upsertMovement(
    state: BusinessState,
    scope: DatabaseScope,
    account: BankAccount,
    movement: NormalizedMovement,
  ): void {
    const identity = {
      businessId: scope.businessId,
      accountId: account.id,
      provider: account.provider,
      resourceType: movement.resource,
      externalId: movement.externalId,
    };
    const existing = state.movements.find(
      (row) =>
        row.businessId === identity.businessId &&
        row.accountId === identity.accountId &&
        row.provider === identity.provider &&
        row.resourceType === identity.resourceType &&
        row.externalId === identity.externalId,
    );
    if (
      existing &&
      materiallyChanged(existing, movement) &&
      state.reconciliations.some(
        (row) =>
          row.businessId === scope.businessId && row.movementId === existing.id && row.active,
      )
    )
      throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
    const data = {
      status: movement.status,
      direction: movement.direction,
      amount: new Decimal(movement.amount),
      bookedDate: new Date(`${movement.date}T00:00:00.000Z`),
      description: movement.description,
      updatedAt: new Date(),
    };
    if (existing) Object.assign(existing, data);
    else
      state.movements.push({
        id: randomUUID(),
        ...identity,
        ...data,
        classification: movement.classification,
        category: null,
        createdAt: new Date(),
      });
  }

  private assertSourceContinuity(
    state: BusinessState,
    scope: DatabaseScope,
    account: BankAccount,
    snapshot: BankingSnapshot,
  ): void {
    const previous = state.movements.filter(
      (row) =>
        row.businessId === scope.businessId &&
        row.accountId === account.id &&
        row.provider === account.provider,
    );
    if (previous.length > 500) throw new BankingProviderError("PROVIDER_INPUT_LIMIT");
    const incoming = new Set(
      snapshot.movements.map((movement) => `${movement.resource}:${movement.externalId}`),
    );
    if (
      previous.some((movement) => !incoming.has(`${movement.resourceType}:${movement.externalId}`))
    )
      throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
  }

  private readAccount(
    state: BusinessState,
    businessId: string,
  ): { readonly account: BankAccount; readonly business: Business } {
    if (state.business.id !== businessId)
      throw new ApiError("BUSINESS_ACCESS_DENIED", "No tienes acceso a este negocio.", 403);
    const account = state.accounts.find((row) => row.businessId === businessId);
    if (!account)
      throw new ApiError(
        "ACCOUNT_NOT_CONFIGURED",
        "La cuenta de demostración no está configurada.",
        409,
      );
    return { account, business: state.business };
  }
}

function latestRun(state: BusinessState, businessId: string): SyncRun | undefined {
  return state.syncRuns
    .filter((row) => row.businessId === businessId)
    .reduce<SyncRun | undefined>(
      (latest, row) => (latest === undefined || row.sequence > latest.sequence ? row : latest),
      undefined,
    );
}
function dateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function bankingFreshness(business: Business, now: Date): SourceFreshness {
  if (business.source === "unavailable" || business.sourceSyncedAt === null) return "unavailable";
  const businessToday = bankingCalendarDate(now, business.timezone);
  return business.sourceSyncedAt.getTime() > now.getTime() ||
    now.getTime() - business.sourceSyncedAt.getTime() > 15 * 60 * 1_000 ||
    dateString(business.cutoff) !== businessToday
    ? "stale"
    : "current";
}

function mapSyncRun(run: SyncRun): SyncRunResult {
  return v.parse(syncRunSchema, {
    ...run,
    cutoffDate: run.cutoff ? dateString(run.cutoff) : null,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
  });
}
function materiallyChanged(existing: BankMovement, incoming: NormalizedMovement): boolean {
  return (
    existing.amount.toFixed(2) !== incoming.amount ||
    existing.status !== incoming.status ||
    existing.direction !== incoming.direction ||
    dateString(existing.bookedDate) !== incoming.date
  );
}

function mapSyncFailure(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof BankingProviderError) {
    const status =
      error.code === "PROVIDER_SCOPE_MISMATCH"
        ? 403
        : error.code === "PROVIDER_TIMEOUT"
          ? 504
          : error.code === "PROVIDER_CANCELLED"
            ? 409
            : 502;
    return new ApiError(
      error.code,
      "No fue posible publicar una actualización completa; se conserva la versión anterior.",
      status,
    );
  }
  if (error instanceof HttpException && error.getStatus() === 409)
    return new ApiError(
      "PLANNING_VERSION_CONFLICT",
      "Los datos cambiaron; vuelve a actualizar antes de continuar.",
      409,
    );
  return new ApiError("SYNC_FAILED", "No fue posible publicar la actualización.", 503);
}
