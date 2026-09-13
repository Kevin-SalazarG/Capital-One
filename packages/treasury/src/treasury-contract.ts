import { z } from "zod";

export const ENGINE_VERSION = "treasury-v2";
const money = z.string().regex(/^-?\d{1,15}(\.\d{1,4})?$/);
const positiveMoney = z.string().regex(/^\d{1,15}(\.\d{1,4})?$/);
export const daySchema = z.iso.date();
export const eventSchema = z.object({
  id: z.string(),
  date: daySchema,
  amount: money,
  label: z.string(),
  source: z.enum(["invoice", "obligation"]),
  sourceId: z.string(),
  category: z
    .enum(["payroll", "tax", "rent", "supplier", "other"])
    .default("other"),
  critical: z.boolean().default(false),
  earliestDate: daySchema.nullable().default(null),
  latestDate: daySchema.nullable().default(null),
  negotiationCost: positiveMoney.default("0.00"),
});
export const treasuryInputSchema = z.object({
  asOf: daySchema,
  horizonDays: z.number().int().min(1).max(90),
  currency: z.string().regex(/^[A-Z]{3}$/),
  currentBalance: money,
  reserve: positiveMoney,
  dailyOperatingExpense: positiveMoney,
  events: z.array(eventSchema).max(2000),
  warnings: z.array(z.string()).default([]),
});
export type TreasuryInput = z.infer<typeof treasuryInputSchema>;
export type TreasuryEvent = z.infer<typeof eventSchema>;
export const actionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  label: z.string(),
  kind: z.enum(["collect", "defer"]),
  from: daySchema,
  to: daySchema,
  amount: positiveMoney,
  cost: positiveMoney,
});
export type TreasuryAction = z.infer<typeof actionSchema>;
export const pointSchema = z.object({
  date: daySchema,
  opening: money,
  inflows: money,
  outflows: money,
  closing: money,
  criticalAmount: positiveMoney,
  events: z.array(z.string()),
});
export const summarySchema = z.object({
  minimumBalance: money,
  worstDate: daySchema,
  reserveShortfall: positiveMoney,
  cashShortfall: positiveMoney,
  daysBelowReserve: z.number(),
  criticalAtRisk: z.number(),
  firstRiskDate: daySchema.nullable(),
});
export const projectionSchema = z.object({
  points: z.array(pointSchema),
  summary: summarySchema,
});
export const planSchema = z.object({
  id: z.string(),
  title: z.string(),
  actions: z.array(actionSchema),
  cost: positiveMoney,
  improvement: positiveMoney,
  projection: projectionSchema,
});
export const decisionSchema = z.object({
  id: z.string(),
  inputHash: z.string(),
  planId: z.string(),
  createdAt: z.string(),
  plan: planSchema,
  steps: z.record(z.string(), z.enum(["pending", "contacted", "agreed"])),
});
export const treasurySchema = z.object({
  version: z.literal(ENGINE_VERSION),
  inputHash: z.string(),
  input: treasuryInputSchema,
  baseline: projectionSchema,
  plans: z.array(planSchema),
  criticalEvents: z.array(eventSchema),
  decision: decisionSchema.nullable().default(null),
});
export type Treasury = z.infer<typeof treasurySchema>;
export type TreasuryPlan = z.infer<typeof planSchema>;
export type TreasuryDecision = z.infer<typeof decisionSchema>;
export type Projection = z.infer<typeof projectionSchema>;

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const annualHistoryPointSchema = z.object({
  month: monthSchema,
  currentBalance: money,
  previousBalance: money.nullable(),
});
export const annualHistorySchema = z.object({
  asOf: daySchema,
  currentYear: z.number().int().min(2000).max(9999),
  previousYear: z.number().int().min(2000).max(9999),
  currency: z.string().regex(/^[A-Z]{3}$/),
  hasPreviousYear: z.boolean(),
  reserve: positiveMoney,
  source: z.enum(["demo", "bank_transactions"]),
  points: z.array(annualHistoryPointSchema).min(1).max(12),
  summary: z.object({
    currentBalance: money,
    previousBalance: money.nullable(),
    difference: money,
    direction: z.enum(["positive", "negative", "flat"]),
  }),
});
export type AnnualHistory = z.infer<typeof annualHistorySchema>;
