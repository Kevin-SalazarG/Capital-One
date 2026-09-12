import {
  NessieClient,
  type Account,
  type Bill,
  type Deposit,
  type Withdrawal,
} from "nessie-node-sdk";
import { describe, expect, it } from "vitest";
import {
  FIXTURE_ACCOUNT_ID,
  FIXTURE_CUSTOMER_ID,
  fixtureAccount,
  fixtureBankingSnapshot,
  fixtureBill,
  fixtureDeposit,
  fixtureWithdrawal,
} from "../../../test/fixtures/banking-fixtures.js";
import { type BankingLoadRequest, BankingProviderError } from "./banking-provider.js";
import { NessieBankingProvider } from "./nessie-banking-provider.js";
import { normalizeProviderAmount, validateProviderDate } from "./normalize-banking-data.js";
import { ReplayBankingProvider } from "./replay-banking-provider.js";

interface ProviderFixture {
  readonly initialAccount?: Account;
  readonly finalAccount?: Account;
  readonly deposits?: readonly Deposit[];
  readonly withdrawals?: readonly Withdrawal[];
  readonly bills?: readonly Bill[];
}

const request: BankingLoadRequest = {
  customerId: FIXTURE_CUSTOMER_ID,
  accountId: FIXTURE_ACCOUNT_ID,
  cutoffDate: "2026-09-12",
  timezone: "America/Monterrey",
};

function fixtureClient(fixture: ProviderFixture = {}): NessieClient {
  let accountReads = 0;
  return new NessieClient({
    apiKey: "synthetic-test-key",
    fetch: async (url: URL): Promise<Response> => {
      if (url.pathname === `/accounts/${FIXTURE_ACCOUNT_ID}`) {
        accountReads += 1;
        return Response.json(
          accountReads > 1
            ? (fixture.finalAccount ?? fixtureAccount)
            : (fixture.initialAccount ?? fixtureAccount),
        );
      }
      if (url.pathname === `/accounts/${FIXTURE_ACCOUNT_ID}/deposits`) {
        return Response.json(fixture.deposits ?? [fixtureDeposit]);
      }
      if (url.pathname === `/accounts/${FIXTURE_ACCOUNT_ID}/withdrawals`) {
        return Response.json(fixture.withdrawals ?? [fixtureWithdrawal]);
      }
      if (url.pathname === `/accounts/${FIXTURE_ACCOUNT_ID}/bills`) {
        return Response.json(fixture.bills ?? [fixtureBill]);
      }
      throw new Error("Unexpected fixture request path.");
    },
  });
}

function provider(fixture: ProviderFixture = {}): NessieBankingProvider {
  return new NessieBankingProvider(
    fixtureClient(fixture),
    {
      customerId: FIXTURE_CUSTOMER_ID,
      accountId: FIXTURE_ACCOUNT_ID,
      verifiedMajorMxnUnits: true,
      timeoutMs: 1_000,
    },
    () => new Date("2026-09-12T18:00:00.000Z"),
  );
}

