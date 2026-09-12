import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createDatabaseFixture } from "../fixtures/database-fixture.js";
import { seedBusinessRecords } from "../fixtures/business-record-fixture.js";
import {
  BankingProvider,
  BankingProviderError,
  type BankingLoadRequest,
  type BankingSnapshot,
  type NormalizedMovement,
} from "../../src/modules/banking/banking-provider.js";
import { BankingService } from "../../src/modules/banking/banking.service.js";
import { ReplayBankingProvider } from "../../src/modules/banking/replay-banking-provider.js";
import { replayBankingSnapshot } from "../../src/modules/banking/replay-snapshot.js";
import { CommitmentsService } from "../../src/modules/commitments/commitments.service.js";
import type { DatabaseScope } from "../../src/platform/database/database.service.js";

const test = await createDatabaseFixture();
const database = test.database;
const commitments = new CommitmentsService(database);
const movement: NormalizedMovement = {
  externalId: "333333333333333333333333",
  resource: "deposit",
  direction: "inflow",
  amount: "1000.00",
  date: "2026-09-10",
  status: "completed",
  classification: "unclassified",
  description: "Synthetic observed deposit",
};
const snapshot: BankingSnapshot = { ...replayBankingSnapshot, movements: [movement] };

async function fixture(): Promise<DatabaseScope> {
  return (
    await seedBusinessRecords(test, {
      name: "Synthetic banking fixture",
      cushion: "10000.00",
      cutoff: "2026-09-12",
      customerId: snapshot.account.customerId,
      externalAccountId: snapshot.account.externalId,
    })
  ).scope;
}

function service(data: BankingSnapshot = snapshot): BankingService {
  return new BankingService(database, new ReplayBankingProvider(data), commitments, {
    BANKING_MODE: "replay",
  });
}

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let release = (): void => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, resolve: release };
}

class DelayedBankingProvider extends BankingProvider {
  readonly entered = deferred();
  readonly release = deferred();

  override async load(_request: BankingLoadRequest): Promise<BankingSnapshot> {
    this.entered.resolve();
    await this.release.promise;
    return snapshot;
  }
}

class FailedBankingProvider extends BankingProvider {
  override async load(_request: BankingLoadRequest): Promise<BankingSnapshot> {
    throw new BankingProviderError("PROVIDER_UNAVAILABLE");
  }
}

class SyntheticCurrentAccountProvider extends BankingProvider {
  readonly requests: BankingLoadRequest[] = [];

  constructor(private readonly movements: readonly NormalizedMovement[] = snapshot.movements) {
    super();
  }

  override async load(request: BankingLoadRequest): Promise<BankingSnapshot> {
    this.requests.push(request);
    return {
      ...snapshot,
      source: "nessie_live",
      cutoffDate: request.cutoffDate,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      movements: this.movements,
    };
  }
}

