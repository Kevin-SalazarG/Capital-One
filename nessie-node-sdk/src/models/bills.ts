import * as v from "valibot";
import { dayOfMonthSchema, finiteNumberSchema, idSchema } from "./primitives.js";

export const billStatusSchema = v.picklist(["pending", "cancelled", "completed", "recurring"]);
export const billCreateSchema = v.strictObject({
  status: billStatusSchema,
  payee: v.string(),
  nickname: v.exactOptional(v.string()),
  payment_date: v.exactOptional(v.string()),
  recurring_date: v.exactOptional(dayOfMonthSchema),
  payment_amount: finiteNumberSchema,
});
export const billUpdateSchema = v.partial(billCreateSchema);
export const billSchema = v.object({
  _id: idSchema,
  status: billStatusSchema,
  payee: v.string(),
  nickname: v.string(),
  creation_date: v.string(),
  payment_date: v.string(),
  recurring_date: dayOfMonthSchema,
  upcoming_payment_date: v.string(),
  payment_amount: finiteNumberSchema,
  account_id: idSchema,
});
export type Bill = v.InferOutput<typeof billSchema>;
export type BillStatus = v.InferOutput<typeof billStatusSchema>;
export type BillCreate = v.InferInput<typeof billCreateSchema>;
export type BillUpdate = v.InferInput<typeof billUpdateSchema>;