describe("Nessie banking provider", () => {
  it("normalizes selected-account data without declaring deposits operating revenue", async () => {
    const snapshot = await provider().load(request);
    expect(snapshot.account.balance).toBe("50000.00");
    expect(snapshot.movements.map((movement) => movement.amount)).toEqual(["1000.00", "125.25"]);
    expect(snapshot.movements.every((movement) => movement.classification === "unclassified")).toBe(
      true,
    );
    expect(snapshot.bills[0]?.amount).toBe("250.25");
    expect(snapshot.consistency).toBe("stable_balance_bracket");
    expect(snapshot.warnings).toContain(
      "Nessie endpoint reads are not an atomic provider snapshot.",
    );
  });

  it("requires verified live units before making provider requests", async () => {
    const unverified = new NessieBankingProvider(fixtureClient(), {
      customerId: FIXTURE_CUSTOMER_ID,
      accountId: FIXTURE_ACCOUNT_ID,
      verifiedMajorMxnUnits: false,
      timeoutMs: 1_000,
    });
    await expect(unverified.load(request)).rejects.toMatchObject({ code: "PROVIDER_NOT_VERIFIED" });
  });

  it("rejects caller-selected account and customer scope", async () => {
    await expect(provider().load({ ...request, accountId: "other-account" })).rejects.toMatchObject(
      {
        code: "PROVIDER_SCOPE_MISMATCH",
      },
    );
    await expect(
      provider().load({ ...request, customerId: "other-customer" }),
    ).rejects.toMatchObject({
      code: "PROVIDER_SCOPE_MISMATCH",
    });
  });

  it("rejects provider account and bill scope mismatches", async () => {
    await expect(
      provider({ initialAccount: { ...fixtureAccount, customer_id: "other" } }).load(request),
    ).rejects.toMatchObject({ code: "PROVIDER_SCOPE_MISMATCH" });
    await expect(
      provider({ bills: [{ ...fixtureBill, account_id: "666666666666666666666666" }] }).load(
        request,
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_SCOPE_MISMATCH" });
  });

  it("rejects a changed account bracket", async () => {
    await expect(
      provider({ finalAccount: { ...fixtureAccount, balance: 51_000 } }).load(request),
    ).rejects.toMatchObject({ code: "PROVIDER_INCONSISTENT_SNAPSHOT" });
  });

  it("rejects a read crossing midnight in the business timezone", async () => {
    let reads = 0;
    const crossing = new NessieBankingProvider(
      fixtureClient(),
      {
        customerId: FIXTURE_CUSTOMER_ID,
        accountId: FIXTURE_ACCOUNT_ID,
        verifiedMajorMxnUnits: true,
        timeoutMs: 1_000,
      },
      () => {
        reads += 1;
        return new Date(reads === 1 ? "2026-09-13T05:59:59.000Z" : "2026-09-13T06:00:01.000Z");
      },
    );
    await expect(crossing.load(request)).rejects.toMatchObject({
      code: "PROVIDER_INCONSISTENT_SNAPSHOT",
    });
  });

  it("rejects a requested live cutoff that differs from the business calendar day", async () => {
    await expect(provider().load({ ...request, cutoffDate: "2026-09-11" })).rejects.toMatchObject({
      code: "PROVIDER_INCONSISTENT_SNAPSHOT",
    });
  });

  it("preserves completed, pending, and cancelled movement states", async () => {
    const snapshot = await provider({
      deposits: [{ ...fixtureDeposit, status: "pending" }],
      withdrawals: [{ ...fixtureWithdrawal, status: "cancelled" }],
    }).load(request);
    expect(snapshot.movements.map((movement) => movement.status)).toEqual(["pending", "cancelled"]);
  });

  it("rejects unknown provider states and missing critical withdrawal fields", async () => {
    await expect(
      provider({ deposits: [{ ...fixtureDeposit, status: "unexpected" }] }).load(request),
    ).rejects.toMatchObject({ code: "PROVIDER_INVALID_DATA" });
    const missingDate: Withdrawal = {
      _id: fixtureWithdrawal._id,
      amount: fixtureWithdrawal.amount,
      medium: fixtureWithdrawal.medium,
      status: "completed",
    };
    await expect(provider({ withdrawals: [missingDate] }).load(request)).rejects.toMatchObject({
      code: "PROVIDER_INVALID_DATA",
    });
  });

  it("deduplicates identical records but rejects divergent records sharing an identity", async () => {
    const snapshot = await provider({ deposits: [fixtureDeposit, fixtureDeposit] }).load(request);
    expect(snapshot.movements).toHaveLength(2);
    await expect(
      provider({ deposits: [fixtureDeposit, { ...fixtureDeposit, amount: 2_000 }] }).load(request),
    ).rejects.toMatchObject({ code: "PROVIDER_INCONSISTENT_SNAPSHOT" });
  });

  it("rejects an over-limit response instead of publishing a truncated snapshot", async () => {
    await expect(
      provider({ deposits: Array.from({ length: 501 }, () => fixtureDeposit) }).load(request),
    ).rejects.toMatchObject({ code: "PROVIDER_INPUT_LIMIT" });
  });

  it("supports explicitly empty provider history", async () => {
    const snapshot = await provider({ deposits: [], withdrawals: [], bills: [] }).load(request);
    expect(snapshot.movements).toEqual([]);
    expect(snapshot.bills).toEqual([]);
  });

  it("rejects fractional deposits that violate the public SDK contract", async () => {
    await expect(
      provider({ deposits: [{ ...fixtureDeposit, amount: 0.25 }] }).load(request),
    ).rejects.toMatchObject({ code: "PROVIDER_INVALID_DATA" });
  });

  it("returns safe provider failures without copying echoed credentials", async () => {
    const failedClient = new NessieClient({
      apiKey: "synthetic-test-key",
      fetch: async (): Promise<Response> =>
        Response.json({ error: "synthetic-test-key" }, { status: 401 }),
    });
    const failedProvider = new NessieBankingProvider(
      failedClient,
      {
        customerId: FIXTURE_CUSTOMER_ID,
        accountId: FIXTURE_ACCOUNT_ID,
        verifiedMajorMxnUnits: true,
        timeoutMs: 1_000,
      },
      () => new Date("2026-09-12T18:00:00.000Z"),
    );
    await expect(failedProvider.load(request)).rejects.toEqual(
      new BankingProviderError("PROVIDER_UNAVAILABLE"),
    );
  });

  it("bounds the complete refresh deadline including a stalled response body", async () => {
    const stalledClient = new NessieClient({
      apiKey: "synthetic-test-key",
      fetch: async (): Promise<Response> => new Response(new ReadableStream<Uint8Array>()),
    });
    const stalledProvider = new NessieBankingProvider(
      stalledClient,
      {
        customerId: FIXTURE_CUSTOMER_ID,
        accountId: FIXTURE_ACCOUNT_ID,
        verifiedMajorMxnUnits: true,
        timeoutMs: 10,
      },
      () => new Date("2026-09-12T18:00:00.000Z"),
    );
    await expect(stalledProvider.load(request)).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT" });
  });

  it("supports caller cancellation without publishing a snapshot", async () => {
    const cancellation = new AbortController();
    cancellation.abort();
    await expect(
      provider().load({ ...request, signal: cancellation.signal }),
    ).rejects.toMatchObject({
      code: "PROVIDER_CANCELLED",
    });
  });
});

describe("provider normalization policy", () => {
  it("serializes exact decimal strings and rejects invalid precision and range", () => {
    expect(normalizeProviderAmount(0.1)).toBe("0.10");
    expect(normalizeProviderAmount(0)).toBe("0.00");
    for (const amount of [0.001, -1, Number.NaN, Number.POSITIVE_INFINITY, 1_000_000_000_000]) {
      expect(() => normalizeProviderAmount(amount)).toThrow(BankingProviderError);
    }
  });

  it("validates calendar dates rather than silently shifting invalid days", () => {
    expect(validateProviderDate("2024-02-29")).toBe("2024-02-29");
    for (const date of ["2026-02-29", "2026-02-30", "2026-13-01", "09/12/2026", undefined]) {
      expect(() => validateProviderDate(date)).toThrow(BankingProviderError);
    }
  });
});

describe("replay provider", () => {
  it("retains synthetic provenance and cutoff without mutating the stored fixture", async () => {
    const replay = new ReplayBankingProvider(fixtureBankingSnapshot);
    const snapshot = await replay.load(request);
    expect(snapshot.source).toBe("replay");
    expect(snapshot).toEqual(fixtureBankingSnapshot);
    expect(snapshot).not.toBe(fixtureBankingSnapshot);
  });

  it("rejects mismatched business source and attempts to relabel an older cutoff", async () => {
    const replay = new ReplayBankingProvider(fixtureBankingSnapshot);
    await expect(replay.load({ ...request, accountId: "other" })).rejects.toMatchObject({
      code: "PROVIDER_SCOPE_MISMATCH",
    });
    await expect(replay.load({ ...request, cutoffDate: "2026-09-13" })).rejects.toMatchObject({
      code: "PROVIDER_INCONSISTENT_SNAPSHOT",
    });
  });
});
