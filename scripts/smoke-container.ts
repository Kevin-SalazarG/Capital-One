import { execFileSync } from "node:child_process";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";

const apiImage = process.env.TEST_CONTAINER_IMAGE;
if (!apiImage) throw new Error("TEST_CONTAINER_IMAGE must identify the built API image.");
const postgresImage =
  "postgres:17.11-bookworm@sha256:051f7b7b3abdd564d5d1bd1e8c4b9c1b6e77087d1dd22020ede611c096a272e0";
const postgrestImage =
  "postgrest/postgrest:v16.3@sha256:ec0e25a4e24b0a3bc5e4f011369bfc736bd1b19f513bd01079b86329a7636962";
const directory = mkdtempSync(join(tmpdir(), "mirror-container-"));
const suffix = randomBytes(6).toString("hex");
const network = `mirror-smoke-${suffix}`;
const databaseContainer = `${network}-database`;
const restContainer = `${network}-rest`;
const gatewayContainer = `${network}-gateway`;
const apiContainer = `${network}-api`;
const password = randomBytes(24).toString("hex");
const authenticatorPassword = randomBytes(24).toString("hex");
const jwtSecret = randomBytes(32).toString("hex");
const userId = randomUUID();
const businessId = randomUUID();
const containers: string[] = [];
let networkCreated = false;

function token(role: "anon" | "service_role"): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ role, iat: issuedAt, exp: issuedAt + 3600 }),
  ).toString("base64url");
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}
const anonymousKey = token("anon");
const serviceKey = token("service_role");
const secrets = [password, authenticatorPassword, jwtSecret, anonymousKey, serviceKey];

function docker(argumentsList: readonly string[], input?: string | Buffer): string {
  return execFileSync("docker", argumentsList, {
    encoding: "utf8",
    stdio: "pipe",
    timeout: 120_000,
    ...(input === undefined ? {} : { input }),
  }).trim();
}

function environmentFile(name: string, entries: Readonly<Record<string, string>>): string {
  const path = join(directory, name);
  writeFileSync(
    path,
    `${Object.entries(entries)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")}\n`,
    { mode: 0o600 },
  );
  return path;
}

function startContainer(name: string, options: readonly string[], image: string): void {
  docker(["run", "--detach", "--name", name, "--network", network, ...options, image]);
  containers.push(name);
}

function sql(statement: string, database = "postgres"): string {
  return docker(
    [
      "exec",
      "--interactive",
      databaseContainer,
      "psql",
      "-XAt",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      database,
    ],
    statement,
  );
}

function insideApi(program: string): string {
  return docker(["exec", apiContainer, "node", "--input-type=module", "-e", program]);
}

async function waitForStatus(url: string, expected: number): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.status === expected) return;
    } catch {
      // Startup and deliberately stopped dependencies can refuse connections.
    }
    await setTimeout(100);
  }
  throw new Error(`The container did not return expected HTTP status ${expected}.`);
}

// This local routing adapter supplies Supabase's REST prefix to real PostgREST.
// It does not implement RPCs or authentication and is absent from the API image.
const gatewayProgram = `
import { createServer, request } from 'node:http';
const server = createServer((incoming, outgoing) => {
  if (!incoming.url?.startsWith('/rest/v1/')) {
    outgoing.writeHead(404).end();
    return;
  }
  const upstream = request(new URL(incoming.url.slice('/rest/v1'.length), process.env.SMOKE_REST_URL), {
    method: incoming.method,
    headers: incoming.headers,
    signal: AbortSignal.timeout(8000),
  }, response => {
    outgoing.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(outgoing);
  });
  upstream.on('error', () => {
    if (!outgoing.headersSent) outgoing.writeHead(502);
    outgoing.end();
  });
  incoming.on('aborted', () => upstream.destroy());
  incoming.pipe(upstream);
});
server.listen(3000, '0.0.0.0');
process.once('SIGTERM', () => server.close(() => process.exit(0)));
`;

