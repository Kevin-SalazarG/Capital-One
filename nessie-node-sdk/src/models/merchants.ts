import * as v from "valibot";
import { addressSchema, geocodeSchema } from "./address.js";
import { idSchema } from "./primitives.js";

export const merchantCreateSchema = v.strictObject({
  name: v.string(),
  category: v.exactOptional(v.string()),
  address: v.exactOptional(addressSchema),
  geocode: v.exactOptional(geocodeSchema),
});
export const merchantUpdateSchema = v.partial(merchantCreateSchema);
export const merchantSchema = v.object({
  _id: idSchema,
  ...merchantCreateSchema.entries,
  // The OpenAPI declares a string; the current documentation example uses a string array.
  category: v.exactOptional(v.union([v.string(), v.array(v.string())])),
});
export type Merchant = v.InferOutput<typeof merchantSchema>;
export type MerchantCreate = v.InferInput<typeof merchantCreateSchema>;
export type MerchantUpdate = v.InferInput<typeof merchantUpdateSchema>;
