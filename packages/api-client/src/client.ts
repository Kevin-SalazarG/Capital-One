// Generated from apps/api/openapi.json. Regenerate with pnpm generate:contracts.
import * as v from "valibot";
export const livenessResponseSchema = v.object({ status: v.literal("ok") });
export type LivenessResult = v.InferOutput<typeof livenessResponseSchema>;
export const readinessResponseSchema = v.object({ status: v.literal("ok") });
export type ReadinessResult = v.InferOutput<typeof readinessResponseSchema>;
export const loginResponseSchema = v.object({
  accessToken: v.string(),
  refreshToken: v.string(),
  expiresAt: v.number(),
  identity: v.object({ userId: v.string(), sessionId: v.string(), expiresAt: v.number() }),
});
export type LoginResult = v.InferOutput<typeof loginResponseSchema>;
export const loginRequestSchema = v.object({
  email: v.pipe(v.string(), v.maxLength(254)),
  password: v.pipe(v.string(), v.minLength(8), v.maxLength(128)),
});
export const refreshSessionResponseSchema = v.object({
  accessToken: v.string(),
  refreshToken: v.string(),
  expiresAt: v.number(),
  identity: v.object({ userId: v.string(), sessionId: v.string(), expiresAt: v.number() }),
});
export type RefreshSessionResult = v.InferOutput<typeof refreshSessionResponseSchema>;
export const refreshSessionRequestSchema = v.object({
  refreshToken: v.pipe(v.string(), v.minLength(8), v.maxLength(4096)),
});
export const getSessionResponseSchema = v.object({
  userId: v.string(),
  sessionId: v.string(),
  expiresAt: v.number(),
});
export type GetSessionResult = v.InferOutput<typeof getSessionResponseSchema>;
export const logoutResponseSchema = v.object({ success: v.literal(true) });
export type LogoutResult = v.InferOutput<typeof logoutResponseSchema>;
export const listBusinessesResponseSchema = v.array(
  v.object({
    id: v.string(),
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    currency: v.literal("MXN"),
    timezone: v.literal("America/Monterrey"),
    cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    dataComplete: v.boolean(),
    cutoffDate: v.string(),
    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
    sourceSyncedAt: v.nullable(v.string()),
  }),
);
export type ListBusinessesResult = v.InferOutput<typeof listBusinessesResponseSchema>;
export const getBusinessResponseSchema = v.object({
  id: v.string(),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  currency: v.literal("MXN"),
  timezone: v.literal("America/Monterrey"),
  cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  dataComplete: v.boolean(),
  cutoffDate: v.string(),
  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
  sourceSyncedAt: v.nullable(v.string()),
});
export type GetBusinessResult = v.InferOutput<typeof getBusinessResponseSchema>;
export const updateSettingsResponseSchema = v.object({
  id: v.string(),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  currency: v.literal("MXN"),
  timezone: v.literal("America/Monterrey"),
  cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  dataComplete: v.boolean(),
  cutoffDate: v.string(),
  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
  sourceSyncedAt: v.nullable(v.string()),
});
export type UpdateSettingsResult = v.InferOutput<typeof updateSettingsResponseSchema>;
export const updateSettingsRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  dataComplete: v.boolean(),
});
export const listCommitmentsResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      kind: v.union([v.literal("inflow"), v.literal("outflow")]),
      amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      dueDate: v.string(),
      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      status: v.union([
        v.literal("expected"),
        v.literal("conditional"),
        v.literal("settled"),
        v.literal("cancelled"),
      ]),
      negotiable: v.boolean(),
      receivedAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      remainingAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      source: v.string(),
      decisionId: v.nullable(v.string()),
      occurrenceKey: v.nullable(v.string()),
    }),
  ),
  total: v.number(),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type ListCommitmentsResult = v.InferOutput<typeof listCommitmentsResponseSchema>;
const listCommitmentsoffsetQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,6}$/));
const listCommitmentslimitQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,3}$/));
export const createCommitmentResponseSchema = v.object({
  commitment: v.object({
    id: v.string(),
    title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    kind: v.union([v.literal("inflow"), v.literal("outflow")]),
    amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    dueDate: v.string(),
    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    status: v.union([
      v.literal("expected"),
      v.literal("conditional"),
      v.literal("settled"),
      v.literal("cancelled"),
    ]),
    negotiable: v.boolean(),
    receivedAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    remainingAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    source: v.string(),
    decisionId: v.nullable(v.string()),
    occurrenceKey: v.nullable(v.string()),
  }),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type CreateCommitmentResult = v.InferOutput<typeof createCommitmentResponseSchema>;
export const createCommitmentRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  kind: v.union([v.literal("inflow"), v.literal("outflow")]),
  amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  dueDate: v.string(),
  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  status: v.union([v.literal("expected"), v.literal("conditional"), v.literal("cancelled")]),
  negotiable: v.boolean(),
});
export const updateCommitmentResponseSchema = v.object({
  commitment: v.object({
    id: v.string(),
    title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    kind: v.union([v.literal("inflow"), v.literal("outflow")]),
    amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    dueDate: v.string(),
    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    status: v.union([
      v.literal("expected"),
      v.literal("conditional"),
      v.literal("settled"),
      v.literal("cancelled"),
    ]),
    negotiable: v.boolean(),
    receivedAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    remainingAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    source: v.string(),
    decisionId: v.nullable(v.string()),
    occurrenceKey: v.nullable(v.string()),
  }),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type UpdateCommitmentResult = v.InferOutput<typeof updateCommitmentResponseSchema>;
export const updateCommitmentRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  kind: v.union([v.literal("inflow"), v.literal("outflow")]),
  amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  dueDate: v.string(),
  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  status: v.union([v.literal("expected"), v.literal("conditional"), v.literal("cancelled")]),
  negotiable: v.boolean(),
});
export const createRecurringCommitmentsResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      kind: v.union([v.literal("inflow"), v.literal("outflow")]),
      amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      dueDate: v.string(),
      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      status: v.union([
        v.literal("expected"),
        v.literal("conditional"),
        v.literal("settled"),
        v.literal("cancelled"),
      ]),
      negotiable: v.boolean(),
      receivedAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      remainingAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      source: v.string(),
      decisionId: v.nullable(v.string()),
      occurrenceKey: v.nullable(v.string()),
    }),
  ),
  total: v.number(),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type CreateRecurringCommitmentsResult = v.InferOutput<
  typeof createRecurringCommitmentsResponseSchema
>;
export const createRecurringCommitmentsRequestSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  kind: v.union([v.literal("inflow"), v.literal("outflow")]),
  amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  dueDate: v.string(),
  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  status: v.union([v.literal("expected"), v.literal("conditional"), v.literal("cancelled")]),
  negotiable: v.boolean(),
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  seriesId: v.string(),
  dayOfMonth: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(31)),
  occurrences: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(12)),
});
export const adjustOverheadResponseSchema = v.object({
  commitment: v.object({
    id: v.string(),
    title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    kind: v.union([v.literal("inflow"), v.literal("outflow")]),
    amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    dueDate: v.string(),
    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    status: v.union([
      v.literal("expected"),
      v.literal("conditional"),
      v.literal("settled"),
      v.literal("cancelled"),
    ]),
    negotiable: v.boolean(),
    receivedAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    remainingAmount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    source: v.string(),
    decisionId: v.nullable(v.string()),
    occurrenceKey: v.nullable(v.string()),
  }),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type AdjustOverheadResult = v.InferOutput<typeof adjustOverheadResponseSchema>;
export const adjustOverheadRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
});
export const reconcilePaymentResponseSchema = v.object({
  id: v.string(),
  movementId: v.string(),
  commitmentId: v.string(),
  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
  active: v.boolean(),
  evidence: v.object({ note: v.string() }),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type ReconcilePaymentResult = v.InferOutput<typeof reconcilePaymentResponseSchema>;
export const reconcilePaymentRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  movementId: v.string(),
  commitmentId: v.string(),
  amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
  evidence: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
});
export const correctReconciliationResponseSchema = v.object({
  id: v.string(),
  movementId: v.string(),
  commitmentId: v.string(),
  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
  active: v.boolean(),
  evidence: v.object({ note: v.string() }),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type CorrectReconciliationResult = v.InferOutput<typeof correctReconciliationResponseSchema>;
export const correctReconciliationRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  evidence: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
});
export const listBudgetsResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      periodStart: v.string(),
      periodEnd: v.string(),
      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      paid: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      committedUnpaid: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      remaining: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      adjustable: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    }),
  ),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type ListBudgetsResult = v.InferOutput<typeof listBudgetsResponseSchema>;
export const setBudgetResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      periodStart: v.string(),
      periodEnd: v.string(),
      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      paid: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      committedUnpaid: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      remaining: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      adjustable: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    }),
  ),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export type SetBudgetResult = v.InferOutput<typeof setBudgetResponseSchema>;
