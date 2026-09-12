import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseFixture } from "../fixtures/database-fixture.js";
import { seedBusinessRecords } from "../fixtures/business-record-fixture.js";
import type { NormalizedBill } from "../../src/modules/banking/banking-provider.js";
import { BudgetsService } from "../../src/modules/commitments/budgets.service.js";
import { CommitmentsService } from "../../src/modules/commitments/commitments.service.js";
import type {
  CommitmentInput,
  RecurringInput,
} from "../../src/modules/commitments/commitment-schemas.js";
import type { DatabaseScope } from "../../src/platform/database/database.service.js";

const test = await createDatabaseFixture();
const database = test.database;
const commitments = new CommitmentsService(database);
const budgets = new BudgetsService(database);

interface Fixture {
  readonly scope: DatabaseScope;
  readonly accountId: string;
}

async function fixture(cutoff = "2026-09-30"): Promise<Fixture> {
  return seedBusinessRecords(test, {
    name: "Synthetic commitment fixture",
    cutoff,
    cushion: "1000.00",
    customerId: "synthetic-commitments",
    externalAccountId: randomUUID(),
    dataComplete: true,
  });
}

function payable(expectedVersion: number): CommitmentInput {
  return {
    expectedVersion,
    title: "Synthetic supplies",
    kind: "outflow",
    amount: "100.00",
    dueDate: "2026-09-30",
    category: "supplies",
    status: "expected",
    negotiable: true,
  };
}

async function withdrawal(
  current: Fixture,
  amount: string,
  date: string,
  category: string | null,
): Promise<string> {
  const movementId = randomUUID();
  await test.admin.query(
    "INSERT INTO mirror.bank_movements (id, \"businessId\", \"accountId\", provider, \"resourceType\", \"externalId\", status, direction, amount, \"bookedDate\", classification, category) VALUES ($1, $2, $3, 'nessie', 'withdrawal', $4, 'completed', 'outflow', $5, $6, 'unclassified', $7)",
    [movementId, current.scope.businessId, current.accountId, randomUUID(), amount, date, category],
  );
  return movementId;
}

