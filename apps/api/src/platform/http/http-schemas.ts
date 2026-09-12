import * as v from "valibot";

export const identifierSchema = v.pipe(v.string(), v.uuid());
export const versionSchema = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646));
export const textSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
export const errorSchema = v.object({
  code: v.string(),
  message: v.string(),
  requestId: v.string(),
});
export const successSchema = v.object({ success: v.literal(true) });
export type SuccessResult = v.InferOutput<typeof successSchema>;
export const pageQuerySchema = v.object({
  offset: v.optional(v.pipe(v.string(), v.regex(/^\d{1,6}$/), v.transform(Number)), "0"),
  limit: v.optional(
    v.pipe(v.string(), v.regex(/^\d{1,3}$/), v.transform(Number), v.minValue(1), v.maxValue(100)),
    "50",
  ),
});
export type PageQuery = v.InferOutput<typeof pageQuerySchema>;

export function parseIdentifier(input: string): string {
  return v.parse(identifierSchema, input);
}