try {
  docker(["network", "create", network]);
  networkCreated = true;
  startContainer(
    databaseContainer,
    [
      "--tmpfs",
      "/var/lib/postgresql/data:rw,size=256m",
      "--env-file",
      environmentFile("database.env", { POSTGRES_PASSWORD: password }),
    ],
    postgresImage,
  );
  let databaseReady = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      docker(["exec", databaseContainer, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]);
      databaseReady = true;
      break;
    } catch {
      await setTimeout(100);
    }
  }
  if (!databaseReady) throw new Error("The isolated container database did not start.");
  sql(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE ROLE authenticator LOGIN NOINHERIT NOBYPASSRLS PASSWORD '${authenticatorPassword}';
    GRANT anon, authenticated, service_role TO authenticator;
    CREATE SCHEMA auth;
    CREATE TABLE auth.sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL);
    ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
  `);
  const migrationDirectory = resolve("apps/api/supabase/migrations");
  for (const name of readdirSync(migrationDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort())
    sql(readFileSync(join(migrationDirectory, name), "utf8"));
  sql(`
    INSERT INTO mirror.businesses (id, name, cushion, cutoff, "openingBalance")
    VALUES ('${businessId}', 'Container recovery fixture', 10.00, '2026-09-12', 12.34);
    INSERT INTO mirror.memberships ("businessId", "userId") VALUES ('${businessId}', '${userId}');
  `);
  const dump = execFileSync(
    "docker",
    [
      "exec",
      databaseContainer,
      "pg_dump",
      "-U",
      "postgres",
      "--format=custom",
      "--schema=mirror",
      "--schema=public",
      "postgres",
    ],
    { stdio: "pipe", timeout: 120_000 },
  );
  sql("CREATE DATABASE mirror_recovery");
  sql(
    "DROP SCHEMA public; CREATE SCHEMA auth; CREATE TABLE auth.sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL); ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY",
    "mirror_recovery",
  );
  docker(
    [
      "exec",
      "--interactive",
      databaseContainer,
      "pg_restore",
      "-U",
      "postgres",
      "--exit-on-error",
      "--dbname=mirror_recovery",
    ],
    dump,
  );
  const restoredBalance = sql(
    `SET ROLE service_role; SELECT public.mirror_state('${userId}', '${businessId}') -> 'business' ->> 'openingBalance'`,
    "mirror_recovery",
  );
  if (!restoredBalance.endsWith("12.34"))
    throw new Error(
      "The database dump did not restore the exact balance and authorized RPC access.",
    );
  console.log("Container SQL migrations and exact-money dump/restore passed.");
  sql(
    "CREATE FUNCTION public.mirror_timeout_probe() RETURNS void LANGUAGE sql AS 'SELECT pg_sleep(6)'; REVOKE ALL ON FUNCTION public.mirror_timeout_probe() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.mirror_timeout_probe() TO service_role",
  );

  startContainer(
    restContainer,
    [
      "--read-only",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      "--env-file",
      environmentFile("rest.env", {
        PGRST_DB_URI: `postgresql://authenticator:${authenticatorPassword}@${databaseContainer}:5432/postgres`,
        PGRST_DB_ANON_ROLE: "anon",
        PGRST_DB_SCHEMAS: "public",
        PGRST_DB_POOL: "4",
        PGRST_JWT_SECRET: jwtSecret,
        PGRST_LOG_LEVEL: "error",
      }),
    ],
    postgrestImage,
  );
  docker([
    "run",
    "--detach",
    "--name",
    gatewayContainer,
    "--network",
    network,
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--env",
    `SMOKE_REST_URL=http://${restContainer}:3000`,
    apiImage,
    "node",
    "--input-type=module",
    "-e",
    gatewayProgram,
  ]);
  containers.push(gatewayContainer);
  startContainer(
    apiContainer,
    [
      "--read-only",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      "--publish",
      "127.0.0.1::3000",
      "--env-file",
      environmentFile("api.env", {
        NODE_ENV: "test",
        PORT: "3000",
        SUPABASE_URL: `http://${gatewayContainer}:3000`,
        SUPABASE_ANON_KEY: anonymousKey,
        SUPABASE_SERVICE_ROLE_KEY: serviceKey,
        BANKING_MODE: "replay",
      }),
    ],
    apiImage,
  );
  const mappedPort = docker(["port", apiContainer, "3000/tcp"]);
  if (!/^127\.0\.0\.1:\d+$/.test(mappedPort))
    throw new Error("The API must publish only on loopback.");
  const baseUrl = `http://${mappedPort}/v1`;
  await waitForStatus(`${baseUrl}/health/ready`, 200);
  await waitForStatus(`${baseUrl}/health/live`, 200);
  await waitForStatus(`${baseUrl}/businesses`, 401);
  const protections = docker([
    "inspect",
    "--format",
    '{{.Config.User}}|{{.HostConfig.ReadonlyRootfs}}|{{join .HostConfig.CapDrop ","}}|{{join .HostConfig.SecurityOpt ","}}',
    apiContainer,
  ]);
  if (protections !== "node|true|ALL|no-new-privileges")
    throw new Error("The runtime container restrictions were not applied.");
  insideApi(`
    import assert from 'node:assert/strict';
    import { existsSync, readdirSync } from 'node:fs';
    import { NessieClient } from 'nessie-node-sdk';
    import { readConfig } from './dist/config/app-config.js';
    assert.equal(typeof NessieClient, 'function');
    for (const path of ['src', 'test', '.env']) assert.equal(existsSync(path), false);
    assert.equal(readdirSync('node_modules/.pnpm').some(name => /^(?:typescript|tsx|vitest|pg|@types\\+pg)@/.test(name)), false);
    assert.throws(() => readConfig({ ...process.env, NODE_ENV: 'production' }));
    assert.equal(readConfig(process.env).NODE_ENV, 'test');
    console.log('Runtime dependencies, public SDK import, and production HTTPS validation passed.');
  `);
  insideApi(`
    import assert from 'node:assert/strict';
    import { DatabaseService } from './dist/platform/database/database.service.js';
    import { readConfig } from './dist/config/app-config.js';
    const config = readConfig(process.env);
    const database = new DatabaseService(config);
    const scope = { userId: '${userId}', businessId: '${businessId}' };
    const balance = await database.transaction(scope, async state => state.business.openingBalance.toFixed(2));
    assert.equal(balance, '12.34');
    await database.transaction(scope, async state => {
      await database.advanceVersion(state, scope.businessId, 0);
      state.business.name = 'Container RPC mutation';
    });
    assert.equal((await database.listBusinesses(scope.userId))[0].name, 'Container RPC mutation');
    const request = async (key, path, body) => fetch(config.SUPABASE_URL + '/rest/v1/rpc/' + path, {
      method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
    });
    const anonymous = await request(config.SUPABASE_ANON_KEY, 'mirror_state', { p_user_id: scope.userId, p_business_id: scope.businessId });
    assert.ok(anonymous.status === 401 || anonymous.status === 403 || anonymous.status === 404);
    const stale = await request(config.SUPABASE_SERVICE_ROLE_KEY, 'mirror_apply_state', {
      p_user_id: scope.userId, p_business_id: scope.businessId, p_revision: 0, p_changes: {},
    });
    assert.equal(stale.status, 500);
    const staleBody = await stale.json();
    assert.equal(staleBody.code, '40001');
    const started = performance.now();
    const deadline = await fetch(config.SUPABASE_URL + '/rest/v1/rpc/mirror_timeout_probe', {
      method: 'POST', headers: { Authorization: 'Bearer ' + config.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
      body: '{}', signal: AbortSignal.timeout(8000),
    });
    assert.equal((await deadline.json()).code, '57014');
    assert.ok(performance.now() - started >= 4500 && performance.now() - started < 7500);
    await assert.rejects(database.transaction({ ...scope, userId: '00000000-0000-4000-8000-000000000001' }, async () => true), { code: 'BUSINESS_ACCESS_DENIED' });
    console.log('Real PostgREST RPC, exact money, writes, CAS, anonymous denial, and scope isolation passed.');
  `);
  const logs = docker(["logs", apiContainer]);
  if (secrets.some((secret) => logs.includes(secret)))
    throw new Error("The runtime logs exposed a synthetic credential.");
  docker(["stop", "--time", "10", restContainer]);
  await waitForStatus(`${baseUrl}/health/ready`, 503);
  docker(["stop", "--time", "10", apiContainer]);
  const exitCode = docker(["inspect", "--format", "{{.State.ExitCode}}", apiContainer]);
  if (exitCode !== "0" && exitCode !== "143")
    throw new Error("The API did not stop cleanly on SIGTERM.");
  console.log(
    "Container HTTP readiness, auth boundary, dependency failure, restrictions, redaction, and SIGTERM passed.",
  );
  console.log(
    "Verified local PostgreSQL/PostgREST with NODE_ENV=test HTTP routing; production HTTPS remains required. No hosted Supabase or Nessie mutation was performed.",
  );
} catch (error: unknown) {
  let message = error instanceof Error ? error.message : "Container verification failed.";
  for (const secret of secrets) message = message.replaceAll(secret, "[REDACTED]");
  console.error(message);
  process.exitCode = 1;
} finally {
  for (const name of containers.reverse()) {
    try {
      docker(["rm", "--force", name]);
    } catch {
      console.error("An isolated smoke container could not be removed.");
      process.exitCode = 1;
    }
  }
  if (networkCreated) {
    try {
      docker(["network", "rm", network]);
    } catch {
      console.error("The isolated smoke network could not be removed.");
      process.exitCode = 1;
    }
  }
  rmSync(directory, { recursive: true, force: true });
}
