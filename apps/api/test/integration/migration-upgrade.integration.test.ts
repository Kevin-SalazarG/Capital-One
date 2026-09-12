import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { businessStateSchema } from "../../src/platform/database/business-state.js";
import { isolatedDatabaseUrl } from "../fixtures/database-fixture.js";

const schemaPath = fileURLToPath(
  new URL("../../supabase/migrations/20260912132954_mirror_schema.sql", import.meta.url),
);
const rpcPath = fileURLToPath(
  new URL("../../supabase/migrations/20260912133001_mirror_rpc.sql", import.meta.url),
);

describe("Supabase schema upgrades with existing financial data", () => {
  it("adds the RPC boundary without replacing prior decisions, exact money or refresh identities", async () => {
    const url = isolatedDatabaseUrl();
    const databaseName = `mirror_upgrade_${randomUUID().replaceAll("-", "")}`;
    const connection = new URL(url);
    connection.pathname = `/${databaseName}`;
    const admin = new Client({ connectionString: url });
    const client = new Client({ connectionString: connection.toString() });
    let created = false;
    try {
      await admin.connect();
      // Only the isolated test administrator creates this UUID-named database.
      await admin.query(`CREATE DATABASE "${databaseName}"`);
      created = true;
      await client.connect();
      await client.query(
        "CREATE SCHEMA auth; CREATE TABLE auth.sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL); ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY",
      );
      await client.query(readFileSync(schemaPath, "utf8"));
      const absent = await client.query<{ readonly absent: boolean }>(
        "SELECT to_regprocedure('public.mirror_state(uuid,uuid)') IS NULL AS absent",
      );
      expect(absent.rows).toEqual([{ absent: true }]);
      const businessId = randomUUID();
      const userId = randomUUID();
      const evaluationId = randomUUID();
      const decisionId = randomUUID();
      const snapshot = { cash: "12.34", marker: "before-rpc-upgrade" };
      await client.query(
        'INSERT INTO mirror.businesses (id, name, cushion, cutoff, "openingBalance", "planningVersion") VALUES ($1, $2, 10.00, $3, 12.34, 1)',
        [businessId, "Synthetic migration fixture", "2026-09-12"],
      );
      await client.query(
        'INSERT INTO mirror.memberships ("businessId", "userId") VALUES ($1, $2)',
        [businessId, userId],
      );
      await client.query(
        'INSERT INTO mirror.evaluations (id, "businessId", "createdBy", "planningVersion", "engineVersion", snapshot, job, result) VALUES ($1, $2, $3, 0, $4, $5, $6, $7)',
        [
          evaluationId,
          businessId,
          userId,
          "synthetic-upgrade",
          snapshot,
          { id: "preserved-job" },
          {},
        ],
      );
      await client.query(
        'INSERT INTO mirror.decisions (id, "businessId", "evaluationId", "jobId", "alternativeId", "createdBy", "creationVersion") VALUES ($1, $2, $3, $4, $5, $6, 1)',
        [decisionId, businessId, evaluationId, "preserved-job", "synthetic-option", userId],
      );
      const runIds = [randomUUID(), randomUUID()];
      for (const runId of runIds) {
        await client.query(
          'INSERT INTO mirror.sync_runs (id, "businessId", "requestRevision", status, source, "startedAt") VALUES ($1, $2, 0, $3, $4, $5)',
          [runId, businessId, "succeeded", "replay", "2026-09-12T12:00:00.000Z"],
        );
      }
      await client.query(readFileSync(rpcPath, "utf8"));
      await client.query("BEGIN; SET LOCAL ROLE service_role");
      const response = await client.query<{ readonly state: unknown }>(
        "SELECT public.mirror_state($1, $2) AS state",
        [userId, businessId],
      );
      const saved = v.parse(businessStateSchema, response.rows[0]?.state);
      expect(saved.business.openingBalance.toFixed(2)).toBe("12.34");
      expect(saved.business.planningVersion).toBe(1);
      expect(saved.evaluations[0]?.snapshot).toEqual(snapshot);
      expect(saved.decisions[0]?.id).toBe(decisionId);
      expect(saved.decisions[0]?.jobId).toBe("preserved-job");
      expect(saved.syncRuns.map((run) => run.id)).toEqual(runIds);
      expect(saved.syncRuns.map((run) => run.sequence)).toEqual([1n, 2n]);
      await client.query("SELECT public.mirror_begin_sync($1, $2, 1, $3)", [
        userId,
        businessId,
        "2026-09-12",
      ]);
      await client.query("COMMIT");
      const sequence = await client.query<{ readonly sequence: string }>(
        'SELECT sequence FROM mirror.sync_runs WHERE "businessId" = $1 ORDER BY sequence DESC LIMIT 1',
        [businessId],
      );
      expect(sequence.rows).toEqual([{ sequence: "3" }]);
      const grants = await client.query<{ readonly allowed: boolean; readonly anonymous: boolean }>(
        "SELECT has_function_privilege('service_role', 'public.mirror_state(uuid,uuid)', 'EXECUTE') AS allowed, has_function_privilege('anon', 'public.mirror_state(uuid,uuid)', 'EXECUTE') AS anonymous",
      );
      expect(grants.rows).toEqual([{ allowed: true, anonymous: false }]);
    } finally {
      await client.end();
      if (created) await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
      await admin.end();
    }
  });
});