export const setBudgetRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  periodStart: v.string(),
  periodEnd: v.string(),
  amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
});
export const getBankAccountResponseSchema = v.object({
  id: v.string(),
  externalId: v.string(),
  provider: v.string(),
  currency: v.literal("MXN"),
  balance: v.pipe(v.string(), v.regex(/^-?\d{1,12}\.\d{2}$/)),
  cutoffDate: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
  sourceSyncedAt: v.nullable(v.string()),
  freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
  lastSyncStatus: v.nullable(
    v.union([v.literal("running"), v.literal("succeeded"), v.literal("failed")]),
  ),
  lastSyncErrorCode: v.nullable(v.string()),
});
export type GetBankAccountResult = v.InferOutput<typeof getBankAccountResponseSchema>;
export const listBankMovementsResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      externalId: v.string(),
      resource: v.union([v.literal("deposit"), v.literal("withdrawal")]),
      status: v.union([v.literal("pending"), v.literal("cancelled"), v.literal("completed")]),
      direction: v.union([v.literal("inflow"), v.literal("outflow")]),
      amount: v.pipe(v.string(), v.regex(/^-?\d{1,12}\.\d{2}$/)),
      currency: v.literal("MXN"),
      date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
      classification: v.string(),
      category: v.nullable(v.string()),
      description: v.nullable(v.string()),
    }),
  ),
  offset: v.number(),
  limit: v.number(),
  total: v.number(),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
  sourceSyncedAt: v.nullable(v.string()),
});
export type ListBankMovementsResult = v.InferOutput<typeof listBankMovementsResponseSchema>;
const listBankMovementsoffsetQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,6}$/));
const listBankMovementslimitQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,3}$/));
export const getBankSyncRunResponseSchema = v.object({
  id: v.string(),
  requestRevision: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  status: v.union([v.literal("running"), v.literal("succeeded"), v.literal("failed")]),
  source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
  cutoffDate: v.nullable(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
  errorCode: v.nullable(v.string()),
  startedAt: v.string(),
  completedAt: v.nullable(v.string()),
});
export type GetBankSyncRunResult = v.InferOutput<typeof getBankSyncRunResponseSchema>;
export const getLatestBankSyncRunResponseSchema = v.nullable(
  v.object({
    id: v.string(),
    requestRevision: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    status: v.union([v.literal("running"), v.literal("succeeded"), v.literal("failed")]),
    source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
    cutoffDate: v.nullable(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
    errorCode: v.nullable(v.string()),
    startedAt: v.string(),
    completedAt: v.nullable(v.string()),
  }),
);
export type GetLatestBankSyncRunResult = v.InferOutput<typeof getLatestBankSyncRunResponseSchema>;
export const refreshBankingResponseSchema = v.object({
  run: v.object({
    id: v.string(),
    requestRevision: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    status: v.union([v.literal("running"), v.literal("succeeded"), v.literal("failed")]),
    source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
    cutoffDate: v.nullable(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
    errorCode: v.nullable(v.string()),
    startedAt: v.string(),
    completedAt: v.nullable(v.string()),
  }),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  movementCount: v.number(),
  billCount: v.number(),
  warnings: v.array(v.string()),
});
export type RefreshBankingResult = v.InferOutput<typeof refreshBankingResponseSchema>;
export const refreshBankingRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export const getForecastResponseSchema = v.object({
  businessId: v.string(),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  calculatedAt: v.string(),
  source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
  sourceSyncedAt: v.nullable(v.string()),
  lastSyncFailed: v.boolean(),
  forecast: v.union([
    v.object({
      engineVersion: v.literal("1.0.0"),
      currency: v.literal("MXN"),
      timezone: v.literal("America/Monterrey"),
      cutoffDate: v.string(),
      horizonEnd: v.string(),
      capacityDate: v.string(),
      conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
      freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
      assumptions: v.array(v.string()),
      warnings: v.array(
        v.object({
          code: v.union([
            v.literal("overdue_payable"),
            v.literal("overdue_receivable"),
            v.literal("outside_horizon"),
            v.literal("conditional_cash"),
            v.literal("stale_source"),
            v.literal("unavailable_source"),
            v.literal("horizon_limit"),
          ]),
          eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          dates: v.array(v.string()),
        }),
      ),
      missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
      availability: v.literal("ready"),
      financialStatus: v.union([
        v.literal("protected"),
        v.literal("cushion_shortfall"),
        v.literal("operational_shortfall"),
      ]),
      scenarios: v.pipe(
        v.array(
          v.object({
            id: v.union([v.literal("base"), v.literal("collection_delay")]),
            delayDays: v.number(),
            daily: v.array(
              v.object({
                date: v.string(),
                openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              }),
            ),
            metrics: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
            criticalObligations: v.array(
              v.object({
                eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                date: v.string(),
                amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              }),
            ),
          }),
        ),
        v.minLength(2),
        v.maxLength(2),
      ),
      worstCase: v.object({
        minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        minimumDate: v.string(),
        closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        firstCriticalDate: v.nullable(v.string()),
        reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
    }),
    v.object({
      engineVersion: v.literal("1.0.0"),
      currency: v.literal("MXN"),
      timezone: v.literal("America/Monterrey"),
      cutoffDate: v.string(),
      horizonEnd: v.string(),
      capacityDate: v.string(),
      conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
      freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
      assumptions: v.array(v.string()),
      warnings: v.array(
        v.object({
          code: v.union([
            v.literal("overdue_payable"),
            v.literal("overdue_receivable"),
            v.literal("outside_horizon"),
            v.literal("conditional_cash"),
            v.literal("stale_source"),
            v.literal("unavailable_source"),
            v.literal("horizon_limit"),
          ]),
          eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          dates: v.array(v.string()),
        }),
      ),
      missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
      availability: v.literal("insufficient_information"),
      financialStatus: v.literal("not_evaluated"),
      scenarios: v.pipe(
        v.array(
          v.object({
            id: v.union([v.literal("base"), v.literal("collection_delay")]),
            delayDays: v.number(),
            daily: v.array(
              v.object({
                date: v.string(),
                openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              }),
            ),
            metrics: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
            criticalObligations: v.array(
              v.object({
                eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                date: v.string(),
                amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              }),
            ),
          }),
        ),
        v.minLength(0),
        v.maxLength(0),
      ),
      worstCase: v.null(),
    }),
  ]),
});
export type GetForecastResult = v.InferOutput<typeof getForecastResponseSchema>;
const getForecastcapacityDateQuerySchema = v.string();
const getForecastcollectionDelayDaysQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,2}$/));
export const listEvaluationsResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      businessId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      currentPlanningVersion: v.pipe(
        v.number(),
        v.integer(),
        v.minValue(0),
        v.maxValue(2147483646),
      ),
      engineVersion: v.string(),
      createdAt: v.string(),
      validity: v.union([v.literal("current"), v.literal("review_needed")]),
    }),
  ),
  total: v.number(),
});
export type ListEvaluationsResult = v.InferOutput<typeof listEvaluationsResponseSchema>;
const listEvaluationsoffsetQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,6}$/));
const listEvaluationslimitQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,3}$/));
export const evaluateJobResponseSchema = v.object({
  id: v.string(),
  businessId: v.string(),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  engineVersion: v.string(),
  createdAt: v.string(),
  validity: v.union([v.literal("current"), v.literal("review_needed")]),
  snapshot: v.object({
    businessId: v.string(),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    calculatedAt: v.string(),
    source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
    sourceSyncedAt: v.nullable(v.string()),
    lastSyncFailed: v.boolean(),
    input: v.object({
      currency: v.literal("MXN"),
      timezone: v.literal("America/Monterrey"),
      cutoffDate: v.string(),
      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      capacityDate: v.string(),
      collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
      events: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            date: v.string(),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            direction: v.union([v.literal("inflow"), v.literal("outflow")]),
            status: v.union([
              v.literal("expected"),
              v.literal("conditional"),
              v.literal("settled"),
              v.literal("cancelled"),
            ]),
            category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            negotiable: v.boolean(),
            conservativeDate: v.optional(v.string()),
          }),
        ),
        v.maxLength(500),
      ),
      missingInformation: v.pipe(
        v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        v.maxLength(50),
      ),
      sourceFreshness: v.union([
        v.literal("current"),
        v.literal("stale"),
        v.literal("unavailable"),
      ]),
    }),
  }),
  job: v.object({
    id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    totalCollection: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    collectionDate: v.string(),
    costs: v.pipe(
      v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
          amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          date: v.string(),
          category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
          negotiable: v.boolean(),
        }),
      ),
      v.minLength(1),
      v.maxLength(100),
    ),
    advance: v.nullable(
      v.object({
        maximumAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        allowedDates: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(32)),
      }),
    ),
    supplierOptions: v.pipe(
      v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          costId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          initialAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          deferredDate: v.string(),
          feeAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          deliveryMaintained: v.boolean(),
        }),
      ),
      v.maxLength(32),
    ),
  }),
  result: v.object({
    jobId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
    baseline: v.union([
      v.object({
        engineVersion: v.literal("1.0.0"),
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        horizonEnd: v.string(),
        capacityDate: v.string(),
        conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
        freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
        assumptions: v.array(v.string()),
        warnings: v.array(
          v.object({
            code: v.union([
              v.literal("overdue_payable"),
              v.literal("overdue_receivable"),
              v.literal("outside_horizon"),
              v.literal("conditional_cash"),
              v.literal("stale_source"),
              v.literal("unavailable_source"),
              v.literal("horizon_limit"),
            ]),
            eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            dates: v.array(v.string()),
          }),
        ),
        missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        availability: v.literal("ready"),
        financialStatus: v.union([
          v.literal("protected"),
          v.literal("cushion_shortfall"),
          v.literal("operational_shortfall"),
        ]),
        scenarios: v.pipe(
          v.array(
            v.object({
              id: v.union([v.literal("base"), v.literal("collection_delay")]),
              delayDays: v.number(),
              daily: v.array(
                v.object({
                  date: v.string(),
                  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                }),
              ),
              metrics: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
              criticalObligations: v.array(
                v.object({
                  eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                  label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  date: v.string(),
                  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                }),
              ),
            }),
          ),
          v.minLength(2),
          v.maxLength(2),
        ),
        worstCase: v.object({
          minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          minimumDate: v.string(),
          closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          firstCriticalDate: v.nullable(v.string()),
          reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        }),
      }),
      v.object({
        engineVersion: v.literal("1.0.0"),
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        horizonEnd: v.string(),
        capacityDate: v.string(),
        conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
        freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
        assumptions: v.array(v.string()),
        warnings: v.array(
          v.object({
            code: v.union([
              v.literal("overdue_payable"),
              v.literal("overdue_receivable"),
              v.literal("outside_horizon"),
              v.literal("conditional_cash"),
              v.literal("stale_source"),
              v.literal("unavailable_source"),
              v.literal("horizon_limit"),
            ]),
            eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            dates: v.array(v.string()),
          }),
        ),
        missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        availability: v.literal("insufficient_information"),
        financialStatus: v.literal("not_evaluated"),
        scenarios: v.pipe(
          v.array(
            v.object({
              id: v.union([v.literal("base"), v.literal("collection_delay")]),
              delayDays: v.number(),
              daily: v.array(
                v.object({
                  date: v.string(),
                  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                }),
              ),
              metrics: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
              criticalObligations: v.array(
                v.object({
                  eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                  label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  date: v.string(),
                  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                }),
              ),
            }),
          ),
          v.minLength(0),
          v.maxLength(0),
        ),
        worstCase: v.null(),
      }),
    ]),
    original: v.object({
      id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
      selection: v.union([
        v.object({ kind: v.literal("original") }),
        v.object({
          kind: v.literal("advance"),
          amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          date: v.string(),
        }),
        v.object({
          kind: v.literal("supplier"),
          optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
        }),
      ]),
      forecast: v.union([
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("ready"),
          financialStatus: v.union([
            v.literal("protected"),
            v.literal("cushion_shortfall"),
            v.literal("operational_shortfall"),
          ]),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(2),
            v.maxLength(2),
          ),
          worstCase: v.object({
            minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            minimumDate: v.string(),
            closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            firstCriticalDate: v.nullable(v.string()),
            reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          }),
        }),
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("insufficient_information"),
          financialStatus: v.literal("not_evaluated"),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(0),
            v.maxLength(0),
          ),
          worstCase: v.null(),
        }),
      ]),
      feasibility: v.union([
        v.literal("feasible"),
        v.literal("infeasible"),
        v.literal("horizon_limited"),
        v.literal("insufficient_information"),
      ]),
      reasons: v.array(
        v.union([
          v.literal("insufficient_capacity"),
          v.literal("advance_limit"),
          v.literal("late_advance"),
          v.literal("delivery_not_maintained"),
          v.literal("outside_horizon"),
          v.literal("missing_information"),
        ]),
      ),
      pendingConditions: v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
          kind: v.union([
            v.literal("customer_advance"),
            v.literal("supplier_agreement"),
            v.literal("delivery"),
          ]),
          description: v.string(),
          status: v.literal("pending"),
          eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
        }),
      ),
      knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    }),
    alternatives: v.array(
      v.object({
        id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
        selection: v.union([
          v.object({ kind: v.literal("original") }),
          v.object({
            kind: v.literal("advance"),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
          }),
          v.object({
            kind: v.literal("supplier"),
            optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          }),
        ]),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
        feasibility: v.union([
          v.literal("feasible"),
          v.literal("infeasible"),
          v.literal("horizon_limited"),
          v.literal("insufficient_information"),
        ]),
        reasons: v.array(
          v.union([
            v.literal("insufficient_capacity"),
            v.literal("advance_limit"),
            v.literal("late_advance"),
            v.literal("delivery_not_maintained"),
            v.literal("outside_horizon"),
            v.literal("missing_information"),
          ]),
        ),
        pendingConditions: v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            kind: v.union([
              v.literal("customer_advance"),
              v.literal("supplier_agreement"),
              v.literal("delivery"),
            ]),
            description: v.string(),
            status: v.literal("pending"),
            eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          }),
        ),
        knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
    ),
    searchStatus: v.union([
      v.literal("feasible_alternative"),
      v.literal("no_feasible_alternative"),
      v.literal("insufficient_information"),
    ]),
    searchScope: v.string(),
  }),
});
export type EvaluateJobResult = v.InferOutput<typeof evaluateJobResponseSchema>;
export const evaluateJobRequestSchema = v.object({
  job: v.object({
    id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    totalCollection: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    collectionDate: v.string(),
    costs: v.pipe(
      v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
          amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          date: v.string(),
          category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
          negotiable: v.boolean(),
        }),
      ),
      v.minLength(1),
      v.maxLength(100),
    ),
    advance: v.nullable(
      v.object({
        maximumAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        allowedDates: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(32)),
      }),
    ),
    supplierOptions: v.pipe(
      v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          costId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          initialAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          deferredDate: v.string(),
          feeAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          deliveryMaintained: v.boolean(),
        }),
      ),
      v.maxLength(32),
    ),
  }),
  capacityDate: v.optional(v.string()),
  collectionDelayDays: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30))),
});
export const getEvaluationResponseSchema = v.object({
  id: v.string(),
  businessId: v.string(),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  engineVersion: v.string(),
  createdAt: v.string(),
  validity: v.union([v.literal("current"), v.literal("review_needed")]),
  snapshot: v.object({
    businessId: v.string(),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    calculatedAt: v.string(),
    source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
    sourceSyncedAt: v.nullable(v.string()),
    lastSyncFailed: v.boolean(),
    input: v.object({
      currency: v.literal("MXN"),
      timezone: v.literal("America/Monterrey"),
      cutoffDate: v.string(),
      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      capacityDate: v.string(),
      collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
      events: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            date: v.string(),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            direction: v.union([v.literal("inflow"), v.literal("outflow")]),
            status: v.union([
              v.literal("expected"),
              v.literal("conditional"),
              v.literal("settled"),
              v.literal("cancelled"),
            ]),
            category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            negotiable: v.boolean(),
            conservativeDate: v.optional(v.string()),
          }),
        ),
        v.maxLength(500),
      ),
      missingInformation: v.pipe(
        v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        v.maxLength(50),
      ),
      sourceFreshness: v.union([
        v.literal("current"),
        v.literal("stale"),
        v.literal("unavailable"),
      ]),
    }),
  }),
  job: v.object({
    id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    totalCollection: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    collectionDate: v.string(),
    costs: v.pipe(
      v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
          amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          date: v.string(),
          category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
          negotiable: v.boolean(),
        }),
      ),
      v.minLength(1),
      v.maxLength(100),
    ),
    advance: v.nullable(
      v.object({
        maximumAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        allowedDates: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(32)),
      }),
    ),
    supplierOptions: v.pipe(
      v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          costId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          initialAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          deferredDate: v.string(),
          feeAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          deliveryMaintained: v.boolean(),
        }),
      ),
      v.maxLength(32),
    ),
  }),
  result: v.object({
    jobId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
    baseline: v.union([
      v.object({
        engineVersion: v.literal("1.0.0"),
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        horizonEnd: v.string(),
        capacityDate: v.string(),
        conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
        freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
        assumptions: v.array(v.string()),
        warnings: v.array(
          v.object({
            code: v.union([
              v.literal("overdue_payable"),
              v.literal("overdue_receivable"),
              v.literal("outside_horizon"),
              v.literal("conditional_cash"),
              v.literal("stale_source"),
              v.literal("unavailable_source"),
              v.literal("horizon_limit"),
            ]),
            eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            dates: v.array(v.string()),
          }),
        ),
        missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        availability: v.literal("ready"),
        financialStatus: v.union([
          v.literal("protected"),
          v.literal("cushion_shortfall"),
          v.literal("operational_shortfall"),
        ]),
        scenarios: v.pipe(
          v.array(
            v.object({
              id: v.union([v.literal("base"), v.literal("collection_delay")]),
              delayDays: v.number(),
              daily: v.array(
                v.object({
                  date: v.string(),
                  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                }),
              ),
              metrics: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
              criticalObligations: v.array(
                v.object({
                  eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                  label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  date: v.string(),
                  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                }),
              ),
            }),
          ),
          v.minLength(2),
          v.maxLength(2),
        ),
        worstCase: v.object({
          minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          minimumDate: v.string(),
          closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          firstCriticalDate: v.nullable(v.string()),
          reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        }),
      }),
      v.object({
        engineVersion: v.literal("1.0.0"),
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        horizonEnd: v.string(),
        capacityDate: v.string(),
        conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
        freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
        assumptions: v.array(v.string()),
        warnings: v.array(
          v.object({
            code: v.union([
              v.literal("overdue_payable"),
              v.literal("overdue_receivable"),
              v.literal("outside_horizon"),
              v.literal("conditional_cash"),
              v.literal("stale_source"),
              v.literal("unavailable_source"),
              v.literal("horizon_limit"),
            ]),
            eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            dates: v.array(v.string()),
          }),
        ),
        missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        availability: v.literal("insufficient_information"),
        financialStatus: v.literal("not_evaluated"),
        scenarios: v.pipe(
          v.array(
            v.object({
              id: v.union([v.literal("base"), v.literal("collection_delay")]),
              delayDays: v.number(),
              daily: v.array(
                v.object({
                  date: v.string(),
                  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                }),
              ),
              metrics: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
              criticalObligations: v.array(
                v.object({
                  eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                  label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  date: v.string(),
                  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                }),
              ),
            }),
          ),
          v.minLength(0),
          v.maxLength(0),
        ),
        worstCase: v.null(),
      }),
    ]),
    original: v.object({
      id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
      selection: v.union([
        v.object({ kind: v.literal("original") }),
        v.object({
          kind: v.literal("advance"),
          amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          date: v.string(),
        }),
        v.object({
          kind: v.literal("supplier"),
          optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
        }),
      ]),
      forecast: v.union([
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("ready"),
          financialStatus: v.union([
            v.literal("protected"),
            v.literal("cushion_shortfall"),
            v.literal("operational_shortfall"),
          ]),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(2),
            v.maxLength(2),
          ),
          worstCase: v.object({
            minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            minimumDate: v.string(),
            closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            firstCriticalDate: v.nullable(v.string()),
            reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          }),
        }),
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("insufficient_information"),
          financialStatus: v.literal("not_evaluated"),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(0),
            v.maxLength(0),
          ),
          worstCase: v.null(),
        }),
      ]),
      feasibility: v.union([
        v.literal("feasible"),
        v.literal("infeasible"),
        v.literal("horizon_limited"),
        v.literal("insufficient_information"),
      ]),
      reasons: v.array(
        v.union([
          v.literal("insufficient_capacity"),
          v.literal("advance_limit"),
          v.literal("late_advance"),
          v.literal("delivery_not_maintained"),
          v.literal("outside_horizon"),
          v.literal("missing_information"),
        ]),
      ),
      pendingConditions: v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
          kind: v.union([
            v.literal("customer_advance"),
            v.literal("supplier_agreement"),
            v.literal("delivery"),
          ]),
          description: v.string(),
          status: v.literal("pending"),
          eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
        }),
      ),
      knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
    }),
    alternatives: v.array(
      v.object({
        id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
        selection: v.union([
          v.object({ kind: v.literal("original") }),
          v.object({
            kind: v.literal("advance"),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
          }),
          v.object({
            kind: v.literal("supplier"),
            optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          }),
        ]),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
        feasibility: v.union([
          v.literal("feasible"),
          v.literal("infeasible"),
          v.literal("horizon_limited"),
          v.literal("insufficient_information"),
        ]),
        reasons: v.array(
          v.union([
            v.literal("insufficient_capacity"),
            v.literal("advance_limit"),
            v.literal("late_advance"),
            v.literal("delivery_not_maintained"),
            v.literal("outside_horizon"),
            v.literal("missing_information"),
          ]),
        ),
        pendingConditions: v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            kind: v.union([
              v.literal("customer_advance"),
              v.literal("supplier_agreement"),
              v.literal("delivery"),
            ]),
            description: v.string(),
            status: v.literal("pending"),
            eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          }),
        ),
        knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
    ),
    searchStatus: v.union([
      v.literal("feasible_alternative"),
      v.literal("no_feasible_alternative"),
      v.literal("insufficient_information"),
    ]),
    searchScope: v.string(),
  }),
});
export type GetEvaluationResult = v.InferOutput<typeof getEvaluationResponseSchema>;
export const listDecisionsResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      evaluationId: v.string(),
      alternativeId: v.string(),
      createdAt: v.string(),
      creationVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      currentPlanningVersion: v.pipe(
        v.number(),
        v.integer(),
        v.minValue(0),
        v.maxValue(2147483646),
      ),
      validity: v.union([v.literal("current"), v.literal("review_needed")]),
      conditionStatus: v.union([v.literal("pending"), v.literal("confirmed"), v.literal("none")]),
    }),
  ),
  total: v.number(),
});
export type ListDecisionsResult = v.InferOutput<typeof listDecisionsResponseSchema>;
const listDecisionsoffsetQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,6}$/));
const listDecisionslimitQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,3}$/));
export const confirmDecisionResponseSchema = v.object({
  decisionId: v.string(),
  evaluationId: v.string(),
  alternativeId: v.string(),
  planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  registeredAt: v.string(),
});
export type ConfirmDecisionResult = v.InferOutput<typeof confirmDecisionResponseSchema>;
export const confirmDecisionRequestSchema = v.object({
  evaluationId: v.string(),
  alternativeId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  idempotencyKey: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]+$/), v.minLength(8), v.maxLength(120)),
});
export const getDecisionResponseSchema = v.object({
  id: v.string(),
  evaluationId: v.string(),
  alternativeId: v.string(),
  createdAt: v.string(),
  creationVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  validity: v.union([v.literal("current"), v.literal("review_needed")]),
  conditionStatus: v.union([v.literal("pending"), v.literal("confirmed"), v.literal("none")]),
  conditions: v.array(
    v.object({
      id: v.string(),
      kind: v.union([
        v.literal("customer_advance"),
        v.literal("supplier_agreement"),
        v.literal("delivery"),
      ]),
      status: v.union([v.literal("pending"), v.literal("confirmed")]),
      evidence: v.nullable(v.string()),
      updatedAt: v.string(),
    }),
  ),
  evaluation: v.object({
    id: v.string(),
    businessId: v.string(),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    engineVersion: v.string(),
    createdAt: v.string(),
    validity: v.union([v.literal("current"), v.literal("review_needed")]),
    snapshot: v.object({
      businessId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      calculatedAt: v.string(),
      source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
      sourceSyncedAt: v.nullable(v.string()),
      lastSyncFailed: v.boolean(),
      input: v.object({
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        capacityDate: v.string(),
        collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
        events: v.pipe(
          v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              date: v.string(),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              direction: v.union([v.literal("inflow"), v.literal("outflow")]),
              status: v.union([
                v.literal("expected"),
                v.literal("conditional"),
                v.literal("settled"),
                v.literal("cancelled"),
              ]),
              category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              negotiable: v.boolean(),
              conservativeDate: v.optional(v.string()),
            }),
          ),
          v.maxLength(500),
        ),
        missingInformation: v.pipe(
          v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          v.maxLength(50),
        ),
        sourceFreshness: v.union([
          v.literal("current"),
          v.literal("stale"),
          v.literal("unavailable"),
        ]),
      }),
    }),
    job: v.object({
      id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      totalCollection: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      collectionDate: v.string(),
      costs: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
            category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            negotiable: v.boolean(),
          }),
        ),
        v.minLength(1),
        v.maxLength(100),
      ),
      advance: v.nullable(
        v.object({
          maximumAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          allowedDates: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(32)),
        }),
      ),
      supplierOptions: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            costId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            initialAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deferredDate: v.string(),
            feeAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deliveryMaintained: v.boolean(),
          }),
        ),
        v.maxLength(32),
      ),
    }),
    result: v.object({
      jobId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      baseline: v.union([
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("ready"),
          financialStatus: v.union([
            v.literal("protected"),
            v.literal("cushion_shortfall"),
            v.literal("operational_shortfall"),
          ]),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(2),
            v.maxLength(2),
          ),
          worstCase: v.object({
            minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            minimumDate: v.string(),
            closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            firstCriticalDate: v.nullable(v.string()),
            reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          }),
        }),
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("insufficient_information"),
          financialStatus: v.literal("not_evaluated"),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(0),
            v.maxLength(0),
          ),
          worstCase: v.null(),
        }),
      ]),
      original: v.object({
        id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
        selection: v.union([
          v.object({ kind: v.literal("original") }),
          v.object({
            kind: v.literal("advance"),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
          }),
          v.object({
            kind: v.literal("supplier"),
            optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          }),
        ]),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
        feasibility: v.union([
          v.literal("feasible"),
          v.literal("infeasible"),
          v.literal("horizon_limited"),
          v.literal("insufficient_information"),
        ]),
        reasons: v.array(
          v.union([
            v.literal("insufficient_capacity"),
            v.literal("advance_limit"),
            v.literal("late_advance"),
            v.literal("delivery_not_maintained"),
            v.literal("outside_horizon"),
            v.literal("missing_information"),
          ]),
        ),
        pendingConditions: v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            kind: v.union([
              v.literal("customer_advance"),
              v.literal("supplier_agreement"),
              v.literal("delivery"),
            ]),
            description: v.string(),
            status: v.literal("pending"),
            eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          }),
        ),
        knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
      alternatives: v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
          selection: v.union([
            v.object({ kind: v.literal("original") }),
            v.object({
              kind: v.literal("advance"),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              date: v.string(),
            }),
            v.object({
              kind: v.literal("supplier"),
              optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            }),
          ]),
          forecast: v.union([
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("ready"),
              financialStatus: v.union([
                v.literal("protected"),
                v.literal("cushion_shortfall"),
                v.literal("operational_shortfall"),
              ]),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(2),
                v.maxLength(2),
              ),
              worstCase: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
            }),
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("insufficient_information"),
              financialStatus: v.literal("not_evaluated"),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(0),
                v.maxLength(0),
              ),
              worstCase: v.null(),
            }),
          ]),
          feasibility: v.union([
            v.literal("feasible"),
            v.literal("infeasible"),
            v.literal("horizon_limited"),
            v.literal("insufficient_information"),
          ]),
          reasons: v.array(
            v.union([
              v.literal("insufficient_capacity"),
              v.literal("advance_limit"),
              v.literal("late_advance"),
              v.literal("delivery_not_maintained"),
              v.literal("outside_horizon"),
              v.literal("missing_information"),
            ]),
          ),
          pendingConditions: v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              kind: v.union([
                v.literal("customer_advance"),
                v.literal("supplier_agreement"),
                v.literal("delivery"),
              ]),
              description: v.string(),
              status: v.literal("pending"),
              eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            }),
          ),
          knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        }),
      ),
      searchStatus: v.union([
        v.literal("feasible_alternative"),
        v.literal("no_feasible_alternative"),
        v.literal("insufficient_information"),
      ]),
      searchScope: v.string(),
    }),
  }),
  latestReview: v.nullable(
    v.object({
      id: v.string(),
      decisionId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      reviewedAt: v.string(),
      snapshot: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        input: v.object({
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          capacityDate: v.string(),
          collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
          events: v.pipe(
            v.array(
              v.object({
                id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                date: v.string(),
                amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
                direction: v.union([v.literal("inflow"), v.literal("outflow")]),
                status: v.union([
                  v.literal("expected"),
                  v.literal("conditional"),
                  v.literal("settled"),
                  v.literal("cancelled"),
                ]),
                category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                negotiable: v.boolean(),
                conservativeDate: v.optional(v.string()),
              }),
            ),
            v.maxLength(500),
          ),
          missingInformation: v.pipe(
            v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            v.maxLength(50),
          ),
          sourceFreshness: v.union([
            v.literal("current"),
            v.literal("stale"),
            v.literal("unavailable"),
          ]),
        }),
      }),
      result: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
      }),
    }),
  ),
});
export type GetDecisionResult = v.InferOutput<typeof getDecisionResponseSchema>;
export const updateDecisionConditionResponseSchema = v.object({
  id: v.string(),
  evaluationId: v.string(),
  alternativeId: v.string(),
  createdAt: v.string(),
  creationVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  validity: v.union([v.literal("current"), v.literal("review_needed")]),
  conditionStatus: v.union([v.literal("pending"), v.literal("confirmed"), v.literal("none")]),
  conditions: v.array(
    v.object({
      id: v.string(),
      kind: v.union([
        v.literal("customer_advance"),
        v.literal("supplier_agreement"),
        v.literal("delivery"),
      ]),
      status: v.union([v.literal("pending"), v.literal("confirmed")]),
      evidence: v.nullable(v.string()),
      updatedAt: v.string(),
    }),
  ),
  evaluation: v.object({
    id: v.string(),
    businessId: v.string(),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    engineVersion: v.string(),
    createdAt: v.string(),
    validity: v.union([v.literal("current"), v.literal("review_needed")]),
    snapshot: v.object({
      businessId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      calculatedAt: v.string(),
      source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
      sourceSyncedAt: v.nullable(v.string()),
      lastSyncFailed: v.boolean(),
      input: v.object({
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        capacityDate: v.string(),
        collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
        events: v.pipe(
          v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              date: v.string(),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              direction: v.union([v.literal("inflow"), v.literal("outflow")]),
              status: v.union([
                v.literal("expected"),
                v.literal("conditional"),
                v.literal("settled"),
                v.literal("cancelled"),
              ]),
              category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              negotiable: v.boolean(),
              conservativeDate: v.optional(v.string()),
            }),
          ),
          v.maxLength(500),
        ),
        missingInformation: v.pipe(
          v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          v.maxLength(50),
        ),
        sourceFreshness: v.union([
          v.literal("current"),
          v.literal("stale"),
          v.literal("unavailable"),
        ]),
      }),
    }),
    job: v.object({
      id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      totalCollection: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      collectionDate: v.string(),
      costs: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
            category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            negotiable: v.boolean(),
          }),
        ),
        v.minLength(1),
        v.maxLength(100),
      ),
      advance: v.nullable(
        v.object({
          maximumAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          allowedDates: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(32)),
        }),
      ),
      supplierOptions: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            costId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            initialAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deferredDate: v.string(),
            feeAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deliveryMaintained: v.boolean(),
          }),
        ),
        v.maxLength(32),
      ),
    }),
    result: v.object({
      jobId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      baseline: v.union([
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("ready"),
          financialStatus: v.union([
            v.literal("protected"),
            v.literal("cushion_shortfall"),
            v.literal("operational_shortfall"),
          ]),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(2),
            v.maxLength(2),
          ),
          worstCase: v.object({
            minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            minimumDate: v.string(),
            closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            firstCriticalDate: v.nullable(v.string()),
            reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          }),
        }),
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("insufficient_information"),
          financialStatus: v.literal("not_evaluated"),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(0),
            v.maxLength(0),
          ),
          worstCase: v.null(),
        }),
      ]),
      original: v.object({
        id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
        selection: v.union([
          v.object({ kind: v.literal("original") }),
          v.object({
            kind: v.literal("advance"),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
          }),
          v.object({
            kind: v.literal("supplier"),
            optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          }),
        ]),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
        feasibility: v.union([
          v.literal("feasible"),
          v.literal("infeasible"),
          v.literal("horizon_limited"),
          v.literal("insufficient_information"),
        ]),
        reasons: v.array(
          v.union([
            v.literal("insufficient_capacity"),
            v.literal("advance_limit"),
            v.literal("late_advance"),
            v.literal("delivery_not_maintained"),
            v.literal("outside_horizon"),
            v.literal("missing_information"),
          ]),
        ),
        pendingConditions: v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            kind: v.union([
              v.literal("customer_advance"),
              v.literal("supplier_agreement"),
              v.literal("delivery"),
            ]),
            description: v.string(),
            status: v.literal("pending"),
            eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          }),
        ),
        knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
      alternatives: v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
          selection: v.union([
            v.object({ kind: v.literal("original") }),
            v.object({
              kind: v.literal("advance"),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              date: v.string(),
            }),
            v.object({
              kind: v.literal("supplier"),
              optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            }),
          ]),
          forecast: v.union([
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("ready"),
              financialStatus: v.union([
                v.literal("protected"),
                v.literal("cushion_shortfall"),
                v.literal("operational_shortfall"),
              ]),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(2),
                v.maxLength(2),
              ),
              worstCase: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
            }),
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("insufficient_information"),
              financialStatus: v.literal("not_evaluated"),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(0),
                v.maxLength(0),
              ),
              worstCase: v.null(),
            }),
          ]),
          feasibility: v.union([
            v.literal("feasible"),
            v.literal("infeasible"),
            v.literal("horizon_limited"),
            v.literal("insufficient_information"),
          ]),
          reasons: v.array(
            v.union([
              v.literal("insufficient_capacity"),
              v.literal("advance_limit"),
              v.literal("late_advance"),
              v.literal("delivery_not_maintained"),
              v.literal("outside_horizon"),
              v.literal("missing_information"),
            ]),
          ),
          pendingConditions: v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              kind: v.union([
                v.literal("customer_advance"),
                v.literal("supplier_agreement"),
                v.literal("delivery"),
              ]),
              description: v.string(),
              status: v.literal("pending"),
              eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            }),
          ),
          knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        }),
      ),
      searchStatus: v.union([
        v.literal("feasible_alternative"),
        v.literal("no_feasible_alternative"),
        v.literal("insufficient_information"),
      ]),
      searchScope: v.string(),
    }),
  }),
  latestReview: v.nullable(
    v.object({
      id: v.string(),
      decisionId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      reviewedAt: v.string(),
      snapshot: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        input: v.object({
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          capacityDate: v.string(),
          collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
          events: v.pipe(
            v.array(
              v.object({
                id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                date: v.string(),
                amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
                direction: v.union([v.literal("inflow"), v.literal("outflow")]),
                status: v.union([
                  v.literal("expected"),
                  v.literal("conditional"),
                  v.literal("settled"),
                  v.literal("cancelled"),
                ]),
                category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                negotiable: v.boolean(),
                conservativeDate: v.optional(v.string()),
              }),
            ),
            v.maxLength(500),
          ),
          missingInformation: v.pipe(
            v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            v.maxLength(50),
          ),
          sourceFreshness: v.union([
            v.literal("current"),
            v.literal("stale"),
            v.literal("unavailable"),
          ]),
        }),
      }),
      result: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
      }),
    }),
  ),
});
export type UpdateDecisionConditionResult = v.InferOutput<
  typeof updateDecisionConditionResponseSchema
