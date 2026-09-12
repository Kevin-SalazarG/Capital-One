import * as v from "valibot";
import { finiteNumberSchema } from "./primitives.js";

export const transactionCreateEntries = {
  medium: v.string(),
  amount: finiteNumberSchema,
  transaction_date: v.exactOptional(v.string()),
  status: v.exactOptional(v.string()),
  description: v.exactOptional(v.string()),
};
export const transactionUpdateEntries = {
  medium: v.exactOptional(v.string()),
  amount: v.exactOptional(finiteNumberSchema),
  description: v.exactOptional(v.string()),
};
