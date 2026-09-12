import { randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { Decimal } from "decimal.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  toJson,
  type BusinessState,
  type Commitment,
} from "../../src/platform/database/business-state.js";
import type { DatabaseScope } from "../../src/platform/database/database.service.js";
import { createDatabaseFixture, type DatabaseFixture } from "../fixtures/database-fixture.js";

let fixture: DatabaseFixture;

async function seed(): Promise<DatabaseScope> {
  const scope = { userId: randomUUID(), businessId: randomUUID() };
  await fixture.database.rpc("mirror_seed_business", {
    p_user_id: scope.userId,
    p_business_id: scope.businessId,
    p_mode: "replay",
    p_customer_id: "222222222222222222222222",
    p_account_id: "111111111111111111111111",
    p_cutoff: "2026-09-12",
  });
  return scope;
}

async function state(scope: DatabaseScope): Promise<BusinessState> {
  return fixture.database.transaction(scope, async (value) => value);
}

async function change(
  scope: DatabaseScope,
  operation: (value: BusinessState) => void,
): Promise<void> {
  await fixture.database.transaction(scope, async (value) => {
    await fixture.database.advanceVersion(value, scope.businessId, value.business.planningVersion);
    operation(value);
  });
}

function receivable(scope: DatabaseScope, amount = "120.00"): Commitment {
  return {
    id: randomUUID(),
    businessId: scope.businessId,
    title: "Synthetic receivable",
    kind: "inflow",
    amount: new Decimal(amount),
    dueDate: new Date("2026-09-14"),
    category: "sales",
    status: "expected",
    source: "manual",
    negotiable: false,
    occurrenceKey: randomUUID(),
    conservativeDate: null,
    decisionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function sqlAs(
  role: "anon" | "authenticated" | "service_role",
  sql: string,
  values: readonly unknown[] = [],
): Promise<unknown> {
  const client = await fixture.admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);
    const result = await client.query<{ readonly result: unknown }>(sql, [...values]);
    await client.query("COMMIT");
    return result.rows;
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

describe("Supabase RPC isolation and database invariants", () => {
  beforeAll(async () => {
    fixture = await createDatabaseFixture();
  });
  afterAll(async () => {
    await fixture.close();
  });

  it("rejects oversized datasets and rolls back writes that would cross the row limit", async () => {
    const scope = await seed();
    await fixture.admin.query(
      'INSERT INTO mirror.evaluations ("businessId", "createdBy", "planningVersion", "engineVersion", snapshot, job, result) SELECT $1, $2, 0, $3, $4, $4, $4 FROM generate_series(1, 10000)',
      [scope.businessId, scope.userId, "synthetic-limit", {}],
    );
    await expect(
      fixture.database.transaction(scope, async (value) => {
        value.evaluations.push({
          id: randomUUID(),
          businessId: scope.businessId,
          createdBy: scope.userId,
          planningVersion: 0,
          engineVersion: "synthetic-limit",
          snapshot: {},
          job: {},
          result: {},
          createdAt: new Date(),
        });
      }),
    ).rejects.toMatchObject({ code: "DATASET_LIMIT" });
    const count = await fixture.admin.query<{ readonly count: string }>(
      'SELECT count(*) FROM mirror.evaluations WHERE "businessId" = $1',
      [scope.businessId],
    );
    expect(count.rows).toEqual([{ count: "10000" }]);
    const revision = await fixture.admin.query<{ readonly dataRevision: number }>(
      'SELECT "dataRevision" FROM mirror.businesses WHERE id = $1',
      [scope.businessId],
    );
    expect(revision.rows).toEqual([{ dataRevision: 0 }]);
    await fixture.admin.query(
      'INSERT INTO mirror.evaluations ("businessId", "createdBy", "planningVersion", "engineVersion", snapshot, job, result) VALUES ($1, $2, 0, $3, $4, $4, $4)',
      [scope.businessId, scope.userId, "synthetic-limit", {}],
    );
    await expect(state(scope)).rejects.toMatchObject({ code: "DATASET_LIMIT" });
    await expect(fixture.database.beginSync(scope, 0, "2026-09-12")).rejects.toMatchObject({
      code: "DATASET_LIMIT",
    });
    const runs = await fixture.admin.query<{ readonly count: string }>(
      'SELECT count(*) FROM mirror.sync_runs WHERE "businessId" = $1',
      [scope.businessId],
    );
    expect(runs.rows).toEqual([{ count: "0" }]);
  });

  it("restricts public RPCs and keeps the business executor under forced RLS", async () => {
    expect(await fixture.database.ready()).toBe(true);
    for (const role of ["anon", "authenticated"] as const) {
      await expect(sqlAs(role, "SELECT public.mirror_health() AS result")).rejects.toMatchObject({
        code: "42501",
      });
    }
    await expect(sqlAs("service_role", "SELECT * FROM mirror.businesses")).rejects.toMatchObject({
      code: "42501",
    });
    await expect(
      sqlAs("service_role", "SELECT mirror.auth_session_exists($1, $2) AS result", [
        randomUUID(),
        randomUUID(),
      ]),
    ).rejects.toMatchObject({ code: "42501" });
    const roles = await fixture.admin.query<{
      readonly rolcanlogin: boolean;
      readonly rolsuper: boolean;
      readonly rolbypassrls: boolean;
    }>(
      "SELECT rolcanlogin, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'mirror_executor'",
    );
    expect(roles.rows).toEqual([{ rolcanlogin: false, rolsuper: false, rolbypassrls: false }]);
    const tables = await fixture.admin.query<{ readonly guarded: boolean }>(
      "SELECT bool_and(relrowsecurity AND relforcerowsecurity AND pg_get_userbyid(relowner) <> 'mirror_executor') AS guarded FROM pg_class WHERE relnamespace = 'mirror'::regnamespace AND relkind = 'r'",
    );
    expect(tables.rows).toEqual([{ guarded: true }]);
    const authPolicy = await fixture.admin.query<{ readonly relrowsecurity: boolean }>(
      "SELECT relrowsecurity FROM pg_class WHERE oid = 'auth.sessions'::regclass",
    );
    expect(authPolicy.rows).toEqual([{ relrowsecurity: true }]);
  });

  it("isolates active memberships, listings and supplied object identifiers", async () => {
    const first = await seed();
    const second = await seed();
    expect(
      (await fixture.database.listBusinesses(first.userId)).map((business) => business.id),
    ).toEqual([first.businessId]);
    await expect(
      state({ userId: first.userId, businessId: second.businessId }),
    ).rejects.toMatchObject({ code: "BUSINESS_ACCESS_DENIED" });
    const foreign = (await state(second)).commitments[0];
    if (!foreign) throw new Error("The synthetic payroll fixture is missing");
    await expect(
      change(first, (value) =>
        value.commitments.push({ ...foreign, businessId: first.businessId }),
      ),
    ).rejects.toThrow();
    expect((await state(second)).commitments).toHaveLength(1);
    await fixture.admin.query(
      'UPDATE mirror.memberships SET active = false WHERE "businessId" = $1 AND "userId" = $2',
      [first.businessId, first.userId],
    );
    await expect(state(first)).rejects.toMatchObject({ code: "BUSINESS_ACCESS_DENIED" });
    expect(await fixture.database.listBusinesses(first.userId)).toEqual([]);
  });

  it("clears local context after successful and rejected calls on the same connection", async () => {
    const scope = await seed();
    const client = await fixture.admin.connect();
    try {
      for (const userId of [scope.userId, randomUUID()]) {
        await client.query("BEGIN");
        await client.query("SET LOCAL ROLE service_role");
        try {
          await client.query("SELECT public.mirror_state($1, $2)", [userId, scope.businessId]);
          await client.query("COMMIT");
        } catch {
          await client.query("ROLLBACK");
        }
        const context = await client.query<{
          readonly identity_clear: boolean;
          readonly business_clear: boolean;
        }>(
          "SELECT nullif(current_setting('mirror.user_id', true), '') IS NULL AS identity_clear, nullif(current_setting('mirror.business_id', true), '') IS NULL AS business_clear",
        );
        expect(context.rows).toEqual([{ identity_clear: true, business_clear: true }]);
      }
    } finally {
      client.release();
    }
  });

  it("checks managed sessions through a private lookup and persists caller revocation", async () => {
    const scope = await seed();
    const sessionId = randomUUID();
    await fixture.admin.query("INSERT INTO auth.sessions (id, user_id) VALUES ($1, $2)", [
      sessionId,
      scope.userId,
    ]);
    expect(await fixture.database.isSessionActive(scope.userId, sessionId)).toBe(true);
    expect(await fixture.database.isSessionActive(randomUUID(), sessionId)).toBe(false);
    await fixture.database.revokeSession(scope.userId, sessionId, new Date(Date.now() + 60_000));
    await fixture.database.revokeSession(scope.userId, sessionId, new Date(Date.now() + 60_000));
    expect(await fixture.database.isSessionActive(scope.userId, sessionId)).toBe(false);
    const revoked = await fixture.admin.query<{ readonly count: string }>(
      'SELECT count(*) FROM mirror.session_revocations WHERE "sessionId" = $1',
      [sessionId],
    );
    expect(revoked.rows).toEqual([{ count: "1" }]);
  });

  it("preserves exact money and dates and rejects fractional cents and unlisted changes", async () => {
    const scope = await seed();
    await change(scope, (value) => {
      value.business.openingBalance = new Decimal("999999999999.99");
      value.commitments.push(receivable(scope, "0.01"));
    });
    const saved = await state(scope);
    expect(saved.business.openingBalance.toFixed(2)).toBe("999999999999.99");
    expect(saved.commitments.find((row) => row.category === "sales")?.amount.toFixed(2)).toBe(
      "0.01",
    );
    expect(saved.business.cutoff.toISOString()).toBe("2026-09-12T00:00:00.000Z");
    await expect(
      change(scope, (value) => value.commitments.push(receivable(scope, "1.001"))),
    ).rejects.toThrow();
    await expect(
      fixture.database.rpc("mirror_apply_state", {
        p_user_id: scope.userId,
        p_business_id: scope.businessId,
        p_revision: saved.revision,
        p_changes: { deletedCommitments: [saved.commitments[0]?.id ?? ""] },
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE_CHANGE" });
    expect((await state(scope)).business.planningVersion).toBe(1);
  });

  it("requires financial version advancement and rolls back partial work", async () => {
    const scope = await seed();
    await expect(
      fixture.database.transaction(scope, async (value) => {
        value.commitments.push(receivable(scope));
      }),
    ).rejects.toMatchObject({ code: "PLANNING_VERSION_CONFLICT" });
    await expect(
      change(scope, (value) => {
        value.commitments.push(receivable(scope));
        const payroll = value.commitments.find((row) => row.category === "payroll");
        if (!payroll) throw new Error("The synthetic payroll fixture is missing");
        payroll.negotiable = true;
      }),
    ).rejects.toThrow();
    const unchanged = await state(scope);
    expect(unchanged.business.planningVersion).toBe(0);
    expect(unchanged.revision).toBe(0);
    expect(unchanged.commitments).toHaveLength(1);
  });

  it("allows exactly one concurrent compare-and-swap mutation to commit", async () => {
    const scope = await seed();
    let waiting = 0;
    let release = (): void => {};
    const bothRead = new Promise<void>((resolve) => {
      release = resolve;
    });
    const mutate = async (): Promise<void> =>
      fixture.database.transaction(scope, async (value) => {
        waiting += 1;
        if (waiting === 2) release();
        await bothRead;
        await fixture.database.advanceVersion(value, scope.businessId, 0);
        value.commitments.push(receivable(scope));
      });
    const outcomes = await Promise.allSettled([mutate(), mutate()]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    const saved = await state(scope);
    expect(saved.business.planningVersion).toBe(1);
    expect(saved.revision).toBe(1);
    expect(saved.commitments).toHaveLength(2);
  });

  it("holds the parent lock while producing a coherent multi-table snapshot", async () => {
    const scope = await seed();
    const writer = await fixture.admin.connect();
    try {
      await writer.query("BEGIN");
      await writer.query('UPDATE mirror.businesses SET "openingBalance" = 123.45 WHERE id = $1', [
        scope.businessId,
      ]);
      await writer.query('UPDATE mirror.commitments SET amount = 67.89 WHERE "businessId" = $1', [
        scope.businessId,
      ]);
      const reading = state(scope);
      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const activity = await fixture.admin.query<{ readonly blocked: boolean }>(
          "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND query LIKE '%public.\"mirror_state\"%' AND wait_event_type = 'Lock') AS blocked",
        );
        if (activity.rows[0]?.blocked) {
          blocked = true;
          break;
        }
        await pause(10);
      }
      await writer.query("COMMIT");
      const saved = await reading;
      expect(blocked).toBe(true);
      expect(saved.business.openingBalance.toFixed(2)).toBe("123.45");
      expect(saved.commitments[0]?.amount.toFixed(2)).toBe("67.89");
    } finally {
      await writer.query("ROLLBACK");
      writer.release();
    }
  });

  it("allocates database refresh sequence without advancing the financial version", async () => {
    const scope = await seed();
    const first = await fixture.database.beginSync(scope, 0, "2026-09-12");
    const second = await fixture.database.beginSync(scope, 0, "2026-09-12");
    expect(second.sequence > first.sequence).toBe(true);
    const saved = await state(scope);
    expect(saved.revision).toBe(2);
    expect(saved.business.planningVersion).toBe(0);
    expect(saved.syncRuns).toHaveLength(2);
    await expect(fixture.database.beginSync(scope, 1, "2026-09-12")).rejects.toMatchObject({
      code: "PLANNING_VERSION_CONFLICT",
    });
  });

  it("preserves immutable evaluations under RPC and administrator SQL", async () => {
    const scope = await seed();
    const evaluationId = randomUUID();
    await fixture.database.transaction(scope, async (value) => {
      value.evaluations.push({
        id: evaluationId,
        businessId: scope.businessId,
        createdBy: scope.userId,
        planningVersion: 0,
        engineVersion: "synthetic-invariant",
        snapshot: { amount: "12.34" },
        job: { id: "immutable-job" },
        result: { feasible: false },
        createdAt: new Date(),
      });
    });
    await expect(
      fixture.database.transaction(scope, async (value) => {
        const evaluation = value.evaluations[0];
        if (!evaluation) throw new Error("The evaluation fixture is missing");
        evaluation.snapshot = {};
      }),
    ).rejects.toThrow();
    await expect(
      fixture.admin.query("UPDATE mirror.evaluations SET snapshot = '{}'::jsonb WHERE id = $1", [
        evaluationId,
      ]),
    ).rejects.toMatchObject({ code: "23514" });
    expect((await state(scope)).evaluations[0]?.snapshot).toEqual({ amount: "12.34" });
  });

  it("retains reconciliation corrections and guards observed parent amounts", async () => {
    const scope = await seed();
    const commitment = receivable(scope);
    const movementId = randomUUID();
    await change(scope, (value) => {
      const account = value.accounts[0];
      if (!account) throw new Error("The account fixture is missing");
      value.commitments.push(commitment);
      value.movements.push({
        id: movementId,
        businessId: scope.businessId,
        accountId: account.id,
        provider: "nessie",
        resourceType: "deposit",
        externalId: randomUUID(),
        status: "completed",
        direction: "inflow",
        amount: new Decimal("100.00"),
        bookedDate: new Date("2026-09-12"),
        classification: "operating_income",
        category: "sales",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    await change(scope, (value) => {
      value.reconciliations.push({
        id: randomUUID(),
        businessId: scope.businessId,
        movementId,
        commitmentId: commitment.id,
        amount: new Decimal("60.00"),
        evidence: { source: "synthetic" },
        active: true,
        createdBy: scope.userId,
        createdAt: new Date(),
        correctedAt: null,
      });
    });
    await expect(
      change(scope, (value) => {
        value.reconciliations.push({
          id: randomUUID(),
          businessId: scope.businessId,
          movementId,
          commitmentId: commitment.id,
          amount: new Decimal("50.00"),
          evidence: { source: "synthetic" },
          active: true,
          createdBy: scope.userId,
          createdAt: new Date(),
          correctedAt: null,
        });
      }),
    ).rejects.toThrow();
    await change(scope, (value) => {
      const previous = value.reconciliations[0];
      if (!previous) throw new Error("The reconciliation fixture is missing");
      previous.active = false;
      previous.correctedAt = new Date();
      value.reconciliations.push({
        ...previous,
        id: randomUUID(),
        amount: new Decimal("100.00"),
        active: true,
        correctedAt: null,
        createdAt: new Date(),
        evidence: { source: "synthetic correction" },
      });
    });
    await expect(
      change(scope, (value) => {
        const movement = value.movements[0];
        if (!movement) throw new Error("The movement fixture is missing");
        movement.amount = new Decimal("99.00");
      }),
    ).rejects.toThrow();
    const saved = await state(scope);
    expect(saved.reconciliations.map((row) => row.active).sort()).toEqual([false, true]);
    expect(saved.movements[0]?.amount.toFixed(2)).toBe("100.00");
    expect(saved.business.planningVersion).toBe(3);
  });

  it("rejects cross-business foreign keys even when payload scope matches the caller", async () => {
    const first = await seed();
    const second = await seed();
    const other = (await state(second)).accounts[0];
    if (!other) throw new Error("The account fixture is missing");
    const original = await state(first);
    await expect(
      fixture.database.rpc("mirror_apply_state", {
        p_user_id: first.userId,
        p_business_id: first.businessId,
        p_revision: original.revision,
        p_changes: {
          business: { planningVersion: 1 },
          movements: [
            {
              id: randomUUID(),
              businessId: first.businessId,
              accountId: other.id,
              provider: "nessie",
              resourceType: "deposit",
              externalId: randomUUID(),
              status: "completed",
              direction: "inflow",
              amount: "1.00",
              bookedDate: "2026-09-12",
              classification: "operating_income",
            },
          ],
        },
      }),
    ).rejects.toThrow();
    const unchanged = await state(first);
    expect(unchanged.movements).toEqual([]);
    expect(toJson(unchanged.business)).toEqual(toJson(original.business));
  });
});
