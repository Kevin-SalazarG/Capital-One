import * as v from "valibot";
import { accountNumberSchema, idSchema, nonNegativeIntegerSchema } from "./primitives.js";

export const accountTypeSchema = v.picklist(["Credit Card", "Savings", "Checking"]);
export const accountCreateSchema = v.strictObject({
  type: accountTypeSchema,
  nickname: v.string(),
  rewards: nonNegativeIntegerSchema,
  balance: nonNegativeIntegerSchema,
});
export const accountUpdateSchema = v.strictObject({ nickname: v.string() });
export const accountSchema = v.object({
  _id: idSchema,
  ...accountCreateSchema.entries,
  account_number: accountNumberSchema,
  customer_id: v.string(),
});
export const accountQuerySchema = v.strictObject({ type: v.exactOptional(accountTypeSchema) });
export type Account = v.InferOutput<typeof accountSchema>;
export type AccountType = v.InferOutput<typeof accountTypeSchema>;
export type AccountCreate = v.InferInput<typeof accountCreateSchema>;
export type AccountUpdate = v.InferInput<typeof accountUpdateSchema>;
export type AccountQuery = v.InferInput<typeof accountQuerySchema>;
