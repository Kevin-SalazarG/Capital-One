import * as v from "valibot";

// OpenAPI documents 24-character IDs; the deployed API also returns UUIDs.
export const idSchema = v.union([v.pipe(v.string(), v.length(24)), v.pipe(v.string(), v.uuid())]);
export const finiteNumberSchema = v.pipe(v.number(), v.finite());
export const integerSchema = v.pipe(v.number(), v.integer());
export const nonNegativeIntegerSchema = v.pipe(integerSchema, v.minValue(0));
export const accountNumberSchema = v.pipe(v.string(), v.length(16));
export const dayOfMonthSchema = v.pipe(integerSchema, v.minValue(1), v.maxValue(31));
