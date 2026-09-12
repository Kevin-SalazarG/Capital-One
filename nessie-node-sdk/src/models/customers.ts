import * as v from "valibot";
import { addressSchema } from "./address.js";
import { idSchema } from "./primitives.js";

export const customerCreateSchema = v.strictObject({
  first_name: v.string(),
  last_name: v.string(),
  address: addressSchema,
});
export const customerUpdateSchema = v.partial(customerCreateSchema);
export const customerSchema = v.object({ _id: idSchema, ...customerCreateSchema.entries });
export type Customer = v.InferOutput<typeof customerSchema>;
export type CustomerCreate = v.InferInput<typeof customerCreateSchema>;
export type CustomerUpdate = v.InferInput<typeof customerUpdateSchema>;
