import * as v from "valibot";
import { addressSchema } from "./address.js";
import { idSchema } from "./primitives.js";

export const branchSchema = v.object({
  _id: idSchema,
  name: v.string(),
  phone_number: v.string(),
  hours: v.array(v.string()),
  notes: v.array(v.string()),
  address: addressSchema,
});
export type Branch = v.InferOutput<typeof branchSchema>;
