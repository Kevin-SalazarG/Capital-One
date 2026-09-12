import * as v from "valibot";
import { idSchema } from "./primitives.js";
import { transactionCreateEntries, transactionUpdateEntries } from "./transactions.js";

export const transferCreateSchema = v.strictObject({
  ...transactionCreateEntries,
  payee_id: v.string(),
});
export const transferUpdateSchema = v.strictObject({
  ...transactionUpdateEntries,
  payee_id: v.exactOptional(v.string()),
});
export const transferSchema = v.object({
  _id: idSchema,
  ...transactionCreateEntries,
  payee_id: v.exactOptional(v.string()),
  payer_id: v.exactOptional(v.string()),
});
export const transferQuerySchema = v.strictObject({
  type: v.exactOptional(v.picklist(["payer", "payee"])),
});
export type Transfer = v.InferOutput<typeof transferSchema>;
export type TransferCreate = v.InferInput<typeof transferCreateSchema>;
export type TransferUpdate = v.InferInput<typeof transferUpdateSchema>;
export type TransferQuery = v.InferInput<typeof transferQuerySchema>;