describe("PostgreSQL commitments, reconciliation, recurrence and overhead", () => {
  beforeAll(async () => {
    expect(await database.ready()).toBe(true);
  });
  afterAll(async () => {
    await test.close();
  });

  it("moves partial and full payments from committed to paid without double counting category spending", async () => {
    const current = await fixture();
    await budgets.set(current.scope, {
      expectedVersion: 0,
      category: "supplies",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      amount: "1000.00",
    });
    await budgets.set(current.scope, {
      expectedVersion: 1,
      category: "uncategorized",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      amount: "1000.00",
    });
    const created = await commitments.create(current.scope, payable(2));
    const firstMovement = await withdrawal(current, "40.00", "2026-09-15", null);
    const first = await commitments.reconcile(current.scope, {
      expectedVersion: 3,
      movementId: firstMovement,
      commitmentId: created.commitment.id,
      amount: "40.00",
      evidence: "Synthetic partial supplier payment",
    });
    const partial = await budgets.list(current.scope);
    expect(partial.items.find((budget) => budget.category === "supplies")).toMatchObject({
      paid: "40.00",
      committedUnpaid: "60.00",
      remaining: "900.00",
      adjustable: "60.00",
    });
    expect(partial.items.find((budget) => budget.category === "uncategorized")?.paid).toBe("0.00");
    const duplicate = await commitments.reconcile(current.scope, {
      expectedVersion: 3,
      movementId: firstMovement,
      commitmentId: created.commitment.id,
      amount: "40.00",
      evidence: "Same synthetic payment retry",
    });
    expect(duplicate.id).toBe(first.id);
    expect(duplicate.planningVersion).toBe(4);
    const secondMovement = await withdrawal(current, "60.00", "2026-09-20", "supplies");
    await commitments.reconcile(current.scope, {
      expectedVersion: 4,
      movementId: secondMovement,
      commitmentId: created.commitment.id,
      amount: "60.00",
      evidence: "Synthetic remaining supplier payment",
    });
    const fullyPaid = await budgets.list(current.scope);
    expect(fullyPaid.items.find((budget) => budget.category === "supplies")).toMatchObject({
      paid: "100.00",
      committedUnpaid: "0.00",
      remaining: "900.00",
      adjustable: "0.00",
    });
    const paidCommitment = (
      await commitments.list(current.scope, { offset: 0, limit: 50 })
    ).items.find((item) => item.id === created.commitment.id);
    expect(paidCommitment).toMatchObject({
      status: "settled",
      remainingAmount: "0.00",
      receivedAmount: "100.00",
    });
    await commitments.correctReconciliation(current.scope, first.id, {
      expectedVersion: 5,
      evidence: "Synthetic correction restores the unpaid portion",
    });
    const corrected = await budgets.list(current.scope);
    expect(corrected.items.find((budget) => budget.category === "supplies")).toMatchObject({
      paid: "60.00",
      committedUnpaid: "40.00",
      remaining: "900.00",
    });
    expect(corrected.items.find((budget) => budget.category === "uncategorized")?.paid).toBe(
      "40.00",
    );
    expect(
      (await commitments.list(current.scope, { offset: 0, limit: 50 })).items[0],
    ).toMatchObject({ receivedAmount: "60.00", remainingAmount: "40.00", status: "expected" });
    expect(await database.transaction(current.scope, async (state) => state.movements.length)).toBe(
      2,
    );
  });

  it("materializes the exact monthly count and preserves paid or cancelled occurrence identity on replay", async () => {
    const current = await fixture("2026-12-31");
    const input: RecurringInput = {
      ...payable(0),
      seriesId: randomUUID(),
      dueDate: "2026-09-20",
      dayOfMonth: 18,
      occurrences: 3,
    };
    const first = await commitments.recurring(current.scope, input);
    expect(first.items.map((item) => item.dueDate)).toEqual([
      "2026-10-18",
      "2026-11-18",
      "2026-12-18",
    ]);
    const cancelled = first.items[0];
    const paid = first.items[1];
    const pending = first.items[2];
    if (!cancelled || !paid || !pending) throw new Error("Expected three monthly occurrences");
    await commitments.update(current.scope, cancelled.id, {
      ...payable(1),
      dueDate: cancelled.dueDate,
      status: "cancelled",
    });
    const movement = await withdrawal(current, "100.00", "2026-11-18", "supplies");
    await commitments.reconcile(current.scope, {
      expectedVersion: 2,
      movementId: movement,
      commitmentId: paid.id,
      amount: "100.00",
      evidence: "Synthetic November recurring payment",
    });
    const replay = await commitments.recurring(current.scope, { ...input, expectedVersion: 3 });
    expect(replay.items.map((item) => item.id)).toEqual(first.items.map((item) => item.id));
    expect(replay.items.map((item) => item.status)).toEqual(["cancelled", "settled", "expected"]);
    expect(replay.items.map((item) => item.remainingAmount)).toEqual(["0.00", "0.00", "100.00"]);
    const events = await database.transaction(current.scope, (transaction) =>
      commitments.forecastEventsInTransaction(transaction, current.scope.businessId),
    );
    expect(events.map((event) => event.id)).toEqual([pending.id]);
    expect(
      await database.transaction(current.scope, async (state) => state.commitments.length),
    ).toBe(3);
  });

  it("clamps month-end recurrence dates without dropping or duplicating an occurrence", async () => {
    const current = await fixture();
    const result = await commitments.recurring(current.scope, {
      ...payable(0),
      dueDate: "2028-01-31",
      dayOfMonth: 31,
      occurrences: 3,
      seriesId: randomUUID(),
    });
    expect(result.items.map((item) => item.dueDate)).toEqual([
      "2028-01-31",
      "2028-02-29",
      "2028-03-31",
    ]);
    expect(new Set(result.items.map((item) => item.occurrenceKey)).size).toBe(3);
  });

  it("reuses imported bill identity and excludes completed or cancelled bills from future cash", async () => {
    const current = await fixture("2026-09-12");
    const bill: NormalizedBill = {
      externalId: "synthetic-recurring-bill",
      accountId: current.accountId,
      payee: "Synthetic recurring supplier",
      nickname: "Recurring supplies",
      amount: "250.25",
      paymentDate: "2026-09-18",
      upcomingDate: "2026-09-18",
      recurringDay: 18,
      status: "recurring",
    };
    async function importBill(
      record: NormalizedBill,
      expectedVersion: number,
      cutoffDate = "2026-09-12",
    ): Promise<void> {
      await database.transaction(current.scope, async (transaction) => {
        await database.advanceVersion(transaction, current.scope.businessId, expectedVersion);
        transaction.business.cutoff = new Date(cutoffDate);
        await commitments.importBillsInTransaction(
          transaction,
          current.scope,
          [record],
          cutoffDate,
        );
      });
    }
    await importBill(bill, 0);
    await importBill(bill, 1);
    const initial = await commitments.list(current.scope, { offset: 0, limit: 50 });
    expect(initial.total).toBe(1);
    await expect(importBill({ ...bill, status: "completed" }, 2)).rejects.toThrow();
    await importBill({ ...bill, status: "completed" }, 2, "2026-09-20");
    const completed = await commitments.list(current.scope, { offset: 0, limit: 50 });
    expect(completed.items[0]).toMatchObject({
      id: initial.items[0]?.id,
      status: "settled",
      remainingAmount: "0.00",
    });
    expect(
      await database.transaction(current.scope, (transaction) =>
        commitments.forecastEventsInTransaction(transaction, current.scope.businessId),
      ),
    ).toEqual([]);
    await importBill({ ...bill, status: "cancelled" }, 3, "2026-09-20");
    const cancelled = await commitments.list(current.scope, { offset: 0, limit: 50 });
    expect(cancelled.total).toBe(1);
    expect(cancelled.items[0]?.remainingAmount).toBe("0.00");
    expect(cancelled.items[0]?.status).toBe("settled");
  });

  it("rejects overmatching and adjustments to observed or protected expenditure without advancing the version", async () => {
    const current = await fixture();
    const created = await commitments.create(current.scope, {
      ...payable(0),
      category: "payroll",
      negotiable: false,
    });
    await expect(
      commitments.adjust(current.scope, created.commitment.id, {
        expectedVersion: 1,
        amount: "50.00",
      }),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_ADJUSTABLE" });
    const movement = await withdrawal(current, "120.00", "2026-09-20", "payroll");
    await expect(
      commitments.reconcile(current.scope, {
        expectedVersion: 1,
        movementId: movement,
        commitmentId: created.commitment.id,
        amount: "100.01",
        evidence: "Synthetic excess matching rejection",
      }),
    ).rejects.toMatchObject({ code: "RECONCILIATION_INVALID" });
    expect((await commitments.list(current.scope, { offset: 0, limit: 50 })).planningVersion).toBe(
      1,
    );
    expect(
      await database.transaction(current.scope, async (state) => state.reconciliations.length),
    ).toBe(0);
  });
});
