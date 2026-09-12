import * as v from "valibot";
import { idSchema, integerSchema } from "./primitives.js";

export const depositCreateSchema = v.strictObject({
  medium: v.string(),
  transaction_date: v.string(),
  status: v.string(),
  amount: integerSchema,
  description: v.string(),
});
export const depositUpdateSchema = v.partial(depositCreateSchema);
export const depositSchema = v.object({ _id: idSchema, ...depositCreateSchema.entries });
export type Deposit = v.InferOutput<typeof depositSchema>;
export type DepositCreate = v.InferInput<typeof depositCreateSchema>;
export type DepositUpdate = v.InferInput<typeof depositUpdateSchema>;
