import { z } from "zod";

export const moneySchema = z
  .union([z.string(), z.number().finite()])
  .transform(String)
  .pipe(z.string().regex(/^-?\d+(\.\d+)?$/));
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string().nullable().optional(),
  rfc: z.string().nullable().optional(),
  currency: z.string(),
  timeZone: z.string(),
  minimumCashReserve: moneySchema.default("0.00"),
  role: z
    .enum(["owner", "admin", "analyst", "operator", "viewer"])
    .default("viewer"),
  permissions: z.array(z.string()).default([]),
});
export type Organization = z.infer<typeof organizationSchema>;
export const userSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
});
export const meSchema = z.object({
  user: userSchema,
  organizations: z.array(organizationSchema),
});
export type Session = z.infer<typeof meSchema>;
export const authSchema = z.object({
  user: userSchema,
  expiresAt: z.number().nullable(),
  requiresEmailConfirmation: z.boolean(),
});
export const recommendationStatusSchema = z.enum([
  "open",
  "accepted",
  "dismissed",
  "completed",
]);
export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>;
export const evidenceSchema = z.record(z.string(), z.unknown());
export const dashboardSchema = z.object({
  organization: z.object({
    id: z.string(),
    name: z.string(),
    currency: z.string(),
    timeZone: z.string(),
  }),
  asOf: z.string(),
  currentBalance: moneySchema,
  safetyThreshold: moneySchema,
  forecast: z.array(
    z.object({
      date: z.string(),
      openingBalance: moneySchema,
      projectedBalance: moneySchema,
      inflows: moneySchema,
      outflows: moneySchema,
      isBelowThreshold: z.boolean(),
    }),
  ),
  gap: z
    .object({
      date: z.string(),
      deficit: moneySchema,
      severity: z.enum(["warning", "critical"]),
      explanation: z.string(),
    })
    .nullable(),
  recommendation: z
    .object({
      id: z.string(),
      type: z.enum([
        "collect_receivable",
        "schedule_payment",
        "reduce_outflow",
        "increase_buffer",
      ]),
      title: z.string(),
      amount: moneySchema,
      status: recommendationStatusSchema,
      evidence: evidenceSchema,
    })
    .nullable(),
  dataFreshness: z.object({
    bankLastSyncedAt: z.string().nullable(),
    forecastCompletedAt: z.string().nullable(),
  }),
});
export type Dashboard = z.infer<typeof dashboardSchema>;
export const connectionSchema = z.object({
  id: z.string(),
  kind: z.enum(["bank", "cfdi"]),
  provider: z.enum(["nessie", "synthetic_cfdi"]),
  displayName: z.string(),
  status: z.enum(["active", "paused", "revoked", "error"]),
  lastSyncedAt: z.string().nullable(),
  lastErrorCode: z.string().nullable(),
  externalCustomerId: z.string().nullable(),
});
export type Connection = z.infer<typeof connectionSchema>;
export const accountSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  name: z.string(),
  type: z.string(),
  currency: z.string(),
  balance: moneySchema,
  lastSyncedAt: z.string().nullable(),
});
export const transactionSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  direction: z.enum(["inflow", "outflow", "transfer"]),
  amount: moneySchema,
  currency: z.string(),
  description: z.string().nullable(),
  postedAt: z.string(),
  status: z.string(),
  category: z.string().nullable(),
});
export const invoiceSchema = z.object({
  id: z.string(),
  cfdiUuid: z.string(),
  direction: z.enum(["receivable", "payable"]),
  counterpartyName: z.string().nullable(),
  issuerRfc: z.string(),
  receiverRfc: z.string(),
  issuedAt: z.string(),
  dueOn: z.string().nullable(),
  totalAmount: moneySchema,
  outstandingAmount: moneySchema,
  currency: z.string(),
  paymentStatus: z.enum(["pending", "partial", "paid", "overdue", "cancelled"]),
});
export type Invoice = z.infer<typeof invoiceSchema>;
export const syncSchema = z.object({
  syncRunId: z.string(),
  status: z.literal("completed"),
  recordsRead: z.number(),
  recordsWritten: z.number(),
  syncedAt: z.string(),
});
export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().nullable().optional(),
  role: organizationSchema.shape.role,
  status: z.enum(["active", "invited", "suspended"]),
  joinedAt: z.string().nullable(),
});
export type Member = z.infer<typeof memberSchema>;
export const obligationSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: moneySchema,
  currency: z.string(),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  nextDueOn: z.string(),
});
export const acknowledgmentSchema = z.unknown();
