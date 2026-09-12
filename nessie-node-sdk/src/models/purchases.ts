import * as v from "valibot";
import { finiteNumberSchema, idSchema } from "./primitives.js";
import { transactionUpdateEntries } from "./transactions.js";

export const purchaseCreateSchema = v.strictObject({
  merchant_id: v.string(),
  medium: v.string(),
  amount: finiteNumberSchema,
  purchase_date: v.exactOptional(v.string()),
  status: v.exactOptional(v.string()),
  description: v.exactOptional(v.string()),
});
// JavaScript documents merchant_id; Go documents payer_id.
export const purchaseUpdateSchema = v.strictObject({
  ...transactionUpdateEntries,
  merchant_id: v.exactOptional(v.string()),
  payer_id: v.exactOptional(v.string()),
  purchase_date: v.exactOptional(v.string()),
  status: v.exactOptional(v.string()),
});
export const purchaseSchema = v.object({
  _id: idSchema,
  ...purchaseCreateSchema.entries,
  transaction_date: v.exactOptional(v.string()),
  payer_id: v.exactOptional(v.string()),
});
export type Purchase = v.InferOutput<typeof purchaseSchema>;
export type PurchaseCreate = v.InferInput<typeof purchaseCreateSchema>;
export type PurchaseUpdate = v.InferInput<typeof purchaseUpdateSchema>;
