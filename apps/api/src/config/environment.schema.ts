import Joi from "joi";

export const environmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(3000),
  APP_ORIGIN: Joi.string().uri().default("http://localhost:3001"),
  API_PREFIX: Joi.string()
    .pattern(/^[a-z0-9/-]+$/)
    .default("api/v1"),
  LOG_LEVEL: Joi.string()
    .valid("debug", "info", "warn", "error")
    .default("info"),
  SUPABASE_URL: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
  SUPABASE_PUBLISHABLE_KEY: Joi.string().min(1),
  SUPABASE_ANON_KEY: Joi.string().min(1),
  SUPABASE_SECRET_KEY: Joi.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(1),
  NESSIE_API_KEY: Joi.string().min(1).required(),
  NESSIE_BASE_URL: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .default("https://prod-api.nessieisreal.com"),
  NESSIE_TIMEOUT_MS: Joi.number()
    .integer()
    .positive()
    .max(120000)
    .default(10000),
  NESSIE_MAX_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  RESEND_API_KEY: Joi.string().min(1).optional(),
  RESEND_FROM_EMAIL: Joi.string()
    .min(1)
    .default("Colchón <onboarding@resend.dev>"),
  RESEND_TIMEOUT_MS: Joi.number()
    .integer()
    .positive()
    .max(120000)
    .default(10000),
  AUTH_ACCESS_COOKIE: Joi.string().default("colchon_access_token"),
  AUTH_REFRESH_COOKIE: Joi.string().default("colchon_refresh_token"),
  AUTH_COOKIE_DOMAIN: Joi.string().allow("").default(""),
  AUTH_COOKIE_SECURE: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .default(false),
  AUTH_COOKIE_SAME_SITE: Joi.string()
    .valid("lax", "strict", "none")
    .default("lax"),
  AUTH_ACCESS_TTL_SECONDS: Joi.number().integer().positive().default(3600),
  AUTH_REFRESH_TTL_SECONDS: Joi.number().integer().positive().default(2592000),
  RATE_LIMIT_TTL_MS: Joi.number().integer().positive().default(60000),
  RATE_LIMIT_LIMIT: Joi.number().integer().positive().default(120),
})
  .or("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY")
  .or("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
