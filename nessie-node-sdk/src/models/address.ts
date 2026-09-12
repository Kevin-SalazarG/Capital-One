import * as v from "valibot";
import { finiteNumberSchema } from "./primitives.js";

export const addressSchema = v.object({
  street_number: v.string(),
  street_name: v.string(),
  city: v.string(),
  state: v.string(),
  zip: v.string(),
});
export const geocodeSchema = v.object({ lat: finiteNumberSchema, lng: finiteNumberSchema });
export type Address = v.InferOutput<typeof addressSchema>;
export type Geocode = v.InferOutput<typeof geocodeSchema>;
