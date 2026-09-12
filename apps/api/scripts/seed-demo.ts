import "reflect-metadata";
import * as v from "valibot";
import { readConfig } from "../src/config/app-config.js";
import { DatabaseService } from "../src/platform/database/database.service.js";
import {
  REPLAY_ACCOUNT_ID,
  REPLAY_CUTOFF_DATE,
  REPLAY_CUSTOMER_ID,
} from "../src/modules/banking/replay-snapshot.js";

const commonConfigFields = {
  DEMO_USER_ID: v.pipe(v.string(), v.uuid()),
  DEMO_BUSINESS_ID: v.pipe(v.string(), v.uuid()),
  DEMO_SETUP_CONFIRMED: v.literal("synthetic-only"),
};
const nessieIdentifierSchema = v.pipe(v.string(), v.regex(/^[a-fA-F0-9]{24}$/));
const seedConfigSchema = v.variant("BANKING_MODE", [
  v.object({ ...commonConfigFields, BANKING_MODE: v.literal("replay") }),
  v.object({
    ...commonConfigFields,
    BANKING_MODE: v.literal("nessie_live"),
    NESSIE_CUSTOMER_ID: nessieIdentifierSchema,
    NESSIE_ACCOUNT_ID: nessieIdentifierSchema,
  }),
]);

class DemoSetupError extends Error {}

async function seedDemo(): Promise<void> {
  const parsed = v.safeParse(seedConfigSchema, {
    ...process.env,
    BANKING_MODE: process.env.BANKING_MODE ?? "replay",
  });
  if (!parsed.success)
    throw new DemoSetupError(
      "Set DEMO_USER_ID, DEMO_BUSINESS_ID and DEMO_SETUP_CONFIRMED=synthetic-only in protected local configuration. Live mode also requires verified fictional account identifiers.",
    );
  const config = parsed.output;
  const replay = config.BANKING_MODE === "replay";
  const cutoff = replay
    ? REPLAY_CUTOFF_DATE
    : new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Monterrey",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
  const database = new DatabaseService(readConfig({ ...process.env, BANKING_MODE: "replay" }));
  try {
    await database.rpc("mirror_seed_business", {
      p_user_id: config.DEMO_USER_ID,
      p_business_id: config.DEMO_BUSINESS_ID,
      p_mode: config.BANKING_MODE,
      p_customer_id:
        config.BANKING_MODE === "replay" ? REPLAY_CUSTOMER_ID : config.NESSIE_CUSTOMER_ID,
      p_account_id: config.BANKING_MODE === "replay" ? REPLAY_ACCOUNT_ID : config.NESSIE_ACCOUNT_ID,
      p_cutoff: cutoff,
    });
  } catch {
    throw new DemoSetupError(
      "Synthetic setup failed; verify Supabase credentials and migrations. Setup does not reset or overwrite an existing business.",
    );
  }
  console.log(
    replay
      ? "Synthetic reference business created. Replay is dated 2026-09-12; no Nessie request occurred."
      : "Synthetic business linked to the configured sandbox account. Cash data is unavailable until synchronization, and obligations require confirmation. No Nessie request occurred.",
  );
}

await seedDemo().catch((error: unknown) => {
  console.error(
    error instanceof DemoSetupError
      ? error.message
      : "Synthetic setup failed; verify protected local configuration.",
  );
  process.exitCode = 1;
});
