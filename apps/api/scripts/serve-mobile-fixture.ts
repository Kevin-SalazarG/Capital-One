import { randomBytes } from "node:crypto";
import {
  closeSync,
  constants,
  fchmodSync,
  mkdirSync,
  openSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { createHttpAppFixture, type HttpAppFixture } from "../test/fixtures/http-app-fixture.js";

function isIsolatedDatabase(name: string): boolean {
  try {
    const value = process.env[name];
    return value !== undefined && new URL(value).hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

if (process.env.NODE_ENV !== "test" || process.env.MIRROR_TEST_DATABASE_ISOLATED !== "true") {
  throw new Error("Start the mobile fixture through the isolated workspace runner.");
}
if (!isIsolatedDatabase("TEST_ADMIN_DATABASE_URL")) {
  throw new Error("The mobile fixture requires an isolated loopback database.");
}

const credentialsPath = resolve(".local/mobile-demo-credentials.json");
const password = randomBytes(24).toString("hex");
let credentialsWritten = false;
let fixture: HttpAppFixture | undefined;

try {
  fixture = await createHttpAppFixture({
    port: 3000,
    password,
    onShutdown: (): void => {
      if (credentialsWritten) rmSync(credentialsPath, { force: true });
    },
  });
  mkdirSync(resolve(".local"), { recursive: true, mode: 0o700 });
  const descriptor = openSync(
    credentialsPath,
    constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    fchmodSync(descriptor, 0o600);
    writeFileSync(
      descriptor,
      `${JSON.stringify(
        {
          environment: "local-synthetic",
          source: "replay",
          apiUrl: fixture.baseUrl,
          email: fixture.first.email,
          password,
          businessId: fixture.first.businessId,
        },
        null,
        2,
      )}\n`,
    );
    credentialsWritten = true;
  } finally {
    closeSync(descriptor);
  }
  console.log(`Local synthetic Mirror API ready at ${fixture.baseUrl}`);
  console.log(`Local demo credentials: ${credentialsPath}`);
  console.log(
    "Replay data and synthetic authentication; keep this process running for the simulator.",
  );
} catch {
  await fixture?.close();
  console.error(
    "Local mobile fixture could not start. Check database prerequisites and port 3000.",
  );
  process.exitCode = 1;
}
