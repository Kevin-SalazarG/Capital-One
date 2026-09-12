import * as v from "valibot";
import { identifierSchema, versionSchema } from "../../platform/http/http-schemas.js";
import { dateSchema, forecastInputSchema, forecastResultSchema } from "./domain/forecast-schema.js";
import { jobEvaluationResultSchema, jobInputSchema } from "./domain/job-schema.js";

export const forecastQuerySchema = v.strictObject({
  capacityDate: v.optional(dateSchema),
  collectionDelayDays: v.optional(
    v.pipe(v.string(), v.regex(/^\d{1,2}$/), v.transform(Number), v.minValue(0), v.maxValue(30)),
    "0",
  ),
});
export type ForecastOptions = v.InferOutput<typeof forecastQuerySchema>;
export const evaluationInputSchema = v.strictObject({
  job: jobInputSchema,
  capacityDate: v.optional(dateSchema),
  collectionDelayDays: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
    0,
  ),
});
export type EvaluationInput = v.InferOutput<typeof evaluationInputSchema>;

const metadata = {
  businessId: identifierSchema,
  planningVersion: versionSchema,
  calculatedAt: v.pipe(v.string(), v.isoTimestamp()),
  source: v.picklist(["replay", "nessie_live", "unavailable"]),
  sourceSyncedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  lastSyncFailed: v.boolean(),
};
export const planningSnapshotSchema = v.strictObject({ ...metadata, input: forecastInputSchema });
export type PlanningSnapshot = v.InferOutput<typeof planningSnapshotSchema>;
export const forecastEnvelopeSchema = v.strictObject({
  ...metadata,
  forecast: forecastResultSchema,
});
export type ForecastEnvelope = v.InferOutput<typeof forecastEnvelopeSchema>;

const evaluationMetadata = {
  id: identifierSchema,
  businessId: identifierSchema,
  planningVersion: versionSchema,
  currentPlanningVersion: versionSchema,
  engineVersion: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  validity: v.picklist(["current", "review_needed"]),
};
export const evaluationResultSchema = v.strictObject({
  ...evaluationMetadata,
  snapshot: planningSnapshotSchema,
  job: jobInputSchema,
  result: jobEvaluationResultSchema,
});
export type EvaluationResult = v.InferOutput<typeof evaluationResultSchema>;
export const evaluationSummarySchema = v.strictObject(evaluationMetadata);
export type EvaluationSummary = v.InferOutput<typeof evaluationSummarySchema>;
export const evaluationListSchema = v.strictObject({
  items: v.array(evaluationSummarySchema),
  total: v.number(),
});
export type EvaluationList = v.InferOutput<typeof evaluationListSchema>;
