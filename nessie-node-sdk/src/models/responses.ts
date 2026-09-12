import * as v from "valibot";

export type ResponseSchema<T> = v.BaseSchema<unknown, T, v.BaseIssue<unknown>>;
export const acknowledgementSchema = v.union([
  v.string(),
  v.object({ code: v.number(), message: v.string() }),
  v.undefined(),
]);
export type Acknowledgement = v.InferOutput<typeof acknowledgementSchema>;

/** Supports both current documented strings and historical objectCreated envelopes. */
export function creationSchema<T>(schema: ResponseSchema<T>) {
  return v.union([
    v.string(),
    v.object({
      code: v.number(),
      message: v.string(),
      objectCreated: v.exactOptional(schema),
    }),
  ]);
}
export type CreationResult<T> = string | { code: number; message: string; objectCreated?: T };
