import "reflect-metadata";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Pool } from "pg";
import * as v from "valibot";
import type { AppConfig } from "../../src/config/app-config.js";
import { DatabaseService } from "../../src/platform/database/database.service.js";

export interface DatabaseFixture {
  readonly database: DatabaseService;
  readonly admin: Pool;
  readonly config: AppConfig;
  readonly close: () => Promise<void>;
}

const rpcBody = v.record(v.pipe(v.string(), v.regex(/^p_[a-z_]+$/)), v.unknown());
const databaseError = v.object({ code: v.string(), message: v.string() });

export function isolatedDatabaseUrl(): string {
  const value = process.env.TEST_ADMIN_DATABASE_URL;
  if (
    !value ||
    process.env.NODE_ENV !== "test" ||
    process.env.MIRROR_TEST_DATABASE_ISOLATED !== "true" ||
    new URL(value).hostname !== "127.0.0.1"
  ) {
    throw new Error("Database fixtures require the isolated local integration runner.");
  }
  return value;
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const parts: Buffer[] = [];
  let length = 0;
  const chunks: AsyncIterable<unknown> = request;
  for await (const chunk of chunks) {
    if (!Buffer.isBuffer(chunk)) throw new Error("Unexpected fixture body.");
    length += chunk.length;
    if (length > 34_603_008) throw new Error("Fixture payload limit exceeded.");
    parts.push(chunk);
  }
  const decoded: unknown = JSON.parse(Buffer.concat(parts).toString("utf8"));
  return decoded;
}

export async function createDatabaseFixture(): Promise<DatabaseFixture> {
  const admin = new Pool({ connectionString: isolatedDatabaseUrl(), max: 8 });
  const serviceKey = "synthetic-server-only-service-key";
  async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const match = request.url?.match(/^\/rest\/v1\/rpc\/(mirror_[a-z_]+)$/);
    const name = match?.[1];
    if (
      request.method !== "POST" ||
      !name ||
      request.headers.apikey !== serviceKey ||
      request.headers.authorization !== `Bearer ${serviceKey}`
    ) {
      response.writeHead(403).end();
      return;
    }
    const args = v.parse(rpcBody, await readBody(request));
    const keys = Object.keys(args);
    const client = await admin.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE service_role");
      await client.query("SET LOCAL statement_timeout = '5s'");
      const result = await client.query<{ result: unknown }>(
        `SELECT public."${name}"(${keys.map((key, position) => `"${key}" => $${position + 1}`).join(", ")}) AS result`,
        keys.map((key) => args[key]),
      );
      await client.query("COMMIT");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(result.rows[0]?.result ?? null));
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      const parsed = v.safeParse(databaseError, error);
      response.writeHead(400, { "content-type": "application/json" });
      response.end(
        JSON.stringify(
          parsed.success ? parsed.output : { code: "XX000", message: "Fixture RPC failed" },
        ),
      );
    } finally {
      client.release();
    }
  }
  // This HTTP fixture executes the deployed SQL functions in real PostgreSQL.
  // It exercises SDK serialization and role boundaries without impersonating a live Supabase deployment.
  const server = createServer((request, response) => {
    void handle(request, response).catch(() => response.writeHead(500).end());
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fixture did not bind a TCP port.");
  const config: AppConfig = {
    NODE_ENV: "test",
    PORT: 3000,
    SUPABASE_URL: `http://127.0.0.1:${address.port}`,
    SUPABASE_ANON_KEY: "synthetic-public-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    BANKING_MODE: "replay",
    TRUST_PROXY_HOPS: 0,
  };
  return {
    database: new DatabaseService(config),
    admin,
    config,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await admin.end();
    },
  };
}
