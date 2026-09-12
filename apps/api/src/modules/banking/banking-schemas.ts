import * as v from "valibot";
import { identifierSchema, versionSchema } from "../../platform/http/http-schemas.js";

const bankDateSchema = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));
const bankMoneySchema = v.pipe(v.string(), v.regex(/^-?\d{1,12}\.\d{2}$/));
const sourceSchema = v.picklist(["replay", "nessie_live", "unavailable"]);
export const sourceFreshnessSchema = v.picklist(["current", "stale", "unavailable"]);

export const bankAccountSchema = v.object({
  id: identifierSchema,
  externalId: v.string(),
  provider: v.string(),
  currency: v.literal("MXN"),
  balance: bankMoneySchema,
  cutoffDate: bankDateSchema,
  planningVersion: versionSchema,
  source: sourceSchema,
  sourceSyncedAt: v.nullable(v.string()),
  freshness: sourceFreshnessSchema,
  lastSyncStatus: v.nullable(v.picklist(["running", "succeeded", "failed"])),
  lastSyncErrorCode: v.nullable(v.string()),
});

export const bankMovementSchema = v.object({
  id: identifierSchema,
  externalId: v.string(),
  resource: v.picklist(["deposit", "withdrawal"]),
  status: v.picklist(["pending", "cancelled", "completed"]),
  direction: v.picklist(["inflow", "outflow"]),
  amount: bankMoneySchema,
  currency: v.literal("MXN"),
  date: bankDateSchema,
  classification: v.string(),
  category: v.nullable(v.string()),
  description: v.nullable(v.string()),
});

export const bankMovementListSchema = v.object({
  items: v.array(bankMovementSchema),
  offset: v.number(),
  limit: v.number(),
  total: v.number(),
  planningVersion: versionSchema,
  source: sourceSchema,
  sourceSyncedAt: v.nullable(v.string()),
});

export const syncRequestSchema = v.strictObject({ expectedVersion: versionSchema });
export const syncRunSchema = v.object({
  id: identifierSchema,
  requestRevision: versionSchema,
  status: v.picklist(["running", "succeeded", "failed"]),
  source: sourceSchema,
  cutoffDate: v.nullable(bankDateSchema),
  errorCode: v.nullable(v.string()),
  startedAt: v.string(),
  completedAt: v.nullable(v.string()),
});
export const latestSyncSchema = v.nullable(syncRunSchema);
export const syncResultSchema = v.object({
  run: syncRunSchema,
  planningVersion: versionSchema,
  movementCount: v.number(),
  billCount: v.number(),
  warnings: v.array(v.string()),
});

export type BankAccountResult = v.InferOutput<typeof bankAccountSchema>;
export type BankMovementListResult = v.InferOutput<typeof bankMovementListSchema>;
export type SyncRequest = v.InferOutput<typeof syncRequestSchema>;
export type SyncRunResult = v.InferOutput<typeof syncRunSchema>;
export type SyncResult = v.InferOutput<typeof syncResultSchema>;
export type SourceFreshness = v.InferOutput<typeof sourceFreshnessSchema>;