>;
export const updateDecisionConditionRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  status: v.union([v.literal("pending"), v.literal("confirmed")]),
  evidence: v.pipe(v.string(), v.minLength(5), v.maxLength(1000)),
});
export const reevaluateDecisionResponseSchema = v.object({
  id: v.string(),
  evaluationId: v.string(),
  alternativeId: v.string(),
  createdAt: v.string(),
  creationVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  validity: v.union([v.literal("current"), v.literal("review_needed")]),
  conditionStatus: v.union([v.literal("pending"), v.literal("confirmed"), v.literal("none")]),
  conditions: v.array(
    v.object({
      id: v.string(),
      kind: v.union([
        v.literal("customer_advance"),
        v.literal("supplier_agreement"),
        v.literal("delivery"),
      ]),
      status: v.union([v.literal("pending"), v.literal("confirmed")]),
      evidence: v.nullable(v.string()),
      updatedAt: v.string(),
    }),
  ),
  evaluation: v.object({
    id: v.string(),
    businessId: v.string(),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    engineVersion: v.string(),
    createdAt: v.string(),
    validity: v.union([v.literal("current"), v.literal("review_needed")]),
    snapshot: v.object({
      businessId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      calculatedAt: v.string(),
      source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
      sourceSyncedAt: v.nullable(v.string()),
      lastSyncFailed: v.boolean(),
      input: v.object({
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        capacityDate: v.string(),
        collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
        events: v.pipe(
          v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              date: v.string(),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              direction: v.union([v.literal("inflow"), v.literal("outflow")]),
              status: v.union([
                v.literal("expected"),
                v.literal("conditional"),
                v.literal("settled"),
                v.literal("cancelled"),
              ]),
              category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              negotiable: v.boolean(),
              conservativeDate: v.optional(v.string()),
            }),
          ),
          v.maxLength(500),
        ),
        missingInformation: v.pipe(
          v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          v.maxLength(50),
        ),
        sourceFreshness: v.union([
          v.literal("current"),
          v.literal("stale"),
          v.literal("unavailable"),
        ]),
      }),
    }),
    job: v.object({
      id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      totalCollection: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      collectionDate: v.string(),
      costs: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
            category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            negotiable: v.boolean(),
          }),
        ),
        v.minLength(1),
        v.maxLength(100),
      ),
      advance: v.nullable(
        v.object({
          maximumAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          allowedDates: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(32)),
        }),
      ),
      supplierOptions: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            costId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            initialAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deferredDate: v.string(),
            feeAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deliveryMaintained: v.boolean(),
          }),
        ),
        v.maxLength(32),
      ),
    }),
    result: v.object({
      jobId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      baseline: v.union([
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("ready"),
          financialStatus: v.union([
            v.literal("protected"),
            v.literal("cushion_shortfall"),
            v.literal("operational_shortfall"),
          ]),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(2),
            v.maxLength(2),
          ),
          worstCase: v.object({
            minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            minimumDate: v.string(),
            closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            firstCriticalDate: v.nullable(v.string()),
            reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          }),
        }),
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("insufficient_information"),
          financialStatus: v.literal("not_evaluated"),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(0),
            v.maxLength(0),
          ),
          worstCase: v.null(),
        }),
      ]),
      original: v.object({
        id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
        selection: v.union([
          v.object({ kind: v.literal("original") }),
          v.object({
            kind: v.literal("advance"),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
          }),
          v.object({
            kind: v.literal("supplier"),
            optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          }),
        ]),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
        feasibility: v.union([
          v.literal("feasible"),
          v.literal("infeasible"),
          v.literal("horizon_limited"),
          v.literal("insufficient_information"),
        ]),
        reasons: v.array(
          v.union([
            v.literal("insufficient_capacity"),
            v.literal("advance_limit"),
            v.literal("late_advance"),
            v.literal("delivery_not_maintained"),
            v.literal("outside_horizon"),
            v.literal("missing_information"),
          ]),
        ),
        pendingConditions: v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            kind: v.union([
              v.literal("customer_advance"),
              v.literal("supplier_agreement"),
              v.literal("delivery"),
            ]),
            description: v.string(),
            status: v.literal("pending"),
            eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          }),
        ),
        knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
      alternatives: v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
          selection: v.union([
            v.object({ kind: v.literal("original") }),
            v.object({
              kind: v.literal("advance"),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              date: v.string(),
            }),
            v.object({
              kind: v.literal("supplier"),
              optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            }),
          ]),
          forecast: v.union([
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("ready"),
              financialStatus: v.union([
                v.literal("protected"),
                v.literal("cushion_shortfall"),
                v.literal("operational_shortfall"),
              ]),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(2),
                v.maxLength(2),
              ),
              worstCase: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
            }),
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("insufficient_information"),
              financialStatus: v.literal("not_evaluated"),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(0),
                v.maxLength(0),
              ),
              worstCase: v.null(),
            }),
          ]),
          feasibility: v.union([
            v.literal("feasible"),
            v.literal("infeasible"),
            v.literal("horizon_limited"),
            v.literal("insufficient_information"),
          ]),
          reasons: v.array(
            v.union([
              v.literal("insufficient_capacity"),
              v.literal("advance_limit"),
              v.literal("late_advance"),
              v.literal("delivery_not_maintained"),
              v.literal("outside_horizon"),
              v.literal("missing_information"),
            ]),
          ),
          pendingConditions: v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              kind: v.union([
                v.literal("customer_advance"),
                v.literal("supplier_agreement"),
                v.literal("delivery"),
              ]),
              description: v.string(),
              status: v.literal("pending"),
              eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            }),
          ),
          knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        }),
      ),
      searchStatus: v.union([
        v.literal("feasible_alternative"),
        v.literal("no_feasible_alternative"),
        v.literal("insufficient_information"),
      ]),
      searchScope: v.string(),
    }),
  }),
  latestReview: v.nullable(
    v.object({
      id: v.string(),
      decisionId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      reviewedAt: v.string(),
      snapshot: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        input: v.object({
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          capacityDate: v.string(),
          collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
          events: v.pipe(
            v.array(
              v.object({
                id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                date: v.string(),
                amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
                direction: v.union([v.literal("inflow"), v.literal("outflow")]),
                status: v.union([
                  v.literal("expected"),
                  v.literal("conditional"),
                  v.literal("settled"),
                  v.literal("cancelled"),
                ]),
                category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                negotiable: v.boolean(),
                conservativeDate: v.optional(v.string()),
              }),
            ),
            v.maxLength(500),
          ),
          missingInformation: v.pipe(
            v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            v.maxLength(50),
          ),
          sourceFreshness: v.union([
            v.literal("current"),
            v.literal("stale"),
            v.literal("unavailable"),
          ]),
        }),
      }),
      result: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
      }),
    }),
  ),
});
export type ReevaluateDecisionResult = v.InferOutput<typeof reevaluateDecisionResponseSchema>;
export const reevaluateDecisionRequestSchema = v.object({
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
});
export const getDecisionHistoryResponseSchema = v.object({
  evaluation: v.object({
    id: v.string(),
    businessId: v.string(),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    currentPlanningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    engineVersion: v.string(),
    createdAt: v.string(),
    validity: v.union([v.literal("current"), v.literal("review_needed")]),
    snapshot: v.object({
      businessId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      calculatedAt: v.string(),
      source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
      sourceSyncedAt: v.nullable(v.string()),
      lastSyncFailed: v.boolean(),
      input: v.object({
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
        capacityDate: v.string(),
        collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
        events: v.pipe(
          v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              date: v.string(),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              direction: v.union([v.literal("inflow"), v.literal("outflow")]),
              status: v.union([
                v.literal("expected"),
                v.literal("conditional"),
                v.literal("settled"),
                v.literal("cancelled"),
              ]),
              category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
              negotiable: v.boolean(),
              conservativeDate: v.optional(v.string()),
            }),
          ),
          v.maxLength(500),
        ),
        missingInformation: v.pipe(
          v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          v.maxLength(50),
        ),
        sourceFreshness: v.union([
          v.literal("current"),
          v.literal("stale"),
          v.literal("unavailable"),
        ]),
      }),
    }),
    job: v.object({
      id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      totalCollection: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
      collectionDate: v.string(),
      costs: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
            category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
            negotiable: v.boolean(),
          }),
        ),
        v.minLength(1),
        v.maxLength(100),
      ),
      advance: v.nullable(
        v.object({
          maximumAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          allowedDates: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(32)),
        }),
      ),
      supplierOptions: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            costId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            initialAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deferredDate: v.string(),
            feeAmount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            deliveryMaintained: v.boolean(),
          }),
        ),
        v.maxLength(32),
      ),
    }),
    result: v.object({
      jobId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      baseline: v.union([
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("ready"),
          financialStatus: v.union([
            v.literal("protected"),
            v.literal("cushion_shortfall"),
            v.literal("operational_shortfall"),
          ]),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(2),
            v.maxLength(2),
          ),
          worstCase: v.object({
            minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            minimumDate: v.string(),
            closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            firstCriticalDate: v.nullable(v.string()),
            reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          }),
        }),
        v.object({
          engineVersion: v.literal("1.0.0"),
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          horizonEnd: v.string(),
          capacityDate: v.string(),
          conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
          freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
          assumptions: v.array(v.string()),
          warnings: v.array(
            v.object({
              code: v.union([
                v.literal("overdue_payable"),
                v.literal("overdue_receivable"),
                v.literal("outside_horizon"),
                v.literal("conditional_cash"),
                v.literal("stale_source"),
                v.literal("unavailable_source"),
                v.literal("horizon_limit"),
              ]),
              eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
              dates: v.array(v.string()),
            }),
          ),
          missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
          availability: v.literal("insufficient_information"),
          financialStatus: v.literal("not_evaluated"),
          scenarios: v.pipe(
            v.array(
              v.object({
                id: v.union([v.literal("base"), v.literal("collection_delay")]),
                delayDays: v.number(),
                daily: v.array(
                  v.object({
                    date: v.string(),
                    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  }),
                ),
                metrics: v.object({
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumDate: v.string(),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  operationalShortfall: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                  protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  firstCriticalDate: v.nullable(v.string()),
                  reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  unconditionalCapacity: v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                  ),
                }),
                criticalObligations: v.array(
                  v.object({
                    eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                    label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    date: v.string(),
                    amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  }),
                ),
              }),
            ),
            v.minLength(0),
            v.maxLength(0),
          ),
          worstCase: v.null(),
        }),
      ]),
      original: v.object({
        id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
        selection: v.union([
          v.object({ kind: v.literal("original") }),
          v.object({
            kind: v.literal("advance"),
            amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
            date: v.string(),
          }),
          v.object({
            kind: v.literal("supplier"),
            optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
          }),
        ]),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
        feasibility: v.union([
          v.literal("feasible"),
          v.literal("infeasible"),
          v.literal("horizon_limited"),
          v.literal("insufficient_information"),
        ]),
        reasons: v.array(
          v.union([
            v.literal("insufficient_capacity"),
            v.literal("advance_limit"),
            v.literal("late_advance"),
            v.literal("delivery_not_maintained"),
            v.literal("outside_horizon"),
            v.literal("missing_information"),
          ]),
        ),
        pendingConditions: v.array(
          v.object({
            id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
            kind: v.union([
              v.literal("customer_advance"),
              v.literal("supplier_agreement"),
              v.literal("delivery"),
            ]),
            description: v.string(),
            status: v.literal("pending"),
            eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
          }),
        ),
        knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
      alternatives: v.array(
        v.object({
          id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
          selection: v.union([
            v.object({ kind: v.literal("original") }),
            v.object({
              kind: v.literal("advance"),
              amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
              date: v.string(),
            }),
            v.object({
              kind: v.literal("supplier"),
              optionId: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
            }),
          ]),
          forecast: v.union([
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("ready"),
              financialStatus: v.union([
                v.literal("protected"),
                v.literal("cushion_shortfall"),
                v.literal("operational_shortfall"),
              ]),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(2),
                v.maxLength(2),
              ),
              worstCase: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
            }),
            v.object({
              engineVersion: v.literal("1.0.0"),
              currency: v.literal("MXN"),
              timezone: v.literal("America/Monterrey"),
              cutoffDate: v.string(),
              horizonEnd: v.string(),
              capacityDate: v.string(),
              conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
              freshness: v.union([
                v.literal("current"),
                v.literal("stale"),
                v.literal("unavailable"),
              ]),
              assumptions: v.array(v.string()),
              warnings: v.array(
                v.object({
                  code: v.union([
                    v.literal("overdue_payable"),
                    v.literal("overdue_receivable"),
                    v.literal("outside_horizon"),
                    v.literal("conditional_cash"),
                    v.literal("stale_source"),
                    v.literal("unavailable_source"),
                    v.literal("horizon_limit"),
                  ]),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                  dates: v.array(v.string()),
                }),
              ),
              missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
              availability: v.literal("insufficient_information"),
              financialStatus: v.literal("not_evaluated"),
              scenarios: v.pipe(
                v.array(
                  v.object({
                    id: v.union([v.literal("base"), v.literal("collection_delay")]),
                    delayDays: v.number(),
                    daily: v.array(
                      v.object({
                        date: v.string(),
                        openingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        minimumBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        closingBalance: v.pipe(
                          v.string(),
                          v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                        ),
                        eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                      }),
                    ),
                    metrics: v.object({
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumDate: v.string(),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      operationalShortfall: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      firstCriticalDate: v.nullable(v.string()),
                      reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      reserveCoverageGap: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      availableCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                      unconditionalCapacity: v.pipe(
                        v.string(),
                        v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                      ),
                    }),
                    criticalObligations: v.array(
                      v.object({
                        eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                        label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                        date: v.string(),
                        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      }),
                    ),
                  }),
                ),
                v.minLength(0),
                v.maxLength(0),
              ),
              worstCase: v.null(),
            }),
          ]),
          feasibility: v.union([
            v.literal("feasible"),
            v.literal("infeasible"),
            v.literal("horizon_limited"),
            v.literal("insufficient_information"),
          ]),
          reasons: v.array(
            v.union([
              v.literal("insufficient_capacity"),
              v.literal("advance_limit"),
              v.literal("late_advance"),
              v.literal("delivery_not_maintained"),
              v.literal("outside_horizon"),
              v.literal("missing_information"),
            ]),
          ),
          pendingConditions: v.array(
            v.object({
              id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
              kind: v.union([
                v.literal("customer_advance"),
                v.literal("supplier_agreement"),
                v.literal("delivery"),
              ]),
              description: v.string(),
              status: v.literal("pending"),
              eventId: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            }),
          ),
          knownFees: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobIncome: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          totalJobCost: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        }),
      ),
      searchStatus: v.union([
        v.literal("feasible_alternative"),
        v.literal("no_feasible_alternative"),
        v.literal("insufficient_information"),
      ]),
      searchScope: v.string(),
    }),
  }),
  reviews: v.array(
    v.object({
      id: v.string(),
      decisionId: v.string(),
      planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
      reviewedAt: v.string(),
      snapshot: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        input: v.object({
          currency: v.literal("MXN"),
          timezone: v.literal("America/Monterrey"),
          cutoffDate: v.string(),
          openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
          capacityDate: v.string(),
          collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
          events: v.pipe(
            v.array(
              v.object({
                id: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                date: v.string(),
                amount: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
                direction: v.union([v.literal("inflow"), v.literal("outflow")]),
                status: v.union([
                  v.literal("expected"),
                  v.literal("conditional"),
                  v.literal("settled"),
                  v.literal("cancelled"),
                ]),
                category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                negotiable: v.boolean(),
                conservativeDate: v.optional(v.string()),
              }),
            ),
            v.maxLength(500),
          ),
          missingInformation: v.pipe(
            v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            v.maxLength(50),
          ),
          sourceFreshness: v.union([
            v.literal("current"),
            v.literal("stale"),
            v.literal("unavailable"),
          ]),
        }),
      }),
      result: v.object({
        businessId: v.string(),
        planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        calculatedAt: v.string(),
        source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
        sourceSyncedAt: v.nullable(v.string()),
        lastSyncFailed: v.boolean(),
        forecast: v.union([
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("ready"),
            financialStatus: v.union([
              v.literal("protected"),
              v.literal("cushion_shortfall"),
              v.literal("operational_shortfall"),
            ]),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(2),
              v.maxLength(2),
            ),
            worstCase: v.object({
              minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              minimumDate: v.string(),
              closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              firstCriticalDate: v.nullable(v.string()),
              reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
              unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
            }),
          }),
          v.object({
            engineVersion: v.literal("1.0.0"),
            currency: v.literal("MXN"),
            timezone: v.literal("America/Monterrey"),
            cutoffDate: v.string(),
            horizonEnd: v.string(),
            capacityDate: v.string(),
            conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
            freshness: v.union([
              v.literal("current"),
              v.literal("stale"),
              v.literal("unavailable"),
            ]),
            assumptions: v.array(v.string()),
            warnings: v.array(
              v.object({
                code: v.union([
                  v.literal("overdue_payable"),
                  v.literal("overdue_receivable"),
                  v.literal("outside_horizon"),
                  v.literal("conditional_cash"),
                  v.literal("stale_source"),
                  v.literal("unavailable_source"),
                  v.literal("horizon_limit"),
                ]),
                eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                dates: v.array(v.string()),
              }),
            ),
            missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
            availability: v.literal("insufficient_information"),
            financialStatus: v.literal("not_evaluated"),
            scenarios: v.pipe(
              v.array(
                v.object({
                  id: v.union([v.literal("base"), v.literal("collection_delay")]),
                  delayDays: v.number(),
                  daily: v.array(
                    v.object({
                      date: v.string(),
                      openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                    }),
                  ),
                  metrics: v.object({
                    minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    minimumDate: v.string(),
                    closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    operationalShortfall: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    firstCriticalDate: v.nullable(v.string()),
                    reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                    reserveCoverageGap: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    availableCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                    unconditionalCapacity: v.pipe(
                      v.string(),
                      v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                    ),
                  }),
                  criticalObligations: v.array(
                    v.object({
                      eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                      label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                      date: v.string(),
                      amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                      category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                    }),
                  ),
                }),
              ),
              v.minLength(0),
              v.maxLength(0),
            ),
            worstCase: v.null(),
          }),
        ]),
      }),
    }),
  ),
  totalReviews: v.number(),
});
export type GetDecisionHistoryResult = v.InferOutput<typeof getDecisionHistoryResponseSchema>;
const getDecisionHistoryoffsetQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,6}$/));
const getDecisionHistorylimitQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,3}$/));
export const getDashboardResponseSchema = v.object({
  business: v.object({
    id: v.string(),
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    currency: v.literal("MXN"),
    timezone: v.literal("America/Monterrey"),
    cushion: v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    dataComplete: v.boolean(),
    cutoffDate: v.string(),
    openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/)),
    source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
    sourceSyncedAt: v.nullable(v.string()),
  }),
  liquidity: v.object({
    businessId: v.string(),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
    calculatedAt: v.string(),
    source: v.union([v.literal("replay"), v.literal("nessie_live"), v.literal("unavailable")]),
    sourceSyncedAt: v.nullable(v.string()),
    lastSyncFailed: v.boolean(),
    forecast: v.union([
      v.object({
        engineVersion: v.literal("1.0.0"),
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        horizonEnd: v.string(),
        capacityDate: v.string(),
        conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
        freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
        assumptions: v.array(v.string()),
        warnings: v.array(
          v.object({
            code: v.union([
              v.literal("overdue_payable"),
              v.literal("overdue_receivable"),
              v.literal("outside_horizon"),
              v.literal("conditional_cash"),
              v.literal("stale_source"),
              v.literal("unavailable_source"),
              v.literal("horizon_limit"),
            ]),
            eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            dates: v.array(v.string()),
          }),
        ),
        missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        availability: v.literal("ready"),
        financialStatus: v.union([
          v.literal("protected"),
          v.literal("cushion_shortfall"),
          v.literal("operational_shortfall"),
        ]),
        scenarios: v.pipe(
          v.array(
            v.object({
              id: v.union([v.literal("base"), v.literal("collection_delay")]),
              delayDays: v.number(),
              daily: v.array(
                v.object({
                  date: v.string(),
                  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                }),
              ),
              metrics: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
              criticalObligations: v.array(
                v.object({
                  eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                  label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  date: v.string(),
                  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                }),
              ),
            }),
          ),
          v.minLength(2),
          v.maxLength(2),
        ),
        worstCase: v.object({
          minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          minimumDate: v.string(),
          closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          firstCriticalDate: v.nullable(v.string()),
          reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
          unconditionalCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        }),
      }),
      v.object({
        engineVersion: v.literal("1.0.0"),
        currency: v.literal("MXN"),
        timezone: v.literal("America/Monterrey"),
        cutoffDate: v.string(),
        horizonEnd: v.string(),
        capacityDate: v.string(),
        conditionStatus: v.union([v.literal("conditional"), v.literal("none")]),
        freshness: v.union([v.literal("current"), v.literal("stale"), v.literal("unavailable")]),
        assumptions: v.array(v.string()),
        warnings: v.array(
          v.object({
            code: v.union([
              v.literal("overdue_payable"),
              v.literal("overdue_receivable"),
              v.literal("outside_horizon"),
              v.literal("conditional_cash"),
              v.literal("stale_source"),
              v.literal("unavailable_source"),
              v.literal("horizon_limit"),
            ]),
            eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
            dates: v.array(v.string()),
          }),
        ),
        missingInformation: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        availability: v.literal("insufficient_information"),
        financialStatus: v.literal("not_evaluated"),
        scenarios: v.pipe(
          v.array(
            v.object({
              id: v.union([v.literal("base"), v.literal("collection_delay")]),
              delayDays: v.number(),
              daily: v.array(
                v.object({
                  date: v.string(),
                  openingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  inflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  outflows: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  eventIds: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
                }),
              ),
              metrics: v.object({
                minimumBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                minimumDate: v.string(),
                closingBalance: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                operationalShortfall: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                protectionGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                firstCriticalDate: v.nullable(v.string()),
                reserveTarget: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                reserveCoverageGap: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                availableCapacity: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                unconditionalCapacity: v.pipe(
                  v.string(),
                  v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/),
                ),
              }),
              criticalObligations: v.array(
                v.object({
                  eventId: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
                  label: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                  date: v.string(),
                  amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
                  category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
                }),
              ),
            }),
          ),
          v.minLength(0),
          v.maxLength(0),
        ),
        worstCase: v.null(),
      }),
    ]),
  }),
  overhead: v.object({
    items: v.array(
      v.object({
        id: v.string(),
        category: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        periodStart: v.string(),
        periodEnd: v.string(),
        amount: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        paid: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        committedUnpaid: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        remaining: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
        adjustable: v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/)),
      }),
    ),
    planningVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
  }),
  decisions: v.object({
    items: v.array(
      v.object({
        id: v.string(),
        evaluationId: v.string(),
        alternativeId: v.string(),
        createdAt: v.string(),
        creationVersion: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)),
        currentPlanningVersion: v.pipe(
          v.number(),
          v.integer(),
          v.minValue(0),
          v.maxValue(2147483646),
        ),
        validity: v.union([v.literal("current"), v.literal("review_needed")]),
        conditionStatus: v.union([v.literal("pending"), v.literal("confirmed"), v.literal("none")]),
      }),
    ),
    total: v.number(),
  }),
});
export type GetDashboardResult = v.InferOutput<typeof getDashboardResponseSchema>;
const getDashboardcapacityDateQuerySchema = v.string();
const getDashboardcollectionDelayDaysQuerySchema = v.pipe(v.string(), v.regex(/^\d{1,2}$/));

