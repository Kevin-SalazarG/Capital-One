import * as v from "valibot";
import { idSchema, integerSchema } from "./primitives.js";

export const loanCreateSchema = v.strictObject({
  type: v.string(),
  status: v.string(),
  credit_score: integerSchema,
  monthly_payment: integerSchema,
  amount: integerSchema,
  description: v.string(),
});
export const loanUpdateSchema = v.partial(loanCreateSchema);
export const loanSchema = v.object({
  _id: idSchema,
  creation_date: v.string(),
  ...loanCreateSchema.entries,
});
export type Loan = v.InferOutput<typeof loanSchema>;
export type LoanCreate = v.InferInput<typeof loanCreateSchema>;
export type LoanUpdate = v.InferInput<typeof loanUpdateSchema>;
