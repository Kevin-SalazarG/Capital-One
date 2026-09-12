import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import * as v from "valibot";
import {
  type BusinessState,
  type Evaluation,
  toJson,
} from "../../platform/database/business-state.js";
import { DatabaseService, type DatabaseScope } from "../../platform/database/database.service.js";
import { ApiError } from "../../platform/http/api-error.js";
import type { PageQuery } from "../../platform/http/http-schemas.js";
import { BankingService } from "../banking/banking.service.js";
import type { SourceFreshness } from "../banking/banking-schemas.js";
import { BusinessesService } from "../businesses/businesses.service.js";
import { CommitmentsService } from "../commitments/commitments.service.js";
import { evaluateJob } from "./domain/evaluate-job.js";
import { calculateForecast } from "./domain/forecast-engine.js";
import { ENGINE_VERSION, forecastInputSchema } from "./domain/forecast-schema.js";
import {
  type EvaluationInput,
  type EvaluationList,
  type EvaluationResult,
  type EvaluationSummary,
  type ForecastEnvelope,
  type ForecastOptions,
  type PlanningSnapshot,
  evaluationResultSchema,
  evaluationSummarySchema,
  forecastEnvelopeSchema,
  planningSnapshotSchema,
} from "./planning-schemas.js";

const MAX_SNAPSHOT_AGE_MS = 15 * 60 * 1000;
const MAX_EVALUATION_ATTEMPTS = 3;

export interface PlanningSourceState {
  readonly source: string;
  readonly freshness: SourceFreshness;
  readonly lastSyncFailed: boolean;
}

export function planningSourceRequiresReview(source: PlanningSourceState): boolean {
  return (
    source.lastSyncFailed ||
    source.freshness === "unavailable" ||
    (source.source !== "replay" && source.freshness !== "current")
  );
}

