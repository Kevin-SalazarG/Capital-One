import * as v from "valibot";
import { addressSchema, geocodeSchema } from "./address.js";
import { finiteNumberSchema, idSchema } from "./primitives.js";

// OpenAPI omits ATM; fields follow the documentation example.
export const atmSchema = v.object({
  _id: idSchema,
  name: v.string(),
  address: addressSchema,
  geocode: geocodeSchema,
  amount_left: finiteNumberSchema,
});
export const atmQuerySchema = v.union([
  v.strictObject({
    lat: v.exactOptional(v.never()),
    lng: v.exactOptional(v.never()),
    rad: v.exactOptional(v.never()),
  }),
  v.strictObject({
    lat: v.pipe(finiteNumberSchema, v.minValue(-90), v.maxValue(90)),
    lng: v.pipe(finiteNumberSchema, v.minValue(-180), v.maxValue(180)),
    rad: v.pipe(finiteNumberSchema, v.minValue(0)),
  }),
]);
export type ATM = v.InferOutput<typeof atmSchema>;
export type ATMQuery = v.InferInput<typeof atmQuerySchema>;
