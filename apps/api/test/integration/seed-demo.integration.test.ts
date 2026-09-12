import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  REPLAY_ACCOUNT_ID,
  REPLAY_CUTOFF_DATE,
  REPLAY_CUSTOMER_ID,
} from "../../src/modules/banking/replay-snapshot.js";
import { createDatabaseFixture, type DatabaseFixture } from "../fixtures/database-fixture.js";

let persistence: DatabaseFixture;
const apiDirectory = fileURLToPath(new URL("../../", import.meta.url));
const seedPath = fileURLToPath(new URL("../../scripts/seed-demo.ts", import.meta.url));
const secretCanary = "synthetic-seed-secret-must-not-appear";

interface SeedExecution {
  readonly status: number | null;
  readonly output: string;
}
async function runSeed(
  businessId: string,
  userId: string,
  overrides: NodeJS.ProcessEnv = {},
): Promise<SeedExecution> {
  const child = spawn(process.execPath, ["--import", "tsx", seedPath], {
    cwd: apiDirectory,
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "test",
      SUPABASE_URL: persistence.config.SUPABASE_URL,
      SUPABASE_ANON_KEY: persistence.config.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: persistence.config.SUPABASE_SERVICE_ROLE_KEY,
      DEMO_USER_ID: userId,
      DEMO_BUSINESS_ID: businessId,
      DEMO_SETUP_CONFIRMED: "synthetic-only",
      BANKING_MODE: "replay",
      NESSIE_API_KEY: secretCanary,
      ...overrides,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  const collect = (chunk: unknown): void => {
    if (!Buffer.isBuffer(chunk)) throw new Error("Unexpected seed output.");
    output += chunk.toString("utf8");
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  const timeout = setTimeout(() => child.kill("SIGTERM"), 10_000);
  try {
    const status = await new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });
    expect(output).not.toContain(secretCanary);
    expect(output).not.toContain(persistence.config.SUPABASE_SERVICE_ROLE_KEY);
    return { status, output };
  } finally {
    clearTimeout(timeout);
  }
}

describe("Protected seed script through Supabase SDK and isolated PostgreSQL", () => {
  beforeAll(async () => {
    persistence = await createDatabaseFixture();
  });
  afterAll(async () => {
    await persistence.close();
  });

  it("seeds exact synthetic reference data without bank operations", async () => {
    const scope = { businessId: randomUUID(), userId: randomUUID() };
    const result = await runSeed(scope.businessId, scope.userId);
    expect(result.status).toBe(0);
    expect(result.output).toContain("no Nessie request occurred");
    await persistence.database.transaction(scope, async (state) => {
      expect(state.business.openingBalance.toFixed(2)).toBe("50000.00");
      expect(state.business.cutoff.toISOString().slice(0, 10)).toBe(REPLAY_CUTOFF_DATE);
      expect(state.business.sourceSyncedAt?.toISOString()).toBe("2026-09-12T18:00:00.000Z");
      expect(state.business.dataComplete).toBe(true);
      expect(state.business.planningVersion).toBe(0);
      expect(state.accounts[0]?.externalId).toBe(REPLAY_ACCOUNT_ID);
      expect(state.accounts[0]?.connectionId).toBe(REPLAY_CUSTOMER_ID);
      expect(state.commitments[0]?.dueDate.toISOString().slice(0, 10)).toBe("2026-09-30");
      expect(state.budgets[0]?.periodEnd.toISOString().slice(0, 10)).toBe("2026-10-12");
      expect(state.movements).toHaveLength(0);
      expect(state.syncRuns).toHaveLength(0);
    });
  });

  it("links a fictional live account without inventing observed cash or freshness", async () => {
    const scope = { businessId: randomUUID(), userId: randomUUID() };
    const result = await runSeed(scope.businessId, scope.userId, {
      BANKING_MODE: "nessie_live",
      NESSIE_ACCOUNT_ID: "abcdefabcdefabcdefabcdef",
      NESSIE_CUSTOMER_ID: "123456123456123456123456",
    });
    expect(result.status).toBe(0);
    expect(result.output).toContain("Cash data is unavailable until synchronization");
    await persistence.database.transaction(scope, async (state) => {
      expect(state.business.openingBalance.toFixed(2)).toBe("0.00");
      expect(state.business.source).toBe("unavailable");
      expect(state.business.sourceSyncedAt).toBeNull();
      expect(state.business.dataComplete).toBe(false);
      expect(state.accounts[0]?.externalId).toBe("abcdefabcdefabcdefabcdef");
      expect(state.movements).toHaveLength(0);
      expect(state.syncRuns).toHaveLength(0);
    });
  });

  it("refuses repeated setup or a changed owner without overwriting data", async () => {
    const scope = { businessId: randomUUID(), userId: randomUUID() };
    expect((await runSeed(scope.businessId, scope.userId)).status).toBe(0);
    await persistence.admin.query(
      'UPDATE mirror.businesses SET "openingBalance" = 77777.77, "planningVersion" = 3 WHERE id = $1',
      [scope.businessId],
    );
    const retry = await runSeed(scope.businessId, randomUUID());
    expect(retry.status).toBe(1);
    expect(retry.output).toContain("does not reset or overwrite");
    await persistence.database.transaction(scope, async (state) => {
      expect(state.business.openingBalance.toFixed(2)).toBe("77777.77");
      expect(state.business.planningVersion).toBe(3);
      expect(state.commitments).toHaveLength(1);
    });
  });

  it("fails before writes without confirmation or valid live account identifiers", async () => {
    for (const config of [
      { DEMO_SETUP_CONFIRMED: undefined },
      { BANKING_MODE: "nessie_live" },
      {
        BANKING_MODE: "nessie_live",
        NESSIE_ACCOUNT_ID: "invalid",
        NESSIE_CUSTOMER_ID: "123456123456123456123456",
      },
    ]) {
      const scope = { businessId: randomUUID(), userId: randomUUID() };
      expect((await runSeed(scope.businessId, scope.userId, config)).status).toBe(1);
      await expect(
        persistence.database.transaction(scope, async (state) => state.business),
      ).rejects.toMatchObject({ code: "BUSINESS_ACCESS_DENIED" });
    }
  });
});