@Injectable()
export class PlanningService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(BusinessesService) private readonly businesses: BusinessesService,
    @Inject(CommitmentsService) private readonly commitments: CommitmentsService,
    @Inject(BankingService) private readonly banking: BankingService,
  ) {}

  async sourceStateInTransaction(
    transaction: BusinessState,
    businessId: string,
  ): Promise<PlanningSourceState> {
    const business = await this.businesses.getInTransaction(transaction, businessId);
    return {
      source: business.source,
      freshness: await this.banking.getSourceFreshnessInTransaction(transaction, businessId),
      lastSyncFailed: await this.banking.hasFailedLatestSyncInTransaction(transaction, businessId),
    };
  }

  async forecast(scope: DatabaseScope, options: ForecastOptions): Promise<ForecastEnvelope> {
    return this.database.transaction(scope, async (transaction) =>
      this.forecastInTransaction(transaction, scope.businessId, options),
    );
  }

  async snapshotInTransaction(
    transaction: BusinessState,
    businessId: string,
    options: ForecastOptions,
  ): Promise<PlanningSnapshot> {
    const business = await this.businesses.getInTransaction(transaction, businessId);
    const events = await this.commitments.forecastEventsInTransaction(transaction, businessId);
    const calculatedAt = new Date();
    const cutoffDate = business.cutoff.toISOString().slice(0, 10);
    const state = await this.sourceStateInTransaction(transaction, businessId);
    return v.parse(planningSnapshotSchema, {
      businessId,
      planningVersion: business.planningVersion,
      calculatedAt: calculatedAt.toISOString(),
      source: business.source,
      sourceSyncedAt: business.sourceSyncedAt?.toISOString() ?? null,
      lastSyncFailed: state.lastSyncFailed,
      input: v.parse(forecastInputSchema, {
        currency: business.currency,
        timezone: business.timezone,
        cutoffDate,
        openingBalance: business.openingBalance.toFixed(2),
        cushion: business.cushion.toFixed(2),
        capacityDate: options.capacityDate ?? cutoffDate,
        collectionDelayDays: options.collectionDelayDays,
        events,
        missingInformation: [
          ...(business.dataComplete
            ? []
            : ["Confirm the complete upcoming obligations and receivables."]),
          ...(state.freshness === "unavailable"
            ? ["A complete observed cash snapshot is required."]
            : []),
        ],
        sourceFreshness: state.freshness,
      }),
    });
  }

  async forecastInTransaction(
    transaction: BusinessState,
    businessId: string,
    options: ForecastOptions,
  ): Promise<ForecastEnvelope> {
    const snapshot = await this.snapshotInTransaction(transaction, businessId, options);
    return this.forecastFromSnapshot(snapshot);
  }

  forecastFromSnapshot(snapshot: PlanningSnapshot): ForecastEnvelope {
    return v.parse(forecastEnvelopeSchema, {
      businessId: snapshot.businessId,
      planningVersion: snapshot.planningVersion,
      calculatedAt: snapshot.calculatedAt,
      source: snapshot.source,
      sourceSyncedAt: snapshot.sourceSyncedAt,
      lastSyncFailed: snapshot.lastSyncFailed,
      forecast: calculateForecast(snapshot.input),
    });
  }

  async evaluate(scope: DatabaseScope, input: EvaluationInput): Promise<EvaluationResult> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await this.persistEvaluation(scope, input);
      } catch (error: unknown) {
        // A rejected CAS has no persisted evaluation; retry from a new coherent snapshot.
        if (
          !(error instanceof ApiError) ||
          error.code !== "PLANNING_VERSION_CONFLICT" ||
          attempt >= MAX_EVALUATION_ATTEMPTS
        ) {
          throw error;
        }
      }
    }
  }

  private async persistEvaluation(
    scope: DatabaseScope,
    input: EvaluationInput,
  ): Promise<EvaluationResult> {
    return this.database.transaction(scope, async (transaction) => {
      const snapshot = await this.snapshotInTransaction(transaction, scope.businessId, input);
      if (
        input.job.collectionDate <= snapshot.input.cutoffDate ||
        input.job.costs.some((cost) => cost.date <= snapshot.input.cutoffDate)
      ) {
        throw new ApiError(
          "JOB_DATES_INVALID",
          "Las fechas del nuevo trabajo deben ser posteriores al corte.",
          400,
        );
      }
      if (snapshot.input.events.length + input.job.costs.length + 3 > 500) {
        throw new ApiError(
          "PLANNING_INPUT_LIMIT",
          "El trabajo supera el límite del calendario de evaluación.",
          422,
        );
      }
      const result = evaluateJob(snapshot.input, input.job);
      const record: Evaluation = {
        id: randomUUID(),
        businessId: scope.businessId,
        createdBy: scope.userId,
        planningVersion: snapshot.planningVersion,
        engineVersion: ENGINE_VERSION,
        snapshot: toJson(snapshot),
        job: toJson(input.job),
        result: toJson(result),
        createdAt: new Date(snapshot.calculatedAt),
      };
      transaction.evaluations.push(record);
      return this.mapEvaluation(
        record,
        snapshot.planningVersion,
        planningSourceRequiresReview({
          source: snapshot.source,
          freshness: snapshot.input.sourceFreshness,
          lastSyncFailed: snapshot.lastSyncFailed,
        }),
      );
    });
  }

  async get(scope: DatabaseScope, id: string): Promise<EvaluationResult> {
    return this.database.transaction(scope, async (transaction) =>
      this.getInTransaction(transaction, scope.businessId, id),
    );
  }

  async getInTransaction(
    transaction: BusinessState,
    businessId: string,
    id: string,
  ): Promise<EvaluationResult> {
    const record = transaction.evaluations.find(
      (evaluation) => evaluation.id === id && evaluation.businessId === businessId,
    );
    if (!record) throw new ApiError("NOT_FOUND", "Evaluación no encontrada.", 404);
    const business = await this.businesses.getInTransaction(transaction, businessId);
    const source = await this.sourceStateInTransaction(transaction, businessId);
    return this.mapEvaluation(
      record,
      business.planningVersion,
      planningSourceRequiresReview(source),
    );
  }

  async list(scope: DatabaseScope, page: PageQuery): Promise<EvaluationList> {
    return this.database.transaction(scope, async (transaction) => {
      const business = await this.businesses.getInTransaction(transaction, scope.businessId);
      const source = await this.sourceStateInTransaction(transaction, scope.businessId);
      const evaluations = transaction.evaluations
        .filter((evaluation) => evaluation.businessId === scope.businessId)
        .sort(
          (left, right) =>
            right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id),
        );
      const rows = evaluations.slice(page.offset, page.offset + page.limit);
      return {
        items: rows.map((row) =>
          this.mapSummary(row, business.planningVersion, planningSourceRequiresReview(source)),
        ),
        total: evaluations.length,
      };
    });
  }

  private mapSummary(
    record: Evaluation,
    currentVersion: number,
    sourceNeedsReview: boolean,
  ): EvaluationSummary {
    return v.parse(evaluationSummarySchema, {
      id: record.id,
      businessId: record.businessId,
      planningVersion: record.planningVersion,
      currentPlanningVersion: currentVersion,
      engineVersion: record.engineVersion,
      createdAt: record.createdAt.toISOString(),
      validity:
        record.planningVersion === currentVersion &&
        !sourceNeedsReview &&
        Date.now() - record.createdAt.getTime() <= MAX_SNAPSHOT_AGE_MS
          ? "current"
          : "review_needed",
    });
  }

  private mapEvaluation(
    record: Evaluation,
    currentVersion: number,
    sourceNeedsReview: boolean,
  ): EvaluationResult {
    return v.parse(evaluationResultSchema, {
      ...this.mapSummary(record, currentVersion, sourceNeedsReview),
      snapshot: record.snapshot,
      job: record.job,
      result: record.result,
    });
  }
}
