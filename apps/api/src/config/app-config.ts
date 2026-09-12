import type { ConfigService } from "@nestjs/config";

export type EnvironmentName = "development" | "test" | "production";
export type CookieSameSite = "lax" | "strict" | "none";

export interface AppEnvironment {
  readonly NODE_ENV: EnvironmentName;
  readonly PORT: number;
  readonly APP_ORIGIN: string;
  readonly API_PREFIX: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_PUBLISHABLE_KEY?: string;
  readonly SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_SECRET_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly NESSIE_API_KEY: string;
  readonly NESSIE_BASE_URL: string;
  readonly NESSIE_TIMEOUT_MS: number;
  readonly NESSIE_MAX_RETRIES: number;
  readonly AUTH_ACCESS_COOKIE: string;
  readonly AUTH_REFRESH_COOKIE: string;
  readonly AUTH_COOKIE_DOMAIN: string;
  readonly AUTH_COOKIE_SECURE: boolean;
  readonly AUTH_COOKIE_SAME_SITE: CookieSameSite;
  readonly AUTH_ACCESS_TTL_SECONDS: number;
  readonly AUTH_REFRESH_TTL_SECONDS: number;
  readonly RATE_LIMIT_TTL_MS: number;
  readonly RATE_LIMIT_LIMIT: number;
}

export type TypedConfigService = ConfigService<AppEnvironment, boolean>;

export function readPublicSupabaseKey(
  config: ConfigService<AppEnvironment, boolean>,
): string {
  return (
    config.get<string>("SUPABASE_PUBLISHABLE_KEY") ??
    config.get<string>("SUPABASE_ANON_KEY") ??
    (() => {
      throw new Error("A Supabase publishable key is required");
    })()
  );
}

export function readSecretSupabaseKey(
  config: ConfigService<AppEnvironment, boolean>,
): string {
  return (
    config.get<string>("SUPABASE_SECRET_KEY") ??
    config.get<string>("SUPABASE_SERVICE_ROLE_KEY") ??
    (() => {
      throw new Error("A Supabase secret key is required");
    })()
  );
}
