import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { BankingService } from "../../src/modules/banking/banking.service.js";
import { ReplayBankingProvider } from "../../src/modules/banking/replay-banking-provider.js";
import { replayBankingSnapshot } from "../../src/modules/banking/replay-snapshot.js";
import { BusinessesService } from "../../src/modules/businesses/businesses.service.js";
import { CommitmentsService } from "../../src/modules/commitments/commitments.service.js";
import { DecisionsService } from "../../src/modules/decisions/decisions.service.js";
import { addCalendarDays } from "../../src/modules/planning/domain/calendar-date.js";
import { PlanningService } from "../../src/modules/planning/planning.service.js";
import {
  type DatabaseScope,
  DatabaseService,
} from "../../src/platform/database/database.service.js";
import { referenceJob } from "../fixtures/financial-reference.js";
import { createDatabaseFixture } from "../fixtures/database-fixture.js";

const persistence = await createDatabaseFixture();
const { database, admin } = persistence;
const businesses = new BusinessesService(database);
const commitments = new CommitmentsService(database);
const banking = new BankingService(
  database,
  new ReplayBankingProvider(replayBankingSnapshot),
  commitments,
  { BANKING_MODE: "replay" },
);
const planning = new PlanningService(database, businesses, commitments, banking);
const decisions = new DecisionsService(database, businesses, commitments, planning);

