import * as v from "valibot";
import {
  dateSchema,
  forecastResultSchema,
  identifierSchema,
  labelSchema,
  positiveMoneySchema,
  resultMoneySchema,
} from "./forecast-schema.js";
import { money } from "./money.js";
import { permitsNegotiability } from "./obligation-policy.js";

const jobIdentifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(40));
const nonzeroMoneySchema = v.pipe(
  positiveMoneySchema,
  v.check((value) => money(value).gt("0"), "Amount must be positive"),
);

export const jobCostSchema = v.pipe(
  v.strictObject({
    id: jobIdentifierSchema,
    label: labelSchema,
    amount: nonzeroMoneySchema,
    date: dateSchema,
    category: labelSchema,
    negotiable: v.boolean(),
  }),
  v.check((cost) => permitsNegotiability(cost), "Payroll and tax obligations cannot be negotiated"),
);
export type JobCost = v.InferOutput<typeof jobCostSchema>;

export const supplierOptionSchema = v.strictObject({
  id: jobIdentifierSchema,
  costId: jobIdentifierSchema,
  initialAmount: positiveMoneySchema,
  deferredDate: dateSchema,
  feeAmount: positiveMoneySchema,
  deliveryMaintained: v.boolean(),
});
export type SupplierOption = v.InferOutput<typeof supplierOptionSchema>;

export const jobInputSchema = v.pipe(
  v.strictObject({
    id: jobIdentifierSchema,
    label: labelSchema,
    totalCollection: nonzeroMoneySchema,
    collectionDate: dateSchema,
    costs: v.pipe(v.array(jobCostSchema), v.minLength(1), v.maxLength(100)),
    advance: v.nullable(
      v.strictObject({
        maximumAmount: positiveMoneySchema,
        allowedDates: v.pipe(v.array(dateSchema), v.minLength(1), v.maxLength(32)),
      }),
    ),
    supplierOptions: v.pipe(v.array(supplierOptionSchema), v.maxLength(32)),
  }),
  v.check(
    (job) => new Set(job.costs.map((cost) => cost.id)).size === job.costs.length,
    "Cost identifiers must be unique",
  ),
  v.check(
    (job) =>
      new Set(job.supplierOptions.map((option) => option.id)).size === job.supplierOptions.length,
    "Supplier option identifiers must be unique",
  ),
  v.check(
    (job) => job.advance === null || money(job.advance.maximumAmount).lte(job.totalCollection),
    "An advance cannot exceed the outstanding collection",
  ),
  v.check(
    (job) =>
      job.advance === null || job.advance.allowedDates.every((date) => date < job.collectionDate),
    "Advance dates must precede final collection",
  ),
  v.check(
    (job) =>
      job.advance === null ||
      new Set(job.advance.allowedDates).size === job.advance.allowedDates.length,
    "Advance dates must be unique",
  ),
  v.check(
    (job) =>
      job.supplierOptions.every((option) => {
        const cost = job.costs.find((item) => item.id === option.costId);
        return (
          cost?.negotiable === true &&
          money(option.initialAmount).lt(cost.amount) &&
          option.deferredDate > cost.date
        );
      }),
    "Supplier options must target a negotiable cost, preserve a positive deferred remainder and use a later date",
  ),
);
export type JobInput = v.InferOutput<typeof jobInputSchema>;

export const jobSelectionSchema = v.variant("kind", [
  v.strictObject({ kind: v.literal("original") }),
  v.strictObject({ kind: v.literal("advance"), amount: positiveMoneySchema, date: dateSchema }),
  v.strictObject({ kind: v.literal("supplier"), optionId: jobIdentifierSchema }),
]);
export type JobSelection = v.InferOutput<typeof jobSelectionSchema>;

export const pendingConditionSchema = v.strictObject({
  id: identifierSchema,
  kind: v.picklist(["customer_advance", "supplier_agreement", "delivery"]),
  description: v.string(),
  status: v.literal("pending"),
  eventId: v.nullable(identifierSchema),
});
export type PendingCondition = v.InferOutput<typeof pendingConditionSchema>;

export const jobAlternativeSchema = v.strictObject({
  id: identifierSchema,
  selection: jobSelectionSchema,
  forecast: forecastResultSchema,
  feasibility: v.picklist([
    "feasible",
    "infeasible",
    "horizon_limited",
    "insufficient_information",
  ]),
  reasons: v.array(
    v.picklist([
      "insufficient_capacity",
      "advance_limit",
      "late_advance",
      "delivery_not_maintained",
      "outside_horizon",
      "missing_information",
    ]),
  ),
  pendingConditions: v.array(pendingConditionSchema),
  knownFees: resultMoneySchema,
  totalJobIncome: resultMoneySchema,
  totalJobCost: resultMoneySchema,
});
export type JobAlternative = v.InferOutput<typeof jobAlternativeSchema>;

export const jobEvaluationResultSchema = v.strictObject({
  jobId: jobIdentifierSchema,
  baseline: forecastResultSchema,
  original: jobAlternativeSchema,
  alternatives: v.array(jobAlternativeSchema),
  searchStatus: v.picklist([
    "feasible_alternative",
    "no_feasible_alternative",
    "insufficient_information",
  ]),
  searchScope: v.string(),
});
export type JobEvaluationResult = v.InferOutput<typeof jobEvaluationResultSchema>;
