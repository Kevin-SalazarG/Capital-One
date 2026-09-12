import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { Client } from "pg";

const argumentsList = process.argv.slice(2);
if (argumentsList.length > 1 || (argumentsList.length === 1 && argumentsList[0] !== "--mobile"))
  throw new Error(
    "Use no arguments for integration checks or --mobile for the local simulator API.",
  );
const mobileMode = argumentsList[0] === "--mobile";
let mobileProcess: ChildProcess | undefined;
let stopping = false;
function stopMobile(): void {
  stopping = true;
  mobileProcess?.kill("SIGTERM");
}
if (mobileMode) {
  process.on("SIGINT", stopMobile);
  process.on("SIGTERM", stopMobile);
}

const binary = process.env.PG_BIN ?? "/opt/homebrew/opt/postgresql@17/bin";
const directory = mkdtempSync(join(tmpdir(), "mirror-integration-"));
const dataDirectory = join(directory, "data");
const password = randomBytes(24).toString("hex");
const passwordFile = join(directory, "password");
writeFileSync(passwordFile, password, { mode: 0o600 });
const listener = createServer();
await new Promise<void>((resolveListen, rejectListen) => {
  listener.once("error", rejectListen);
  listener.listen(0, "127.0.0.1", resolveListen);
});
const address = listener.address();
if (address === null || typeof address === "string")
  throw new Error("A test PostgreSQL port could not be allocated");
const port = address.port;
await new Promise<void>((resolveClose, rejectClose) =>
  listener.close((error) => (error ? rejectClose(error) : resolveClose())),
);
const rootUrl = `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
let started = false;
let mobileRuntimeDirectory: string | undefined;
try {
  execFileSync(
    join(binary, "initdb"),
    [
      "-D",
      dataDirectory,
      "-U",
      "postgres",
      "--auth=scram-sha-256",
      "--pwfile",
      passwordFile,
      "--encoding=UTF8",
      "--locale=C",
    ],
    { stdio: "pipe" },
  );
  execFileSync(
    join(binary, "pg_ctl"),
    [
      "-D",
      dataDirectory,
      "-l",
      join(directory, "postgres.log"),
      "-o",
      `-h 127.0.0.1 -p ${port} -k '' -c max_connections=40`,
      "-w",
      "start",
    ],
    { stdio: "pipe" },
  );
  started = true;
  const client = new Client({ connectionString: rootUrl });
  await client.connect();
  await client.query(
    "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL); ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY",
  );
  const migrationDirectory = resolve("apps/api/supabase/migrations");
  for (const name of readdirSync(migrationDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    await client.query(readFileSync(join(migrationDirectory, name), "utf8"));
  }
  await client.end();
  const environment = {
    ...process.env,
    NODE_ENV: "test",
    MIRROR_TEST_DATABASE_ISOLATED: "true",
    TEST_ADMIN_DATABASE_URL: rootUrl,
  };
  if (mobileMode && !stopping) {
    mkdirSync(resolve("apps/api/.local"), { recursive: true });
    mobileRuntimeDirectory = mkdtempSync(resolve("apps/api/.local/mobile-fixture-"));
    const configurationPath = join(mobileRuntimeDirectory, "tsconfig.json");
    // Compile this entry with the backend's decorator metadata. tsx alone does
    // not emit the reflection metadata required by the real Nest controllers.
    writeFileSync(
      configurationPath,
      JSON.stringify({
        extends: resolve("apps/api/tsconfig.json"),
        compilerOptions: { outDir: mobileRuntimeDirectory, rootDir: resolve("apps/api") },
        include: [resolve("apps/api/scripts/serve-mobile-fixture.ts")],
        exclude: [],
      }),
    );
    execFileSync(
      process.execPath,
      [resolve("node_modules/typescript/bin/tsc"), "--project", configurationPath],
      { env: environment, stdio: "inherit" },
    );
    if (!stopping) {
      const child = spawn(
        process.execPath,
        [join(mobileRuntimeDirectory, "scripts/serve-mobile-fixture.js")],
        { env: environment, stdio: "inherit" },
      );
      mobileProcess = child;
      await new Promise<void>((resolveExit, rejectExit) => {
        child.once("error", rejectExit);
        child.once("exit", (code, signal) => {
          if (code === 0 || (stopping && (signal === "SIGTERM" || signal === "SIGINT")))
            resolveExit();
          else rejectExit(new Error("The local mobile API stopped unexpectedly."));
        });
      });
      mobileProcess = undefined;
    }
  } else if (!mobileMode) {
    const testFile = process.env.MIRROR_TEST_FILE;
    if (
      testFile &&
      !/^test\/(?:integration|e2e)\/[a-z-]+(?:\.(?:integration|e2e))?\.test\.ts$/.test(testFile)
    )
      throw new Error("Integration filter must name a local integration or end-to-end test file.");
    execFileSync(
      "pnpm",
      testFile
        ? ["--filter", "@mirror/api", "exec", "vitest", "run", testFile]
        : ["--filter", "@mirror/api", "test:integration"],
      {
        env: environment,
        stdio: "inherit",
      },
    );
    if (process.env.TEST_CONTAINER_IMAGE)
      execFileSync(process.execPath, ["--import", "tsx", "scripts/smoke-container.ts"], {
        env: environment,
        stdio: "inherit",
      });
  }
} catch (error: unknown) {
  console.error(
    error instanceof Error
      ? error.message.replaceAll(password, "[REDACTED]")
      : "Integration checks failed",
  );
  process.exitCode = 1;
} finally {
  if (started)
    execFileSync(join(binary, "pg_ctl"), ["-D", dataDirectory, "-m", "fast", "-w", "stop"], {
      stdio: "pipe",
    });
  rmSync(directory, { recursive: true, force: true });
  if (mobileRuntimeDirectory) rmSync(mobileRuntimeDirectory, { recursive: true, force: true });
  if (mobileMode) {
    process.off("SIGINT", stopMobile);
    process.off("SIGTERM", stopMobile);
  }
}
