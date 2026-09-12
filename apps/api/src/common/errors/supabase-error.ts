import type { PostgrestError } from "@supabase/supabase-js";

import { AppError } from "./app-error";

export function throwDatabaseError(
  error: PostgrestError,
  operation: string,
): never {
  if (error.code === "23505") {
    throw new AppError(
      operation === "create CFDI import batch"
        ? "This CFDI source has already been imported"
        : "The resource already exists",
      {
        code:
          operation === "create CFDI import batch"
            ? "DUPLICATE_IMPORT"
            : "CONFLICT",
        status: 409,
        details: { operation, databaseCode: error.code },
        cause: error,
      },
    );
  }

  if (error.code === "22P02" || error.code === "23514") {
    throw new AppError("The database rejected the provided values", {
      code: "VALIDATION_FAILED",
      status: 400,
      details: { operation, databaseCode: error.code },
      cause: error,
    });
  }

  if (error.code === "42501") {
    throw new AppError("The database denied this operation", {
      code: "FORBIDDEN",
      status: 403,
      details: { operation, databaseCode: error.code },
      cause: error,
    });
  }

  throw new AppError(`Database operation failed: ${operation}`, {
    code: "DATABASE_ERROR",
    status: 500,
    details: {
      operation,
      databaseCode: error.code,
    },
    cause: error,
  });
}

export function assertDatabaseResult<T>(
  data: T | null,
  error: PostgrestError | null,
  operation: string,
): T {
  if (error) {
    throwDatabaseError(error, operation);
  }

  if (data === null) {
    throw new AppError(`Database operation returned no data: ${operation}`, {
      code: "RESOURCE_NOT_FOUND",
      status: 404,
    });
  }

  return data;
}
