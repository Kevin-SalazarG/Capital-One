import type { JsonValue } from "../types/json-value";

export type AppErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_SESSION_INVALID"
  | "AUTH_EMAIL_NOT_CONFIRMED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ORGANIZATION_NOT_FOUND"
  | "ORG_ACCESS_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "VALIDATION_FAILED"
  | "VALIDATION_ERROR"
  | "INVALID_TIME_ZONE"
  | "PLAN_STALE"
  | "PLAN_UNAVAILABLE"
  | "CONFLICT"
  | "EXTERNAL_PROVIDER_ERROR"
  | "EXTERNAL_PROVIDER_UNAVAILABLE"
  | "EMAIL_DELIVERY_ERROR"
  | "EMAIL_DELIVERY_UNAVAILABLE"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_RATE_LIMITED"
  | "DUPLICATE_IMPORT"
  | "DATABASE_ERROR"
  | "FORECAST_INPUTS_INCOMPLETE"
  | "FORECAST_FAILED"
  | "INTERNAL_ERROR";

export interface AppErrorOptions {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: JsonValue;
  readonly cause?: unknown;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: number;
  public readonly details?: JsonValue;

  public constructor(message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status;
    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}
