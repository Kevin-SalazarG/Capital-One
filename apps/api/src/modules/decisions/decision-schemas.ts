import * as v from "valibot";
import { identifierSchema, versionSchema } from "../../platform/http/http-schemas.js";
import {
  evaluationResultSchema,
  forecastEnvelopeSchema,
  planningSnapshotSchema,
} from "../planning/planning-schemas.js";

export const confirmDecisionSchema = v.strictObject({
  evaluationId: identifierSchema,
  alternativeId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  expectedVersion: versionSchema,
  idempotencyKey: v.pipe(v.string(), v.minLength(8), v.maxLength(120), v.regex(/^[A-Za-z0-9_-]+$/)),
});
export type ConfirmDecisionInput = v.InferOutput<typeof confirmDecisionSchema>;
export const confirmationResultSchema = v.strictObject({
  decisionId: identifierSchema,
  evaluationId: identifierSchema,
  alternativeId: v.string(),
  planningVersion: versionSchema,
  registeredAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type ConfirmationResult = v.InferOutput<typeof confirmationResultSchema>;

export const conditionUpdateSchema = v.strictObject({
  expectedVersion: versionSchema,
  status: v.picklist(["pending", "confirmed"]),
  evidence: v.pipe(v.string(), v.minLength(5), v.maxLength(1000)),
});
export type ConditionUpdateInput = v.InferOutput<typeof conditionUpdateSchema>;
export const decisionConditionSchema = v.strictObject({
  id: identifierSchema,
  kind: v.picklist(["customer_advance", "supplier_agreement", "delivery"]),
  status: v.picklist(["pending", "confirmed"]),
  evidence: v.nullable(v.string()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type DecisionConditionResult = v.InferOutput<typeof decisionConditionSchema>;
export const reevaluateDecisionSchema = v.strictObject({ expectedVersion: versionSchema });
export type ReevaluateDecisionInput = v.InferOutput<typeof reevaluateDecisionSchema>;
export const decisionReviewSchema = v.strictObject({
  id: identifierSchema,
  decisionId: identifierSchema,
  planningVersion: versionSchema,
  reviewedAt: v.pipe(v.string(), v.isoTimestamp()),
  snapshot: planningSnapshotSchema,
  result: forecastEnvelopeSchema,
});
export type DecisionReview = v.InferOutput<typeof decisionReviewSchema>;

const summaryFields = {
  id: identifierSchema,
  evaluationId: identifierSchema,
  alternativeId: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  creationVersion: versionSchema,
  currentPlanningVersion: versionSchema,
  validity: v.picklist(["current", "review_needed"]),
  conditionStatus: v.picklist(["pending", "confirmed", "none"]),
};
export const decisionSummarySchema = v.strictObject(summaryFields);
export type DecisionSummary = v.InferOutput<typeof decisionSummarySchema>;
export const decisionResultSchema = v.strictObject({
  ...summaryFields,
  conditions: v.array(decisionConditionSchema),
  evaluation: evaluationResultSchema,
  latestReview: v.nullable(decisionReviewSchema),
});
export type DecisionResult = v.InferOutput<typeof decisionResultSchema>;
export const decisionListSchema = v.strictObject({
  items: v.array(decisionSummarySchema),
  total: v.number(),
});
export type DecisionList = v.InferOutput<typeof decisionListSchema>;
export const decisionHistorySchema = v.strictObject({
  evaluation: evaluationResultSchema,
  reviews: v.array(decisionReviewSchema),
  totalReviews: v.number(),
});
export type DecisionHistory = v.InferOutput<typeof decisionHistorySchema>;
