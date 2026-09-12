import * as v from "valibot";
import { NessieValidationError, type ValidationIssue } from "../errors/nessie-errors.js";
import type { ResponseSchema } from "../models/responses.js";

export function summarizeIssues(issues: readonly v.BaseIssue<unknown>[]): ValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path?.map((item) => String(item.key)).join(".") ?? "",
    // Do not copy raw input values or library messages into public errors.
    message: `Expected ${issue.expected ?? issue.type}.`,
  }));
}

export function validate<T>(schema: ResponseSchema<T>, value: unknown): T {
  const result = v.safeParse(schema, value);
  if (!result.success) throw new NessieValidationError(summarizeIssues(result.issues));
  return result.output;
}

// Reject dot segments because URL resolution would change the endpoint.
export function segment(id: string): string {
  if (typeof id !== "string" || id.trim().length === 0 || id === "." || id === "..") {
    throw new NessieValidationError([{ path: "id", message: "Expected a nonempty resource ID." }]);
  }
  return encodeURIComponent(id);
}