const errorSchema = v.object({ code: v.string(), message: v.string(), requestId: v.string() });
export class MirrorApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly requestId: string,
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "MirrorApiError";
  }
}
const transportMessages = {
  NETWORK_ERROR: "The API could not be reached or its response could not be read.",
  RESPONSE_NOT_JSON: "The API response is not valid JSON.",
  RESPONSE_SCHEMA_INVALID: "The API response does not match its public contract.",
  REQUEST_SCHEMA_INVALID: "The request does not match the public API contract.",
  REQUEST_OPTIONS_INVALID: "The API base URL or request timeout is invalid.",
  REQUEST_ABORTED: "The request was cancelled; this does not confirm a server rollback.",
  REQUEST_TIMEOUT: "The request deadline elapsed; its server outcome may be unknown.",
} as const;
export type MirrorTransportErrorCode = keyof typeof transportMessages;
export class MirrorTransportError extends Error {
  constructor(
    readonly code: MirrorTransportErrorCode,
    readonly status?: number,
    readonly requestId?: string,
    readonly retryAfterMs?: number,
  ) {
    super(transportMessages[code]);
    this.name = "MirrorTransportError";
  }
}
export interface MirrorRequestOptions {
  readonly signal?: AbortSignal;
  /** Total request/body deadline in milliseconds, from 1 through 2147483647. */
  readonly timeoutMs?: number;
}
export interface MirrorClientOptions {
  readonly baseUrl: string;
  readonly accessToken?: () => string | undefined;
  readonly fetch?: typeof fetch;
  /** Default deadline; an operation may override it with its request options. */
  readonly timeoutMs?: number;
}
function validateRequest<Schema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
  schema: Schema,
  input: unknown,
): v.InferOutput<Schema> {
  const parsed = v.safeParse(schema, input);
  if (!parsed.success) throw new MirrorTransportError("REQUEST_SCHEMA_INVALID");
  return parsed.output;
}
function retryAfterMilliseconds(value: string | null): number | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const milliseconds = Number(trimmed) * 1000;
    return Number.isSafeInteger(milliseconds) ? milliseconds : undefined;
  }
  if (
    !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(
      trimmed,
    )
  )
    return undefined;
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toUTCString() !== trimmed)
    return undefined;
  return Math.max(0, timestamp - Date.now());
}
function responseRequestId(response: Response): string | undefined {
  const value = response.headers.get("x-request-id");
  return value !== null && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : undefined;
}
export class MirrorClient {
  constructor(private readonly options: MirrorClientOptions) {}
  private async request<Schema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
    method: string,
    path: string,
    schema: Schema,
    body: unknown,
    query: Readonly<Record<string, string | number | undefined>> | undefined,
    options: MirrorRequestOptions | undefined,
  ): Promise<v.InferOutput<Schema>> {
    const timeoutMs = options?.timeoutMs ?? this.options.timeoutMs;
    if (
      timeoutMs !== undefined &&
      (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2147483647)
    )
      throw new MirrorTransportError("REQUEST_OPTIONS_INVALID");
    let url: URL;
    try {
      url = new URL(this.options.baseUrl.replace(/\/$/, "") + path);
    } catch {
      throw new MirrorTransportError("REQUEST_OPTIONS_INVALID");
    }
    for (const [name, value] of Object.entries(query ?? {}))
      if (value !== undefined) url.searchParams.set(name, String(value));
    const headers: Record<string, string> = { accept: "application/json" };
    const token = this.options.accessToken?.();
    if (token) headers.authorization = `Bearer ${token}`;
    if (body !== undefined) headers["content-type"] = "application/json";
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let cancellationError: MirrorTransportError | undefined;
    let rejectCancellation: ((error: MirrorTransportError) => void) | undefined;
    const cancelled = new Promise<never>((_resolve, reject) => {
      rejectCancellation = reject;
    });
    const cancel = (code: "REQUEST_ABORTED" | "REQUEST_TIMEOUT"): void => {
      if (cancellationError) return;
      cancellationError = new MirrorTransportError(code);
      rejectCancellation?.(cancellationError);
      controller.abort();
    };
    const onAbort = (): void => cancel("REQUEST_ABORTED");
    if (options?.signal?.aborted) throw new MirrorTransportError("REQUEST_ABORTED");
    options?.signal?.addEventListener("abort", onAbort, { once: true });
    if (timeoutMs !== undefined) timeout = setTimeout(() => cancel("REQUEST_TIMEOUT"), timeoutMs);
    try {
      // Racing also settles the caller when an injected/native transport ignores abort.
      return await Promise.race([
        this.readResponse(
          url,
          {
            method,
            headers,
            signal: controller.signal,
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          },
          schema,
        ),
        cancelled,
      ]);
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      options?.signal?.removeEventListener("abort", onAbort);
    }
  }
  private async readResponse<Schema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
    url: URL,
    init: RequestInit,
    schema: Schema,
  ): Promise<v.InferOutput<Schema>> {
    let response: Response;
    try {
      response = await (this.options.fetch ?? fetch)(url, init);
    } catch {
      throw new MirrorTransportError("NETWORK_ERROR");
    }
    const requestId = responseRequestId(response);
    const retryAfterMs = retryAfterMilliseconds(response.headers.get("retry-after"));
    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new MirrorTransportError("NETWORK_ERROR", response.status, requestId, retryAfterMs);
    }
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new MirrorTransportError("RESPONSE_NOT_JSON", response.status, requestId, retryAfterMs);
    }
    if (!response.ok) {
      const error = v.safeParse(errorSchema, payload);
      if (!error.success)
        throw new MirrorTransportError(
          "RESPONSE_SCHEMA_INVALID",
          response.status,
          requestId,
          retryAfterMs,
        );
      throw new MirrorApiError(
        response.status,
        error.output.code,
        error.output.requestId,
        error.output.message,
        retryAfterMs,
      );
    }
    const parsed = v.safeParse(schema, payload);
    if (!parsed.success)
      throw new MirrorTransportError(
        "RESPONSE_SCHEMA_INVALID",
        response.status,
        requestId,
        retryAfterMs,
      );
    return parsed.output;
  }
  async liveness(
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof livenessResponseSchema>> {
    return this.request(
      "GET",
      "/v1/health/live",
      livenessResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async readiness(
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof readinessResponseSchema>> {
    return this.request(
      "GET",
      "/v1/health/ready",
      readinessResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async login(
    body: v.InferInput<typeof loginRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof loginResponseSchema>> {
    return this.request(
      "POST",
      "/v1/auth/login",
      loginResponseSchema,
      validateRequest(loginRequestSchema, body),
      undefined,
      options,
    );
  }
  async refreshSession(
    body: v.InferInput<typeof refreshSessionRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof refreshSessionResponseSchema>> {
    return this.request(
      "POST",
      "/v1/auth/refresh",
      refreshSessionResponseSchema,
      validateRequest(refreshSessionRequestSchema, body),
      undefined,
      options,
    );
  }
  async getSession(
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getSessionResponseSchema>> {
    return this.request(
      "GET",
      "/v1/auth/session",
      getSessionResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async logout(
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof logoutResponseSchema>> {
    return this.request(
      "POST",
      "/v1/auth/logout",
      logoutResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async listBusinesses(
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof listBusinessesResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses",
      listBusinessesResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async getBusiness(
    businessId: string,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getBusinessResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}".replace("{businessId}", encodeURIComponent(businessId)),
      getBusinessResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async updateSettings(
    businessId: string,
    body: v.InferInput<typeof updateSettingsRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof updateSettingsResponseSchema>> {
    return this.request(
      "PATCH",
      "/v1/businesses/{businessId}/settings".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      updateSettingsResponseSchema,
      validateRequest(updateSettingsRequestSchema, body),
      undefined,
      options,
    );
  }
  async listCommitments(
    businessId: string,
    query: {
      offset?: v.InferInput<typeof listCommitmentsoffsetQuerySchema>;
      limit?: v.InferInput<typeof listCommitmentslimitQuerySchema>;
    } = {},
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof listCommitmentsResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/commitments".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      listCommitmentsResponseSchema,
      undefined,
      query,
      options,
    );
  }
  async createCommitment(
    businessId: string,
    body: v.InferInput<typeof createCommitmentRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof createCommitmentResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/commitments".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      createCommitmentResponseSchema,
      validateRequest(createCommitmentRequestSchema, body),
      undefined,
      options,
    );
  }
  async updateCommitment(
    businessId: string,
    id: string,
    body: v.InferInput<typeof updateCommitmentRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof updateCommitmentResponseSchema>> {
    return this.request(
      "PATCH",
      "/v1/businesses/{businessId}/commitments/{id}"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id)),
      updateCommitmentResponseSchema,
      validateRequest(updateCommitmentRequestSchema, body),
      undefined,
      options,
    );
  }
  async createRecurringCommitments(
    businessId: string,
    body: v.InferInput<typeof createRecurringCommitmentsRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof createRecurringCommitmentsResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/commitments/recurring".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      createRecurringCommitmentsResponseSchema,
      validateRequest(createRecurringCommitmentsRequestSchema, body),
      undefined,
      options,
    );
  }
  async adjustOverhead(
    businessId: string,
    id: string,
    body: v.InferInput<typeof adjustOverheadRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof adjustOverheadResponseSchema>> {
    return this.request(
      "PATCH",
      "/v1/businesses/{businessId}/commitments/{id}/adjustment"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id)),
      adjustOverheadResponseSchema,
      validateRequest(adjustOverheadRequestSchema, body),
      undefined,
      options,
    );
  }
  async reconcilePayment(
    businessId: string,
    body: v.InferInput<typeof reconcilePaymentRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof reconcilePaymentResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/reconciliations".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      reconcilePaymentResponseSchema,
      validateRequest(reconcilePaymentRequestSchema, body),
      undefined,
      options,
    );
  }
  async correctReconciliation(
    businessId: string,
    id: string,
    body: v.InferInput<typeof correctReconciliationRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof correctReconciliationResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/reconciliations/{id}/correction"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id)),
      correctReconciliationResponseSchema,
      validateRequest(correctReconciliationRequestSchema, body),
      undefined,
      options,
    );
  }
  async listBudgets(
    businessId: string,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof listBudgetsResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/budgets".replace("{businessId}", encodeURIComponent(businessId)),
      listBudgetsResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async setBudget(
    businessId: string,
    body: v.InferInput<typeof setBudgetRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof setBudgetResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/budgets".replace("{businessId}", encodeURIComponent(businessId)),
      setBudgetResponseSchema,
      validateRequest(setBudgetRequestSchema, body),
      undefined,
      options,
    );
  }
  async getBankAccount(
    businessId: string,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getBankAccountResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/banking/account".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      getBankAccountResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async listBankMovements(
    businessId: string,
    query: {
      offset?: v.InferInput<typeof listBankMovementsoffsetQuerySchema>;
      limit?: v.InferInput<typeof listBankMovementslimitQuerySchema>;
    } = {},
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof listBankMovementsResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/banking/movements".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      listBankMovementsResponseSchema,
      undefined,
      query,
      options,
    );
  }
  async getBankSyncRun(
    businessId: string,
    runId: string,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getBankSyncRunResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/banking/sync-runs/{runId}"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{runId}", encodeURIComponent(runId)),
      getBankSyncRunResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async getLatestBankSyncRun(
    businessId: string,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getLatestBankSyncRunResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/banking/sync-status".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      getLatestBankSyncRunResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async refreshBanking(
    businessId: string,
    body: v.InferInput<typeof refreshBankingRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof refreshBankingResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/banking/refresh".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      refreshBankingResponseSchema,
      validateRequest(refreshBankingRequestSchema, body),
      undefined,
      options,
    );
  }
  async getForecast(
    businessId: string,
    query: {
      capacityDate?: v.InferInput<typeof getForecastcapacityDateQuerySchema>;
      collectionDelayDays?: v.InferInput<typeof getForecastcollectionDelayDaysQuerySchema>;
    } = {},
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getForecastResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/forecast".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      getForecastResponseSchema,
      undefined,
      query,
      options,
    );
  }
  async listEvaluations(
    businessId: string,
    query: {
      offset?: v.InferInput<typeof listEvaluationsoffsetQuerySchema>;
      limit?: v.InferInput<typeof listEvaluationslimitQuerySchema>;
    } = {},
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof listEvaluationsResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/evaluations".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      listEvaluationsResponseSchema,
      undefined,
      query,
      options,
    );
  }
  async evaluateJob(
    businessId: string,
    body: v.InferInput<typeof evaluateJobRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof evaluateJobResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/evaluations".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      evaluateJobResponseSchema,
      validateRequest(evaluateJobRequestSchema, body),
      undefined,
      options,
    );
  }
  async getEvaluation(
    businessId: string,
    id: string,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getEvaluationResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/evaluations/{id}"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id)),
      getEvaluationResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async listDecisions(
    businessId: string,
    query: {
      offset?: v.InferInput<typeof listDecisionsoffsetQuerySchema>;
      limit?: v.InferInput<typeof listDecisionslimitQuerySchema>;
    } = {},
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof listDecisionsResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/decisions".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      listDecisionsResponseSchema,
      undefined,
      query,
      options,
    );
  }
  async confirmDecision(
    businessId: string,
    body: v.InferInput<typeof confirmDecisionRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof confirmDecisionResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/decisions".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      confirmDecisionResponseSchema,
      validateRequest(confirmDecisionRequestSchema, body),
      undefined,
      options,
    );
  }
  async getDecision(
    businessId: string,
    id: string,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getDecisionResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/decisions/{id}"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id)),
      getDecisionResponseSchema,
      undefined,
      undefined,
      options,
    );
  }
  async updateDecisionCondition(
    businessId: string,
    id: string,
    conditionId: string,
    body: v.InferInput<typeof updateDecisionConditionRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof updateDecisionConditionResponseSchema>> {
    return this.request(
      "PATCH",
      "/v1/businesses/{businessId}/decisions/{id}/conditions/{conditionId}"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id))
        .replace("{conditionId}", encodeURIComponent(conditionId)),
      updateDecisionConditionResponseSchema,
      validateRequest(updateDecisionConditionRequestSchema, body),
      undefined,
      options,
    );
  }
  async reevaluateDecision(
    businessId: string,
    id: string,
    body: v.InferInput<typeof reevaluateDecisionRequestSchema>,
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof reevaluateDecisionResponseSchema>> {
    return this.request(
      "POST",
      "/v1/businesses/{businessId}/decisions/{id}/reevaluate"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id)),
      reevaluateDecisionResponseSchema,
      validateRequest(reevaluateDecisionRequestSchema, body),
      undefined,
      options,
    );
  }
  async getDecisionHistory(
    businessId: string,
    id: string,
    query: {
      offset?: v.InferInput<typeof getDecisionHistoryoffsetQuerySchema>;
      limit?: v.InferInput<typeof getDecisionHistorylimitQuerySchema>;
    } = {},
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getDecisionHistoryResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/decisions/{id}/history"
        .replace("{businessId}", encodeURIComponent(businessId))
        .replace("{id}", encodeURIComponent(id)),
      getDecisionHistoryResponseSchema,
      undefined,
      query,
      options,
    );
  }
  async getDashboard(
    businessId: string,
    query: {
      capacityDate?: v.InferInput<typeof getDashboardcapacityDateQuerySchema>;
      collectionDelayDays?: v.InferInput<typeof getDashboardcollectionDelayDaysQuerySchema>;
    } = {},
    options?: MirrorRequestOptions,
  ): Promise<v.InferOutput<typeof getDashboardResponseSchema>> {
    return this.request(
      "GET",
      "/v1/businesses/{businessId}/dashboard".replace(
        "{businessId}",
        encodeURIComponent(businessId),
      ),
      getDashboardResponseSchema,
      undefined,
      query,
      options,
    );
  }
}
