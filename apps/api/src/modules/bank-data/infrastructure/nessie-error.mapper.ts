import {
  NessieAbortError,
  NessieHttpError,
  NessieNetworkError,
  NessieTimeoutError,
} from "nessie-node-sdk";

import { AppError } from "../../../common/errors/app-error";

export function mapNessieError(error: unknown): AppError {
  if (error instanceof NessieTimeoutError) {
    return new AppError("The Nessie provider timed out", {
      code: "UPSTREAM_TIMEOUT",
      status: 504,
      details: { provider: "nessie" },
      cause: error,
    });
  }

  if (error instanceof NessieAbortError) {
    return new AppError("The Nessie provider request was cancelled", {
      code: "EXTERNAL_PROVIDER_UNAVAILABLE",
      status: 503,
      details: { provider: "nessie" },
      cause: error,
    });
  }

  if (error instanceof NessieNetworkError) {
    return new AppError("The Nessie provider is unavailable", {
      code: "EXTERNAL_PROVIDER_UNAVAILABLE",
      status: 503,
      details: { provider: "nessie" },
      cause: error,
    });
  }

  if (error instanceof NessieHttpError && error.status === 429) {
    return new AppError("The Nessie provider rate limit was reached", {
      code: "UPSTREAM_RATE_LIMITED",
      status: 503,
      details: { provider: "nessie" },
      cause: error,
    });
  }

  return new AppError("The Nessie provider request failed", {
    code: "EXTERNAL_PROVIDER_ERROR",
    status: 502,
    details: { provider: "nessie" },
    cause: error,
  });
}