describe("PostgreSQL banking synchronization", () => {
  beforeAll(async () => {
    expect(await database.ready()).toBe(true);
  });

  afterAll(async () => {
    await test.close();
  });

  it("advances live cutoff by the business calendar even when the previous source was replay", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-13T05:59:00.000Z"));
    try {
      const scope = await fixture();
      await test.admin.query("UPDATE mirror.businesses SET cutoff = $1 WHERE id = $2", [
        "2026-09-11",
        scope.businessId,
      ]);
      const provider = new SyntheticCurrentAccountProvider();
      const banking = new BankingService(database, provider, commitments, {
        BANKING_MODE: "nessie_live",
      });
      const first = await banking.sync(scope, 0);
      expect(provider.requests[0]?.cutoffDate).toBe("2026-09-12");
      expect(provider.requests[0]?.timezone).toBe("America/Monterrey");
      expect(first.run.cutoffDate).toBe("2026-09-12");
      expect((await banking.getAccount(scope)).source).toBe("nessie_live");
      vi.setSystemTime(new Date("2026-09-13T06:01:00.000Z"));
      const second = await banking.sync(scope, 1);
      expect(second.run.cutoffDate).toBe("2026-09-13");
      const account = await banking.getAccount(scope);
      expect(account.cutoffDate).toBe("2026-09-13");
      expect(account.freshness).toBe("current");
      expect(account.planningVersion).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the original replay cutoff and timestamp on later calendar days", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-13T18:00:00.000Z"));
    try {
      const scope = await fixture();
      const banking = service();
      const synced = await banking.sync(scope, 0);
      const account = await banking.getAccount(scope);
      expect(synced.run.cutoffDate).toBe("2026-09-12");
      expect(account.sourceSyncedAt).toBe(snapshot.completedAt);
      expect(account.freshness).toBe("stale");
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects future completed cash from every source before publishing a new version", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-12T18:00:00.000Z"));
    try {
      const future = { ...movement, date: "2026-09-13" };
      const providers = [
        service({ ...snapshot, movements: [future] }),
        new BankingService(database, new SyntheticCurrentAccountProvider([future]), commitments, {
          BANKING_MODE: "nessie_live",
        }),
      ];
      for (const banking of providers) {
        const scope = await fixture();
        await service().sync(scope, 0);
        await expect(banking.sync(scope, 1)).rejects.toMatchObject({
          code: "PROVIDER_INCONSISTENT_SNAPSHOT",
        });
        const account = await banking.getAccount(scope);
        expect(account.planningVersion).toBe(1);
        expect(account.balance).toBe("50000.00");
        expect(account.source).toBe("replay");
        expect(account.lastSyncStatus).toBe("failed");
        expect((await banking.listMovements(scope, { offset: 0, limit: 50 })).items[0]?.date).toBe(
          movement.date,
        );
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves future pending and cancelled records without treating them as completed cash", async () => {
    const scope = await fixture();
    const banking = service({
      ...snapshot,
      movements: [
        { ...movement, date: "2026-09-13", status: "pending" },
        {
          ...movement,
          externalId: "444444444444444444444444",
          date: "2026-09-14",
          status: "cancelled",
        },
      ],
    });
    await banking.sync(scope, 0);
    const observed = await banking.listMovements(scope, { offset: 0, limit: 50 });
    expect(observed.items.map((item) => item.status).sort()).toEqual(["cancelled", "pending"]);
    expect((await banking.getAccount(scope)).balance).toBe("50000.00");
  });

  it("publishes a complete version and repeats an import without duplicating observed money", async () => {
    const scope = await fixture();
    const banking = service();
    const first = await banking.sync(scope, 0);
    const second = await banking.sync(scope, 1);
    expect(first.planningVersion).toBe(1);
    expect(second.planningVersion).toBe(2);
    const history = await banking.listMovements(scope, { offset: 0, limit: 50 });
    expect(history.total).toBe(1);
    expect(history.items[0]?.amount).toBe("1000.00");
    const account = await banking.getAccount(scope);
    expect(account.balance).toBe("50000.00");
    expect(account.source).toBe("replay");
    expect(account.sourceSyncedAt).toBe(snapshot.completedAt);
    expect(account.lastSyncStatus).toBe("succeeded");
    expect((await banking.getSyncRun(scope, second.run.id)).status).toBe("succeeded");
    expect(await database.transaction(scope, async (state) => state.auditEvents.length)).toBe(2);
  });

  it("preserves the last complete dataset and records a failed provider update", async () => {
    const scope = await fixture();
    await service().sync(scope, 0);
    const failed = new BankingService(database, new FailedBankingProvider(), commitments, {
      BANKING_MODE: "replay",
    });
    await expect(failed.sync(scope, 1)).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    const account = await failed.getAccount(scope);
    expect(account.planningVersion).toBe(1);
    expect(account.balance).toBe("50000.00");
    expect(account.lastSyncErrorCode).toBe("PROVIDER_UNAVAILABLE");
    expect((await failed.listMovements(scope, { offset: 0, limit: 50 })).total).toBe(1);
    expect((await failed.getLatestSyncRun(scope))?.status).toBe("failed");
  });

  it("does not let a slower older refresh overwrite a newer publication", async () => {
    const scope = await fixture();
    const delayed = new DelayedBankingProvider();
    const older = new BankingService(database, delayed, commitments, { BANKING_MODE: "replay" });
    const olderResult = older.sync(scope, 0).then(
      () => "unexpected_success",
      (error: unknown) => error,
    );
    await delayed.entered.promise;
    const newer = await service().sync(scope, 0);
    delayed.release.resolve();
    expect(newer.planningVersion).toBe(1);
    expect(await olderResult).toMatchObject({ code: "SYNC_SUPERSEDED" });
    expect((await service().getAccount(scope)).planningVersion).toBe(1);
    expect((await service().getSyncRun(scope, newer.run.id)).status).toBe("succeeded");
  });

  it("rolls back a fetched snapshot when another planning writer advances the version", async () => {
    const scope = await fixture();
    const delayed = new DelayedBankingProvider();
    const banking = new BankingService(database, delayed, commitments, { BANKING_MODE: "replay" });
    const result = banking.sync(scope, 0).then(
      () => "unexpected_success",
      (error: unknown) => error,
    );
    await delayed.entered.promise;
    await database.transaction(scope, async (transaction) => {
      await database.advanceVersion(transaction, scope.businessId, 0);
    });
    delayed.release.resolve();
    expect(await result).toMatchObject({ code: "PLANNING_VERSION_CONFLICT" });
    expect((await banking.listMovements(scope, { offset: 0, limit: 50 })).total).toBe(0);
    expect((await banking.getAccount(scope)).planningVersion).toBe(1);
  });

  it("rejects unauthorized business access and sync-run object probing", async () => {
    const first = await fixture();
    const second = await fixture();
    const result = await service().sync(first, 0);
    await expect(
      service().sync({ userId: first.userId, businessId: second.businessId }, 0),
    ).rejects.toMatchObject({ code: "BUSINESS_ACCESS_DENIED" });
    await expect(service().getSyncRun(second, result.run.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect((await service().getAccount(second)).planningVersion).toBe(0);
  });

  it("rejects disappeared source records rather than combining old history with a new balance", async () => {
    const scope = await fixture();
    await service().sync(scope, 0);
    await expect(service({ ...snapshot, movements: [] }).sync(scope, 1)).rejects.toMatchObject({
      code: "PROVIDER_INCONSISTENT_SNAPSHOT",
    });
    expect((await service().getAccount(scope)).planningVersion).toBe(1);
    expect((await service().listMovements(scope, { offset: 0, limit: 50 })).total).toBe(1);
  });

  it("preserves reconciled movement amounts until the existing match is explicitly corrected", async () => {
    const scope = await fixture();
    await service().sync(scope, 0);
    const observed = await database.transaction(scope, async (state) => state.movements[0]);
    if (!observed) throw new Error("Expected the synthetic observed movement.");
    const commitmentId = randomUUID();
    await test.admin.query(
      "INSERT INTO mirror.commitments (id, \"businessId\", title, kind, amount, \"dueDate\", category) VALUES ($1, $2, 'Synthetic receivable', 'inflow', 1000.00, '2026-09-10', 'sales')",
      [commitmentId, scope.businessId],
    );
    await commitments.reconcile(scope, {
      expectedVersion: 1,
      movementId: observed.id,
      commitmentId,
      amount: "500.00",
      evidence: "Explicit synthetic reconciliation",
    });
    await expect(
      service({ ...snapshot, movements: [{ ...movement, amount: "900.00" }] }).sync(scope, 2),
    ).rejects.toMatchObject({ code: "PROVIDER_INCONSISTENT_SNAPSHOT" });
    expect((await service().getAccount(scope)).planningVersion).toBe(2);
    const unchanged = await database.transaction(scope, async (state) => state.movements[0]);
    expect(unchanged?.amount.toFixed(2)).toBe("1000.00");
    expect(
      await database.transaction(
        scope,
        async (state) => state.reconciliations.filter((row) => row.active).length,
      ),
    ).toBe(1);
  });

  it("materializes imported bill occurrences once within the same published version", async () => {
    const scope = await fixture();
    const withBill: BankingSnapshot = {
      ...snapshot,
      bills: [
        {
          externalId: "555555555555555555555555",
          accountId: snapshot.account.externalId,
          payee: "Synthetic supplier",
          nickname: "Synthetic recurring bill",
          amount: "250.25",
          paymentDate: "2026-09-18",
          upcomingDate: "2026-09-18",
          recurringDay: 18,
          status: "recurring",
        },
      ],
    };
    await service(withBill).sync(scope, 0);
    await service(withBill).sync(scope, 1);
    const imported = await database.transaction(scope, async (state) =>
      state.commitments.filter((row) => row.source === "nessie_bill"),
    );
    expect(imported).toHaveLength(1);
    expect(imported[0]?.amount.toFixed(2)).toBe("250.25");
    expect(imported[0]?.dueDate.toISOString().slice(0, 10)).toBe("2026-09-18");
  });
});
