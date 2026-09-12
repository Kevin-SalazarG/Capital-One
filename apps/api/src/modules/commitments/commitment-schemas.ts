import * as v from "valibot";
import { identifierSchema, textSchema, versionSchema } from "../../platform/http/http-schemas.js";
import {
  dateSchema,
  positiveMoneySchema,
  resultMoneySchema,
} from "../planning/domain/forecast-schema.js";
import { permitsNegotiability } from "../planning/domain/obligation-policy.js";

export const commitmentFields = {
  title: textSchema,
  kind: v.picklist(["inflow", "outflow"]),
  amount: positiveMoneySchema,
  dueDate: dateSchema,
  category: textSchema,
  status: v.picklist(["expected", "conditional", "cancelled"]),
  negotiable: v.boolean(),
};
export const commitmentInputSchema = v.pipe(
  v.strictObject({ expectedVersion: versionSchema, ...commitmentFields }),
  v.check(
    (commitment) => permitsNegotiability(commitment),
    "Payroll and taxes cannot be negotiable",
  ),
);
export type CommitmentInput = v.InferOutput<typeof commitmentInputSchema>;
export const commitmentResultSchema = v.object({
  id: identifierSchema,
  ...commitmentFields,
  status: v.picklist(["expected", "conditional", "settled", "cancelled"]),
  receivedAmount: resultMoneySchema,
  remainingAmount: resultMoneySchema,
  source: v.string(),
  decisionId: v.nullable(identifierSchema),
  occurrenceKey: v.nullable(v.string()),
});
export type CommitmentResult = v.InferOutput<typeof commitmentResultSchema>;
export const commitmentListSchema = v.object({
  items: v.array(commitmentResultSchema),
  total: v.number(),
  planningVersion: versionSchema,
});
export type CommitmentList = v.InferOutput<typeof commitmentListSchema>;
export const commitmentWriteSchema = v.object({
  commitment: commitmentResultSchema,
  planningVersion: versionSchema,
});
export type CommitmentWrite = v.InferOutput<typeof commitmentWriteSchema>;
export const recurringInputSchema = v.pipe(
  v.strictObject({
    ...commitmentFields,
    expectedVersion: versionSchema,
    seriesId: identifierSchema,
    dayOfMonth: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(31)),
    occurrences: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(12)),
  }),
  v.check(
    (commitment) => permitsNegotiability(commitment),
    "Payroll and taxes cannot be negotiable",
  ),
);
export type RecurringInput = v.InferOutput<typeof recurringInputSchema>;
export const reconciliationInputSchema = v.strictObject({
  expectedVersion: versionSchema,
  movementId: identifierSchema,
  commitmentId: identifierSchema,
  amount: positiveMoneySchema,
  evidence: textSchema,
});
export type ReconciliationInput = v.InferOutput<typeof reconciliationInputSchema>;
export const reconciliationSchema = v.object({
  id: identifierSchema,
  movementId: identifierSchema,
  commitmentId: identifierSchema,
  amount: resultMoneySchema,
  active: v.boolean(),
  evidence: v.object({ note: v.string() }),
  planningVersion: versionSchema,
});
export type ReconciliationResult = v.InferOutput<typeof reconciliationSchema>;
export const correctionSchema = v.strictObject({
  expectedVersion: versionSchema,
  evidence: textSchema,
});
export type CorrectionInput = v.InferOutput<typeof correctionSchema>;
export const adjustmentSchema = v.strictObject({
  expectedVersion: versionSchema,
  amount: positiveMoneySchema,
});
export type AdjustmentInput = v.InferOutput<typeof adjustmentSchema>;
export const budgetInputSchema = v.strictObject({
  expectedVersion: versionSchema,
  category: textSchema,
  periodStart: dateSchema,
  periodEnd: dateSchema,
  amount: positiveMoneySchema,
});
export type BudgetInput = v.InferOutput<typeof budgetInputSchema>;
export const budgetResultSchema = v.object({
  id: identifierSchema,
  category: textSchema,
  periodStart: dateSchema,
  periodEnd: dateSchema,
  amount: resultMoneySchema,
  paid: resultMoneySchema,
  committedUnpaid: resultMoneySchema,
  remaining: resultMoneySchema,
  adjustable: resultMoneySchema,
});
export type BudgetResult = v.InferOutput<typeof budgetResultSchema>;
export const budgetListSchema = v.object({
  items: v.array(budgetResultSchema),
  planningVersion: versionSchema,
});
export type BudgetList = v.InferOutput<typeof budgetListSchema>;
