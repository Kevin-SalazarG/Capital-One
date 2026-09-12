import { createHash, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import * as v from "valibot";
import {
  type AuditEvent,
  type BusinessState,
  type Decision,
  type DecisionCondition,
  toJson,
} from "../../platform/database/business-state.js";
import { DatabaseService, type DatabaseScope } from "../../platform/database/database.service.js";
import { ApiError } from "../../platform/http/api-error.js";
import type { PageQuery } from "../../platform/http/http-schemas.js";
import { BusinessesService } from "../businesses/businesses.service.js";
import { CommitmentsService } from "../commitments/commitments.service.js";
import { deriveJobEvents } from "../planning/domain/job-events.js";
import type { JobAlternative } from "../planning/domain/job-schema.js";
import { PlanningService, planningSourceRequiresReview } from "../planning/planning.service.js";
import {
  type ConditionUpdateInput,
  type ConfirmationResult,
  type ConfirmDecisionInput,
  type DecisionHistory,
  type DecisionList,
  type DecisionResult,
  type DecisionReview,
  type DecisionSummary,
  type ReevaluateDecisionInput,
  confirmationResultSchema,
  decisionConditionSchema,
  decisionResultSchema,
  decisionReviewSchema,
  decisionSummarySchema,
} from "./decision-schemas.js";

interface DecisionWithConditions extends Decision {
  readonly conditions: DecisionCondition[];
}

interface EffectiveDecision {
  readonly decision: DecisionWithConditions;
  readonly evidenceNeedsReview: boolean;
}

@Injectable()
export class DecisionsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(BusinessesService) private readonly businesses: BusinessesService,
    @Inject(CommitmentsService) private readonly commitments: CommitmentsService,
    @Inject(PlanningService) private readonly planning: PlanningService,
  ) {}

  async confirm(scope: DatabaseScope, input: ConfirmDecisionInput): Promise<ConfirmationResult> {
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          evaluationId: input.evaluationId,
          alternativeId: input.alternativeId,
          expectedVersion: input.expectedVersion,
        }),
      )
      .digest("hex");
    try {
      return await this.database.transaction(scope, async (transaction) => {
        const previous = await this.findReplay(
          transaction,
          scope,
          input.idempotencyKey,
          requestHash,
        );
        if (previous) return previous;
        const evaluation = await this.planning.getInTransaction(
          transaction,
          scope.businessId,
          input.evaluationId,
        );
        const currentSource = await this.planning.sourceStateInTransaction(
          transaction,
          scope.businessId,
        );
        const existingJob = transaction.decisions.find(
          (decision) =>
            decision.businessId === scope.businessId && decision.jobId === evaluation.job.id,
        );
        if (existingJob) {
          throw new ApiError(
            "JOB_ALREADY_REGISTERED",
            "Este trabajo ya tiene una decisión registrada. Revisa su ficha existente.",
            409,
          );
        }
        if (planningSourceRequiresReview(currentSource)) {
          throw new ApiError(
            "SOURCE_REQUIRES_REFRESH",
            "Actualiza la fuente antes de registrar esta decisión.",
            409,
          );
        }
        if (
          evaluation.validity !== "current" ||
          evaluation.planningVersion !== input.expectedVersion
        ) {
          throw new ApiError(
            "EVALUATION_STALE",
            "La evaluación cambió o perdió vigencia. Vuelve a calcular.",
            409,
          );
        }
        const alternative =
          input.alternativeId === "original"
            ? evaluation.result.original
            : evaluation.result.alternatives.find((item) => item.id === input.alternativeId);
        this.assertConfirmable(alternative);
        const version = await this.database.advanceVersion(
          transaction,
          scope.businessId,
          input.expectedVersion,
        );
        const createdAt = new Date();
        const decision: Decision = {
          id: randomUUID(),
          businessId: scope.businessId,
          evaluationId: evaluation.id,
          jobId: evaluation.job.id,
          alternativeId: alternative.id,
          status: "registered",
          createdBy: scope.userId,
          creationVersion: version,
          createdAt,
          updatedAt: createdAt,
        };
        transaction.decisions.push(decision);
        await this.commitments.registerEventsInTransaction(
          transaction,
          scope.businessId,
          decision.id,
          deriveJobEvents(evaluation.job, alternative.selection),
        );
        for (const condition of alternative.pendingConditions) {
          transaction.conditions.push({
            id: randomUUID(),
            businessId: scope.businessId,
            decisionId: decision.id,
            kind: condition.kind,
            status: "pending",
            evidence: null,
            updatedBy: null,
            updatedAt: createdAt,
          });
        }
        transaction.idempotency.push({
          id: randomUUID(),
          businessId: scope.businessId,
          userId: scope.userId,
          key: input.idempotencyKey,
          requestHash,
          decisionId: decision.id,
          createdAt,
        });
        transaction.auditEvents.push({
          id: randomUUID(),
          ...scope,
          action: "decision.registered",
          entityId: decision.id,
          metadata: {
            evaluationId: evaluation.id,
            alternativeId: alternative.id,
            planningVersion: version,
          },
          createdAt,
        });
        return this.mapConfirmation(decision);
      });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.getStatus() === 409) {
        const replay = await this.database.transaction(scope, async (transaction) =>
          this.findReplay(transaction, scope, input.idempotencyKey, requestHash),
        );
        if (replay) return replay;
      }
      throw error;
    }
  }

  async get(scope: DatabaseScope, id: string): Promise<DecisionResult> {
    return this.database.transaction(scope, async (transaction) =>
      this.getInTransaction(transaction, scope.businessId, id),
    );
  }

  async list(scope: DatabaseScope, page: PageQuery): Promise<DecisionList> {
    return this.database.transaction(scope, async (transaction) =>
      this.listInTransaction(transaction, scope.businessId, page),
    );
  }

  async listInTransaction(
    transaction: BusinessState,
    businessId: string,
    page: PageQuery,
  ): Promise<DecisionList> {
    const business = await this.businesses.getInTransaction(transaction, businessId);
    const source = await this.planning.sourceStateInTransaction(transaction, businessId);
    const sourceNeedsReview = planningSourceRequiresReview(source);
    const decisions = transaction.decisions
      .filter((decision) => decision.businessId === businessId)
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id),
      );
    const rows = decisions
      .slice(page.offset, page.offset + page.limit)
      .map((decision) => this.withConditions(transaction, decision));
    const decisionIds = new Set(rows.map((row) => row.id));
    const reviews = transaction.auditEvents
      .filter(
        (event) =>
          event.businessId === businessId &&
          event.action === "decision.reevaluated" &&
          event.entityId !== null &&
          decisionIds.has(event.entityId),
      )
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id),
      );
    const effective = await Promise.all(
      rows.map((row) => this.effectiveDecisionInTransaction(transaction, businessId, row)),
    );
    return {
      items: effective.map((item) =>
        this.mapSummary(
          item.decision,
          business.planningVersion,
          this.parseReview(reviews.find((review) => review.entityId === item.decision.id)),
          sourceNeedsReview || item.evidenceNeedsReview,
        ),
      ),
      total: decisions.length,
    };
  }

  async updateCondition(
    scope: DatabaseScope,
    id: string,
    conditionId: string,
    input: ConditionUpdateInput,
  ): Promise<DecisionResult> {
    return this.database.transaction(scope, async (transaction) => {
      const decision = await this.findDecision(transaction, scope.businessId, id);
      const condition = decision.conditions.find((item) => item.id === conditionId);
      if (!condition) throw new ApiError("NOT_FOUND", "Condición no encontrada.", 404);
      if (
        condition.kind === "customer_advance" &&
        input.status === "confirmed" &&
        !(await this.commitments.hasReconciledDecisionAdvanceInTransaction(
          transaction,
          scope.businessId,
          id,
        ))
      ) {
        throw new ApiError(
          "RECEIPT_EVIDENCE_REQUIRED",
          "Concilia el anticipo completo con dinero observado antes de confirmarlo.",
          409,
        );
      }
      const version = await this.database.advanceVersion(
        transaction,
        scope.businessId,
        input.expectedVersion,
      );
      const previousStatus = condition.status;
      condition.status = input.status;
      condition.evidence = input.evidence;
      condition.updatedBy = scope.userId;
      condition.updatedAt = new Date();
      if (condition.kind === "supplier_agreement" || condition.kind === "delivery") {
        const supplierConfirmed =
          decision.conditions.some(
            (item) => item.kind === "supplier_agreement" && item.status === "confirmed",
          ) &&
          decision.conditions.some(
            (item) => item.kind === "delivery" && item.status === "confirmed",
          );
        await this.commitments.setSupplierAgreementInTransaction(
          transaction,
          scope.businessId,
          id,
          supplierConfirmed,
        );
      }
      transaction.auditEvents.push({
        id: randomUUID(),
        ...scope,
        action: "decision.condition_updated",
        entityId: id,
        metadata: {
          conditionId,
          previousStatus,
          status: input.status,
          evidence: input.evidence,
          planningVersion: version,
        },
        createdAt: condition.updatedAt,
      });
      return this.getInTransaction(transaction, scope.businessId, id);
    });
  }

  async reevaluate(
    scope: DatabaseScope,
    id: string,
    input: ReevaluateDecisionInput,
  ): Promise<DecisionResult> {
    return this.database.transaction(scope, async (transaction) => {
      const decision = await this.findDecision(transaction, scope.businessId, id);
      const evaluation = await this.planning.getInTransaction(
        transaction,
        scope.businessId,
        decision.evaluationId,
      );
      const snapshot = await this.planning.snapshotInTransaction(transaction, scope.businessId, {
        collectionDelayDays: evaluation.snapshot.input.collectionDelayDays,
      });
      if (snapshot.planningVersion !== input.expectedVersion) {
        throw new ApiError(
          "PLANNING_VERSION_CONFLICT",
          "Los datos cambiaron. Actualiza la versión.",
          409,
        );
      }
      // Registered commitments and reconciled remainders already contain this job exactly once.
      const result = this.planning.forecastFromSnapshot(snapshot);
      const review = v.parse(decisionReviewSchema, {
        id: randomUUID(),
        decisionId: id,
        planningVersion: snapshot.planningVersion,
        reviewedAt: snapshot.calculatedAt,
        snapshot,
        result,
      });
      transaction.auditEvents.push({
        id: review.id,
        ...scope,
        action: "decision.reevaluated",
        entityId: id,
        metadata: toJson(review),
        createdAt: new Date(review.reviewedAt),
      });
      return this.getInTransaction(transaction, scope.businessId, id);
    });
  }

  async history(scope: DatabaseScope, id: string, page: PageQuery): Promise<DecisionHistory> {
    return this.database.transaction(scope, async (transaction) => {
      const decision = await this.findDecision(transaction, scope.businessId, id);
      const reviews = this.reviewEvents(transaction, scope.businessId, id);
      const rows = reviews.slice(page.offset, page.offset + page.limit);
      return {
        evaluation: await this.planning.getInTransaction(
          transaction,
          scope.businessId,
          decision.evaluationId,
        ),
        reviews: rows.map((row) => v.parse(decisionReviewSchema, row.metadata)),
        totalReviews: reviews.length,
      };
    });
  }

  private assertConfirmable(
    alternative: JobAlternative | undefined,
  ): asserts alternative is JobAlternative {
    if (!alternative)
      throw new ApiError(
        "ALTERNATIVE_NOT_FOUND",
        "La alternativa no pertenece a la evaluación.",
        400,
      );
    if (alternative.feasibility !== "feasible" || alternative.forecast.availability !== "ready") {
      throw new ApiError(
        "ALTERNATIVE_INFEASIBLE",
        "La alternativa no cubre las restricciones evaluadas.",
        409,
      );
    }
  }

  private async findReplay(
    transaction: BusinessState,
    scope: DatabaseScope,
    key: string,
    hash: string,
  ): Promise<ConfirmationResult | null> {
    const previous = transaction.idempotency.find(
      (record) =>
        record.businessId === scope.businessId &&
        record.userId === scope.userId &&
        record.key === key,
    );
    if (!previous) return null;
    if (previous.requestHash !== hash)
      throw new ApiError("IDEMPOTENCY_CONFLICT", "La clave ya se utilizó con otra solicitud.", 409);
    return this.mapConfirmation(
      await this.findDecision(transaction, scope.businessId, previous.decisionId),
    );
  }

  private mapConfirmation(decision: Decision): ConfirmationResult {
    return v.parse(confirmationResultSchema, {
      decisionId: decision.id,
      evaluationId: decision.evaluationId,
      alternativeId: decision.alternativeId,
      planningVersion: decision.creationVersion,
      registeredAt: decision.createdAt.toISOString(),
    });
  }

  private async findDecision(
    transaction: BusinessState,
    businessId: string,
    id: string,
  ): Promise<DecisionWithConditions> {
    const decision = transaction.decisions.find(
      (record) => record.id === id && record.businessId === businessId,
    );
    if (!decision) throw new ApiError("NOT_FOUND", "Decisión no encontrada.", 404);
    return this.withConditions(transaction, decision);
  }

  private async getInTransaction(
    transaction: BusinessState,
    businessId: string,
    id: string,
  ): Promise<DecisionResult> {
    const decision = await this.findDecision(transaction, businessId, id);
    const effective = await this.effectiveDecisionInTransaction(transaction, businessId, decision);
    const evaluation = await this.planning.getInTransaction(
      transaction,
      businessId,
      decision.evaluationId,
    );
    const review = this.parseReview(this.reviewEvents(transaction, businessId, id)[0]);
    const source = await this.planning.sourceStateInTransaction(transaction, businessId);
    const sourceNeedsReview = planningSourceRequiresReview(source) || effective.evidenceNeedsReview;
    return v.parse(decisionResultSchema, {
      ...this.mapSummary(
        effective.decision,
        evaluation.currentPlanningVersion,
        review,
        sourceNeedsReview,
      ),
      conditions: effective.decision.conditions.map((condition) => this.mapCondition(condition)),
      evaluation,
      latestReview: review,
    });
  }

  private mapSummary(
    decision: DecisionWithConditions,
    currentVersion: number,
    review: DecisionReview | null,
    sourceNeedsReview: boolean,
  ): DecisionSummary {
    const lastVersion = review?.planningVersion ?? decision.creationVersion;
    const calculatedAt = review?.reviewedAt ?? decision.createdAt.toISOString();
    const expired = Date.now() - Date.parse(calculatedAt) > 15 * 60 * 1000;
    return v.parse(decisionSummarySchema, {
      id: decision.id,
      evaluationId: decision.evaluationId,
      alternativeId: decision.alternativeId,
      createdAt: decision.createdAt.toISOString(),
      creationVersion: decision.creationVersion,
      currentPlanningVersion: currentVersion,
      validity:
        lastVersion === currentVersion && !expired && !sourceNeedsReview
          ? "current"
          : "review_needed",
      conditionStatus:
        decision.conditions.length === 0
          ? "none"
          : decision.conditions.some((condition) => condition.status !== "confirmed")
            ? "pending"
            : "confirmed",
    });
  }

  private mapCondition(
    condition: DecisionCondition,
  ): v.InferOutput<typeof decisionConditionSchema> {
    return v.parse(decisionConditionSchema, {
      id: condition.id,
      kind: condition.kind,
      status: condition.status,
      evidence: condition.evidence,
      updatedAt: condition.updatedAt.toISOString(),
    });
  }

  private async effectiveDecisionInTransaction(
    transaction: BusinessState,
    businessId: string,
    decision: DecisionWithConditions,
  ): Promise<EffectiveDecision> {
    const requiresReceipt = decision.conditions.some(
      (condition) => condition.kind === "customer_advance" && condition.status === "confirmed",
    );
    if (
      !requiresReceipt ||
      (await this.commitments.hasReconciledDecisionAdvanceInTransaction(
        transaction,
        businessId,
        decision.id,
      ))
    ) {
      return { decision, evidenceNeedsReview: false };
    }
    return {
      decision: {
        ...decision,
        conditions: decision.conditions.map((condition) =>
          condition.kind === "customer_advance" ? { ...condition, status: "pending" } : condition,
        ),
      },
      evidenceNeedsReview: true,
    };
  }

  private parseReview(event: AuditEvent | undefined): DecisionReview | null {
    return event === undefined ? null : v.parse(decisionReviewSchema, event.metadata);
  }

  private withConditions(state: BusinessState, decision: Decision): DecisionWithConditions {
    return {
      ...decision,
      conditions: state.conditions.filter(
        (condition) =>
          condition.businessId === decision.businessId && condition.decisionId === decision.id,
      ),
    };
  }

  private reviewEvents(state: BusinessState, businessId: string, decisionId: string): AuditEvent[] {
    return state.auditEvents
      .filter(
        (event) =>
          event.businessId === businessId &&
          event.action === "decision.reevaluated" &&
          event.entityId === decisionId,
      )
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id),
      );
  }
}
