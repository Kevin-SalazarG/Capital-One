import { describe, expect, it } from "vitest";
import { readConfig } from "./app-config.js";

const environment: NodeJS.ProcessEnv = {
  SUPABASE_URL: "https://synthetic.invalid",
  SUPABASE_ANON_KEY: "synthetic-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
  BANKING_MODE: "replay",
};

describe("server configuration", () => {
  it("fails closed without credentials and reports variable-independent safe errors", () => {
    expect(() => readConfig({ ...environment, SUPABASE_URL: "secret-invalid-url" })).toThrow(
      "Invalid server configuration",
    );
    expect(() => readConfig({})).toThrow("Invalid server configuration");
  });
  it("requires explicit live-account and unit verification", () => {
    expect(() => readConfig({ ...environment, BANKING_MODE: "nessie_live" })).toThrow(
      "Live banking requires",
    );
    expect(readConfig(environment).BANKING_MODE).toBe("replay");
  });
  it("accepts the public anon-key name and defaults to labeled replay", () => {
    const config = readConfig({
      SUPABASE_URL: environment.SUPABASE_URL,
      SUPABASE_ANON_KEY: "synthetic-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
    });
    expect(config.SUPABASE_ANON_KEY).toBe("synthetic-anon-key");
    expect(config.BANKING_MODE).toBe("replay");
    expect(() => readConfig({ ...environment, SUPABASE_SERVICE_ROLE_KEY: undefined })).toThrow(
      "Invalid server configuration",
    );
  });
  it("rejects insecure production authentication and unbounded proxy trust", () => {
    expect(() =>
      readConfig({
        ...environment,
        NODE_ENV: "production",
        SUPABASE_URL: "http://synthetic.invalid",
      }),
    ).toThrow("HTTPS");
    expect(() => readConfig({ ...environment, TRUST_PROXY_HOPS: "99" })).toThrow(
      "Invalid server configuration",
    );
  });
});
