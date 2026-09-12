import { Decimal } from "decimal.js";
import * as v from "valibot";

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((item: unknown) => isJsonValue(item));
  return (
    typeof value === "object" && Object.values(value).every((item: unknown) => isJsonValue(item))
  );
}

const json = v.custom<JsonValue>(isJsonValue);
const id = v.pipe(v.string(), v.uuid());
const text = v.string();
const timestamp = v.pipe(
  v.string(),
  v.transform((value) => new Date(value)),
  v.date(),
);
const money = v.pipe(
  v.string(),
  v.regex(/^-?\d+(?:\.\d+)?$/),
  v.transform((value) => new Decimal(value)),
);
const integer = v.pipe(v.number(), v.integer(), v.minValue(0));
const stamps = { createdAt: timestamp, updatedAt: timestamp };

export const businessSchema = v.object({
  id,
  name: text,
  currency: text,
  timezone: text,
  cushion: money,
  planningVersion: integer,
  dataComplete: v.boolean(),
  cutoff: timestamp,
  openingBalance: money,
  source: text,
  sourceSyncedAt: v.nullable(timestamp),
  ...stamps,
});
const accountSchema = v.object({
  id,
  businessId: id,
  provider: text,
  connectionId: text,
  externalId: text,
  createdAt: timestamp,
});
const movementSchema = v.object({
  id,
  businessId: id,
  accountId: id,
  provider: text,
  resourceType: text,
  externalId: text,
  status: text,
  direction: text,
  amount: money,
  bookedDate: timestamp,
  classification: text,
  category: v.nullable(text),
  description: v.nullable(text),
  ...stamps,
});
export const syncRunSchema = v.object({
  id,
  businessId: id,
  sequence: v.pipe(
    v.string(),
    v.regex(/^\d+$/),
    v.transform((value) => BigInt(value)),
  ),
  requestRevision: integer,
  status: text,
  source: text,
  cutoff: v.nullable(timestamp),
  errorCode: v.nullable(text),
  startedAt: timestamp,
  completedAt: v.nullable(timestamp),
});
const commitmentSchema = v.object({
  id,
  businessId: id,
  title: text,
  kind: text,
  amount: money,
  dueDate: timestamp,
  category: text,
  status: text,
  source: text,
  negotiable: v.boolean(),
  occurrenceKey: v.nullable(text),
  conservativeDate: v.nullable(timestamp),
  decisionId: v.nullable(id),
  ...stamps,
});
const budgetSchema = v.object({
  id,
  businessId: id,
  category: text,
  periodStart: timestamp,
  periodEnd: timestamp,
  amount: money,
});
const reconciliationSchema = v.object({
  id,
  businessId: id,
  movementId: id,
  commitmentId: id,
  amount: money,
  evidence: json,
  active: v.boolean(),
  createdBy: id,
  createdAt: timestamp,
  correctedAt: v.nullable(timestamp),
});
const evaluationSchema = v.object({
  id,
  businessId: id,
  createdBy: id,
  planningVersion: integer,
  engineVersion: text,
  snapshot: json,
  job: json,
  result: json,
  createdAt: timestamp,
});
const decisionSchema = v.object({
  id,
  businessId: id,
  evaluationId: id,
  jobId: text,
  alternativeId: text,
  status: text,
  createdBy: id,
  creationVersion: integer,
  ...stamps,
});
const conditionSchema = v.object({
  id,
  businessId: id,
  decisionId: id,
  kind: text,
  status: text,
  evidence: v.nullable(text),
  updatedBy: v.nullable(id),
  updatedAt: timestamp,
});
const idempotencySchema = v.object({
  id,
  businessId: id,
  userId: id,
  key: text,
  requestHash: text,
  decisionId: id,
  createdAt: timestamp,
});
const auditSchema = v.object({
  id,
  businessId: id,
  userId: id,
  action: text,
  entityId: v.nullable(id),
  metadata: json,
  createdAt: timestamp,
});

export const businessStateSchema = v.object({
  revision: integer,
  business: businessSchema,
  accounts: v.array(accountSchema),
  movements: v.array(movementSchema),
  syncRuns: v.array(syncRunSchema),
  commitments: v.array(commitmentSchema),
  budgets: v.array(budgetSchema),
  reconciliations: v.array(reconciliationSchema),
  evaluations: v.array(evaluationSchema),
  decisions: v.array(decisionSchema),
  conditions: v.array(conditionSchema),
  idempotency: v.array(idempotencySchema),
  auditEvents: v.array(auditSchema),
});

export type BusinessState = v.InferOutput<typeof businessStateSchema>;
export type Business = v.InferOutput<typeof businessSchema>;
export type BankAccount = v.InferOutput<typeof accountSchema>;
export type BankMovement = v.InferOutput<typeof movementSchema>;
export type SyncRun = v.InferOutput<typeof syncRunSchema>;
export type Commitment = v.InferOutput<typeof commitmentSchema>;
export type Budget = v.InferOutput<typeof budgetSchema>;
export type Reconciliation = v.InferOutput<typeof reconciliationSchema>;
export type Evaluation = v.InferOutput<typeof evaluationSchema>;
export type Decision = v.InferOutput<typeof decisionSchema>;
export type DecisionCondition = v.InferOutput<typeof conditionSchema>;
export type Idempotency = v.InferOutput<typeof idempotencySchema>;
export type AuditEvent = v.InferOutput<typeof auditSchema>;

export function toJson(value: unknown): JsonValue {
  const serialized = JSON.stringify(value, (_key, item: unknown) =>
    typeof item === "bigint" ? item.toString() : item,
  );
  if (serialized === undefined) throw new Error("Database values must be serializable.");
  const parsed: unknown = JSON.parse(serialized);
  return v.parse(json, parsed);
}
