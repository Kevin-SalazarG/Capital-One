import * as v from "valibot";

const configSchema = v.object({
  NODE_ENV: v.picklist(["development", "test", "production"]),
  PORT: v.pipe(v.string(), v.regex(/^\d+$/), v.transform(Number), v.minValue(1), v.maxValue(65535)),
  SUPABASE_URL: v.pipe(v.string(), v.url()),
  SUPABASE_ANON_KEY: v.pipe(v.string(), v.minLength(8)),
  SUPABASE_SERVICE_ROLE_KEY: v.pipe(v.string(), v.minLength(8)),
  BANKING_MODE: v.picklist(["replay", "nessie_live"]),
  NESSIE_API_KEY: v.optional(v.string()),
  NESSIE_CUSTOMER_ID: v.optional(v.string()),
  NESSIE_ACCOUNT_ID: v.optional(v.string()),
  NESSIE_UNITS_VERIFIED: v.optional(v.literal("true")),
  TRUST_PROXY_HOPS: v.pipe(v.string(), v.regex(/^[0-2]$/), v.transform(Number)),
});

export type AppConfig = v.InferOutput<typeof configSchema>;
export const APP_CONFIG = Symbol("APP_CONFIG");

export function readConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const result = v.safeParse(configSchema, {
    ...environment,
    NODE_ENV: environment.NODE_ENV ?? "development",
    PORT: environment.PORT ?? "3000",
    TRUST_PROXY_HOPS: environment.TRUST_PROXY_HOPS ?? "0",
    BANKING_MODE: environment.BANKING_MODE ?? "replay",
  });
  if (!result.success)
    throw new Error("Invalid server configuration; check required variable names.");
  const config = result.output;
  if (config.NODE_ENV === "production" && !config.SUPABASE_URL.startsWith("https://")) {
    throw new Error("Production authentication requires HTTPS.");
  }
  if (
    config.BANKING_MODE === "nessie_live" &&
    (!config.NESSIE_API_KEY ||
      !config.NESSIE_CUSTOMER_ID ||
      !config.NESSIE_ACCOUNT_ID ||
      !config.NESSIE_UNITS_VERIFIED)
  ) {
    throw new Error("Live banking requires explicitly verified account configuration.");
  }
  return config;
}
