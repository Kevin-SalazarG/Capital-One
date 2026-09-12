import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const consumer = mkdtempSync(join(tmpdir(), "nessie-node-sdk-consumer-"));
const tarball = join(consumer, "nessie-node-sdk.tgz");
function run(command, args, cwd = root) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (error !== null && typeof error === "object" && "stderr" in error)
      process.stderr.write(String(error.stderr));
    throw error;
  }
}

run("pnpm", ["--config.ignore-scripts=true", "pack", "--out", tarball]);
writeFileSync(
  join(consumer, "package.json"),
  JSON.stringify({
    name: "nessie-package-consumer",
    private: true,
    type: "module",
    dependencies: { "nessie-node-sdk": `file:${tarball}` },
  }),
);
run("pnpm", ["install", "--ignore-scripts"], consumer);

const esm = `
import assert from "node:assert/strict";
import { NessieClient, NessieHttpError } from "nessie-node-sdk";
import { NessieHttpError as ErrorFromSubpath } from "nessie-node-sdk/errors";
import { customerSchema } from "nessie-node-sdk/models/customers";
assert.equal(NessieHttpError, ErrorFromSubpath);
assert.equal(customerSchema.type, "object");
const client = new NessieClient({ apiKey: "package-test", fetch: async () => Response.json([]) });
assert.deepEqual(await client.customers.list(), []);
`;
const cjs = `
const assert = require("node:assert/strict");
const { NessieClient, NessieHttpError } = require("nessie-node-sdk");
const { NessieHttpError: ErrorFromSubpath } = require("nessie-node-sdk/errors");
const { accountCreateSchema } = require("nessie-node-sdk/models/accounts");
assert.equal(NessieHttpError, ErrorFromSubpath);
assert.equal(accountCreateSchema.type, "strict_object");
const client = new NessieClient({ apiKey: "package-test", fetch: async () => Response.json([]) });
client.accounts.list().then(result => assert.deepEqual(result, [])).catch(error => { console.error(error); process.exitCode = 1; });
`;
writeFileSync(join(consumer, "consumer.mjs"), esm);
writeFileSync(join(consumer, "consumer.cjs"), cjs);
run(process.execPath, ["consumer.mjs"], consumer);
run(process.execPath, ["consumer.cjs"], consumer);
const types = `
import { NessieClient, type Customer, type CreationResult } from "nessie-node-sdk";
import type { AccountCreate } from "nessie-node-sdk/models/accounts";
import { NessieHttpError } from "nessie-node-sdk/errors";
const client = new NessieClient({ apiKey: "test" });
const result: Promise<Customer[]> = client.customers.list();
const creation: Promise<CreationResult<Customer>> = client.customers.create({
  first_name: "Jane", last_name: "Doe",
  address: { street_number: "1", street_name: "Main", city: "City", state: "VA", zip: "22201" }
});
const account: AccountCreate = { type: "Savings", nickname: "x", balance: 0, rewards: 0 };
// @ts-expect-error The published declarations must reject unknown account types.
client.accounts.list({ type: "Wallet" });
// @ts-expect-error Published models preserve field types.
const invalid: AccountCreate = { ...account, balance: "10" };
void [result, creation, invalid, NessieHttpError];
`;
for (const ext of ["mts", "cts"]) writeFileSync(join(consumer, `consumer.${ext}`), types);
const readmeExamples = [];
const readme = readFileSync(join(root, "README.md"), "utf8");
for (const [index, match] of Array.from(
  readme.matchAll(/^```(?:ts|js)\n([\s\S]*?)^```/gm),
).entries()) {
  const source = match[1];
  const extension = source.includes("require(") ? "cts" : "mts";
  const path = join(consumer, `readme-${index}.${extension}`);
  const needsClient = /\bnessie\./.test(source) && !/\bconst nessie\s*=/.test(source);
  const setup = needsClient
    ? 'import { NessieClient } from "nessie-node-sdk";\nconst nessie = new NessieClient({ apiKey: "test-key" });\n'
    : "";
  writeFileSync(path, setup + source);
  readmeExamples.push(path);
}
assert(readmeExamples.length > 0, "README must include compilable examples.");
run(
  process.execPath,
  [
    join(root, "node_modules/typescript/bin/tsc"),
    "--noEmit",
    "--strict",
    "--exactOptionalPropertyTypes",
    "--module",
    "NodeNext",
    "--target",
    "ES2022",
    "--types",
    "node",
    "--typeRoots",
    join(root, "node_modules/@types"),
    join(consumer, "consumer.mts"),
    join(consumer, "consumer.cts"),
    ...readmeExamples,
  ],
  consumer,
);
const declarations = [];
function inspectDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) inspectDirectory(path);
    else if (/\.d\.(?:ts|cts)$/.test(entry.name)) declarations.push(path);
  }
}
inspectDirectory(join(root, "dist"));
for (const path of declarations) {
  assert(!/\bany\b/.test(readFileSync(path, "utf8")), `Loose published type in ${path}`);
}
assert(declarations.length > 0);
console.log(
  "Package verified: isolated installation, ESM, CommonJS, subpath exports, published types and README examples.",
);
console.log(`Consumer fixture retained at ${dirname(tarball)}`);