async function fixture(): Promise<DatabaseScope> {
  const scope = { businessId: randomUUID(), userId: randomUUID() };
  const client = await admin.connect();
  try {
    await client.query<never>("BEGIN");
    await client.query<never>(
      `INSERT INTO mirror.businesses
       (id, name, currency, timezone, cushion, cutoff, "openingBalance", source, "sourceSyncedAt", "dataComplete")
       VALUES ($1, 'Synthetic decision fixture', 'MXN', 'America/Monterrey', 10000, '2026-08-31', 50000, 'replay', now(), true)`,
      [scope.businessId],
    );
    await client.query<never>(
      `INSERT INTO mirror.memberships ("businessId", "userId") VALUES ($1, $2)`,
      [scope.businessId, scope.userId],
    );
    await client.query<never>(
      `INSERT INTO mirror.bank_accounts ("businessId", provider, "connectionId", "externalId")
       VALUES ($1, 'nessie', 'synthetic-decision', $2)`,
      [scope.businessId, randomUUID()],
    );
    await client.query<never>(
      `INSERT INTO mirror.commitments ("businessId", title, kind, amount, "dueDate", category, negotiable)
       VALUES ($1, 'Existing payroll', 'outflow', 30000, '2026-09-18', 'payroll', false)`,
      [scope.businessId],
    );
    await client.query<never>("COMMIT");
  } catch (error: unknown) {
    await client.query<never>("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return scope;
}

async function evaluate(
  scope: DatabaseScope,
): Promise<Awaited<ReturnType<PlanningService["evaluate"]>>> {
  return planning.evaluate(scope, { job: referenceJob(), collectionDelayDays: 0 });
}

describe("Supabase RPC job evaluations and atomic decisions", () => {
  afterAll(async () => {
    await persistence.close();
  });

  it("persists the coherent actual financial snapshot and derives reproducible alternatives", async () => {
    const scope = await fixture();
    const result = await evaluate(scope);
    expect(result.snapshot.input.events).toHaveLength(1);
    expect(result.snapshot.planningVersion).toBe(0);
    expect(result.result.baseline.worstCase?.reserveTarget).toBe("40000.00");
    expect(result.result.alternatives[0]?.selection).toMatchObject({ amount: "30000.00" });
    expect((await planning.get(scope, result.id)).result).toEqual(result.result);
    await expect(
      admin.query<never>("UPDATE mirror.evaluations SET snapshot = '{}'::jsonb WHERE id = $1", [
        result.id,
      ]),
    ).rejects.toThrow();
  });

  it("persists and reads an admitted evaluation larger than eight mebibytes through RPC", async () => {
    const scope = await fixture();
    await admin.query<never>(
      'UPDATE mirror.businesses SET "openingBalance" = 999999999999.99 WHERE id = $1',
      [scope.businessId],
    );
    await admin.query<never>(
      `INSERT INTO mirror.commitments ("businessId", title, kind, amount, "dueDate", category, negotiable)
       SELECT $1, 'Synthetic obligation ' || ordinal, 'outflow', 1000000.01, '2026-09-18'::date, 'payroll', false
       FROM generate_series(1, 396) AS ordinal`,
      [scope.businessId],
    );
    const evaluation = await planning.evaluate(scope, {
      collectionDelayDays: 1,
      job: {
        ...referenceJob(),
        id: "bounded-persistence-job",
        totalCollection: "999999999999.99",
        collectionDate: "2026-09-30",
        costs: Array.from({ length: 100 }, (_, index) => ({
          id: `cost-${index}`,
          label: `Synthetic cost ${index}`,
          date: "2026-09-10",
          amount: "1000000.01",
          category: "supplies",
          negotiable: true,
        })),
        advance: {
          maximumAmount: "999999999999.99",
          allowedDates: Array.from({ length: 32 }, (_, index) =>
            addCalendarDays("2026-08-29", index),
          ),
        },
        supplierOptions: Array.from({ length: 32 }, (_, index) => ({
          id: `option-${index}`,
          costId: "cost-0",
          initialAmount: "1.00",
          deferredDate: "2026-09-29",
          feeAmount: "0.01",
          deliveryMaintained: true,
        })),
      },
    });
    const serialized = JSON.stringify(evaluation.result);
    expect(Buffer.byteLength(serialized)).toBeGreaterThan(8 * 1024 * 1024);
    expect(evaluation.snapshot.input.events).toHaveLength(397);
    expect(JSON.stringify((await planning.get(scope, evaluation.id)).result)).toBe(serialized);
    const listed = await planning.list(scope, { offset: 0, limit: 20 });
    expect(listed.total).toBe(1);
    expect(listed.items[0]?.id).toBe(evaluation.id);
    expect((await businesses.get(scope)).planningVersion).toBe(0);
  });

  it("allows only one of two independent decisions on a shared planning version", async () => {
    const scope = await fixture();
    const first = await evaluate(scope);
    const second = await evaluate(scope);
    const outcomes = await Promise.allSettled(
      [first, second].map((evaluation) =>
        decisions.confirm(scope, {
          evaluationId: evaluation.id,
          alternativeId: "advance:2026-09-17",
          expectedVersion: 0,
          idempotencyKey: randomUUID(),
        }),
      ),
    );
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    const counts = await database.transaction(scope, async (transaction) => ({
      decisions: transaction.decisions.length,
      commitments: transaction.commitments.length,
      conditions: transaction.conditions.length,
      idempotency: transaction.idempotency.length,
    }));
    expect(counts).toEqual({ decisions: 1, commitments: 4, conditions: 1, idempotency: 1 });
    expect((await businesses.get(scope)).planningVersion).toBe(1);
  });

  it("returns one stable result for concurrent duplicate requests and after restarting clients", async () => {
    const scope = await fixture();
    const evaluation = await evaluate(scope);
    const input = {
      evaluationId: evaluation.id,
      alternativeId: "advance:2026-09-17",
      expectedVersion: 0,
      idempotencyKey: randomUUID(),
    };
    const results = await Promise.all([
      decisions.confirm(scope, input),
      decisions.confirm(scope, input),
    ]);
    expect(results[0]).toEqual(results[1]);
    await businesses.update(scope, { expectedVersion: 1, cushion: "12000.00", dataComplete: true });
    const restarted = new DatabaseService(persistence.config);
    const businessService = new BusinessesService(restarted);
    const commitmentService = new CommitmentsService(restarted);
    const bankingService = new BankingService(
      restarted,
      new ReplayBankingProvider(replayBankingSnapshot),
      commitmentService,
      { BANKING_MODE: "replay" },
    );
    const planningService = new PlanningService(
      restarted,
      businessService,
      commitmentService,
      bankingService,
    );
    const service = new DecisionsService(
      restarted,
      businessService,
      commitmentService,
      planningService,
    );
    expect(await service.confirm(scope, input)).toEqual(results[0]);
    await expect(
      service.confirm(scope, { ...input, alternativeId: "original" }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    expect(
      await database.transaction(scope, async (transaction) => transaction.decisions.length),
    ).toBe(1);
  });

  it("rejects a stale evaluation and preserves version when registration is infeasible", async () => {
    const scope = await fixture();
    const evaluation = await evaluate(scope);
    await expect(
      decisions.confirm(scope, {
        evaluationId: evaluation.id,
        alternativeId: "original",
        expectedVersion: 0,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "ALTERNATIVE_INFEASIBLE" });
    expect((await businesses.get(scope)).planningVersion).toBe(0);
    await businesses.update(scope, { expectedVersion: 0, cushion: "11000.00", dataComplete: true });
    await expect(
      decisions.confirm(scope, {
        evaluationId: evaluation.id,
        alternativeId: "advance:2026-09-17",
        expectedVersion: 0,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "EVALUATION_STALE" });
    expect((await planning.get(scope, evaluation.id)).validity).toBe("review_needed");
  });

  it("includes registered commitments once in subsequent evaluations and immutable reviews", async () => {
    const scope = await fixture();
    const evaluation = await evaluate(scope);
    const registered = await decisions.confirm(scope, {
      evaluationId: evaluation.id,
      alternativeId: "advance:2026-09-17",
      expectedVersion: 0,
      idempotencyKey: randomUUID(),
    });
    const second = await planning.evaluate(scope, {
      job: { ...referenceJob(), id: "second-reference-job" },
      collectionDelayDays: 0,
    });
    expect(second.snapshot.input.events).toHaveLength(4);
    expect(second.result.baseline.worstCase?.minimumBalance).toBe("10000.00");
    expect(second.result.baseline.worstCase?.unconditionalCapacity).toBe("0.00");
    await businesses.update(scope, { expectedVersion: 1, cushion: "15000.00", dataComplete: true });
    expect((await decisions.get(scope, registered.decisionId)).validity).toBe("review_needed");
    const reviewed = await decisions.reevaluate(scope, registered.decisionId, {
      expectedVersion: 2,
    });
    expect(reviewed.validity).toBe("current");
    expect(reviewed.latestReview?.result.forecast.worstCase).toMatchObject({
      minimumBalance: "10000.00",
      protectionGap: "5000.00",
    });
    expect(reviewed.latestReview?.snapshot.input.events).toHaveLength(4);
    const history = await decisions.history(scope, registered.decisionId, { offset: 0, limit: 50 });
    expect(history.totalReviews).toBe(1);
    expect(history.evaluation.snapshot.input.cushion).toBe("10000.00");
    expect(
      await database.transaction(scope, async (transaction) => transaction.commitments.length),
    ).toBe(4);
  });

  it("requires real reconciliation evidence for an advance condition", async () => {
    const scope = await fixture();
    const evaluation = await evaluate(scope);
    const registered = await decisions.confirm(scope, {
      evaluationId: evaluation.id,
      alternativeId: "advance:2026-09-17",
      expectedVersion: 0,
      idempotencyKey: randomUUID(),
    });
    const detail = await decisions.get(scope, registered.decisionId);
    const condition = detail.conditions[0];
    if (!condition) throw new Error("Expected a customer condition");
    await expect(
      decisions.updateCondition(scope, registered.decisionId, condition.id, {
        expectedVersion: 1,
        status: "confirmed",
        evidence: "Customer said they would pay",
      }),
    ).rejects.toMatchObject({ code: "RECEIPT_EVIDENCE_REQUIRED" });
    const { advance, account } = await database.transaction(scope, async (state) => {
      const advance = state.commitments.find((commitment) =>
        commitment.occurrenceKey?.endsWith(":advance"),
      );
      const account = state.accounts[0];
      if (!advance || !account) throw new Error("Expected a registered advance and account");
      return { advance, account };
    });
    const movementId = randomUUID();
    await admin.query<never>(
      `INSERT INTO mirror.bank_movements
       (id, "businessId", "accountId", provider, "resourceType", "externalId", status, direction, amount, "bookedDate", classification)
       VALUES ($1, $2, $3, 'nessie', 'deposit', $4, 'completed', 'inflow', 30000, '2026-08-31', 'operating_income')`,
      [movementId, scope.businessId, account.id, randomUUID()],
    );
    await admin.query<never>(
      'UPDATE mirror.businesses SET "openingBalance" = 80000 WHERE id = $1',
      [scope.businessId],
    );
    const reconciliation = await commitments.reconcile(scope, {
      expectedVersion: 1,
      movementId,
      commitmentId: advance.id,
      amount: "30000.00",
      evidence: "Synthetic early receipt included in cutoff",
    });
    const updated = await decisions.updateCondition(scope, registered.decisionId, condition.id, {
      expectedVersion: 2,
      status: "confirmed",
      evidence: "Full advance matched to synthetic deposit",
    });
    expect(updated.conditionStatus).toBe("confirmed");
    expect(
      (await planning.forecast(scope, { collectionDelayDays: 0 })).forecast.worstCase
        ?.closingBalance,
    ).toBe("40000.00");
    await commitments.correctReconciliation(scope, reconciliation.id, {
      expectedVersion: 3,
      evidence: "Synthetic correction removed the previous receipt match",
    });
    const corrected = await decisions.get(scope, registered.decisionId);
    expect(corrected.conditionStatus).toBe("pending");
    expect(corrected.validity).toBe("review_needed");
    expect(corrected.conditions[0]?.status).toBe("pending");
    expect(
      await database.transaction(
        scope,
        async (state) => state.conditions.find((item) => item.id === condition.id)?.status,
      ),
    ).toBe("confirmed");
  });

  it("preserves supplier constraints until both agreement and delivery are confirmed", async () => {
    const scope = await fixture();
    const evaluation = await evaluate(scope);
    const registered = await decisions.confirm(scope, {
      evaluationId: evaluation.id,
      alternativeId: "supplier:reference-installments",
      expectedVersion: 0,
      idempotencyKey: randomUUID(),
    });
    const detail = await decisions.get(scope, registered.decisionId);
    const supplier = detail.conditions.find((condition) => condition.kind === "supplier_agreement");
    const delivery = detail.conditions.find((condition) => condition.kind === "delivery");
    if (!supplier || !delivery) throw new Error("Expected supplier and delivery conditions");
    await decisions.updateCondition(scope, registered.decisionId, supplier.id, {
      expectedVersion: 1,
      status: "confirmed",
      evidence: "Supplier accepts the synthetic schedule",
    });
    expect(
      (await planning.forecast(scope, { collectionDelayDays: 0 })).forecast.conditionStatus,
    ).toBe("conditional");
    const beforeDelivery = await database.transaction(scope, (transaction) =>
      commitments.forecastEventsInTransaction(transaction, scope.businessId),
    );
    expect(beforeDelivery.some((event) => event.conservativeDate !== undefined)).toBe(true);
    await decisions.updateCondition(scope, registered.decisionId, delivery.id, {
      expectedVersion: 2,
      status: "confirmed",
      evidence: "Required delivery was confirmed",
    });
    const afterDelivery = await database.transaction(scope, (transaction) =>
      commitments.forecastEventsInTransaction(transaction, scope.businessId),
    );
    expect(afterDelivery.some((event) => event.conservativeDate !== undefined)).toBe(false);
    await decisions.updateCondition(scope, registered.decisionId, supplier.id, {
      expectedVersion: 3,
      status: "pending",
      evidence: "Supplier requests a revised agreement",
    });
    const reverted = await database.transaction(scope, (transaction) =>
      commitments.forecastEventsInTransaction(transaction, scope.businessId),
    );
    expect(reverted.some((event) => event.conservativeDate === "2026-09-10")).toBe(true);
  });

  it("rejects failed-source confirmation even without a planning-version change", async () => {
    const scope = await fixture();
    const evaluation = await evaluate(scope);
    await admin.query<never>(
      `INSERT INTO mirror.sync_runs ("businessId", "requestRevision", status, source, "errorCode")
       VALUES ($1, 0, 'failed', 'replay', 'PROVIDER_UNAVAILABLE')`,
      [scope.businessId],
    );
    const forecast = await planning.forecast(scope, { collectionDelayDays: 0 });
    expect(forecast.lastSyncFailed).toBe(true);
    await expect(
      decisions.confirm(scope, {
        evaluationId: evaluation.id,
        alternativeId: "advance:2026-09-17",
        expectedVersion: 0,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "SOURCE_REQUIRES_REFRESH" });
    expect((await businesses.get(scope)).planningVersion).toBe(0);
  });

  it("rejects cross-business evaluation, decision, and idempotency probes", async () => {
    const first = await fixture();
    const second = await fixture();
    const evaluation = await evaluate(first);
    const input = {
      evaluationId: evaluation.id,
      alternativeId: "advance:2026-09-17",
      expectedVersion: 0,
      idempotencyKey: randomUUID(),
    };
    const result = await decisions.confirm(first, input);
    await expect(planning.get(second, evaluation.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(decisions.get(second, result.decisionId)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(decisions.confirm(second, input)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      decisions.get({ userId: first.userId, businessId: second.businessId }, result.decisionId),
    ).rejects.toMatchObject({ code: "BUSINESS_ACCESS_DENIED" });
  });

  it("prevents the same logical job from being registered through a second evaluation", async () => {
    const scope = await fixture();
    await admin.query<never>(
      'UPDATE mirror.businesses SET "openingBalance" = 300000 WHERE id = $1',
      [scope.businessId],
    );
    const first = await evaluate(scope);
    await decisions.confirm(scope, {
      evaluationId: first.id,
      alternativeId: "original",
      expectedVersion: 0,
      idempotencyKey: randomUUID(),
    });
    const second = await evaluate(scope);
    expect(second.result.original.feasibility).toBe("feasible");
    await expect(
      decisions.confirm(scope, {
        evaluationId: second.id,
        alternativeId: "original",
        expectedVersion: 1,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "JOB_ALREADY_REGISTERED" });
    await expect(
      database.transaction(scope, async (transaction) => {
        await database.advanceVersion(transaction, scope.businessId, 1);
        const createdAt = new Date();
        transaction.decisions.push({
          id: randomUUID(),
          businessId: scope.businessId,
          evaluationId: second.id,
          jobId: referenceJob().id,
          alternativeId: "original",
          status: "registered",
          createdBy: scope.userId,
          creationVersion: 2,
          createdAt,
          updatedAt: createdAt,
        });
      }),
    ).rejects.toThrow();
    expect((await businesses.get(scope)).planningVersion).toBe(1);
    expect(
      await database.transaction(scope, async (transaction) => transaction.decisions.length),
    ).toBe(1);
    expect(
      await database.transaction(scope, async (transaction) => transaction.commitments.length),
    ).toBe(3);
  });
});
