import * as v from "valibot";
import { idSchema } from "./primitives.js";
import { transactionCreateEntries, transactionUpdateEntries } from "./transactions.js";

export const withdrawalCreateSchema = v.strictObject(transactionCreateEntries);
export const withdrawalUpdateSchema = v.strictObject(transactionUpdateEntries);
export const withdrawalSchema = v.object({
  _id: idSchema,
  ...transactionCreateEntries,
  payer_id: v.exactOptional(v.string()),
});
export type Withdrawal = v.InferOutput<typeof withdrawalSchema>;
export type WithdrawalCreate = v.InferInput<typeof withdrawalCreateSchema>;
export type WithdrawalUpdate = v.InferInput<typeof withdrawalUpdateSchema>;
