import * as v from "valibot";
import { identifierSchema } from "../../platform/http/http-schemas.js";

export const loginSchema = v.strictObject({
  email: v.pipe(v.string(), v.email(), v.maxLength(254)),
  password: v.pipe(v.string(), v.minLength(8), v.maxLength(128)),
});
export const refreshSchema = v.strictObject({
  refreshToken: v.pipe(v.string(), v.minLength(8), v.maxLength(4096)),
});
export const identitySchema = v.object({
  userId: identifierSchema,
  sessionId: identifierSchema,
  expiresAt: v.number(),
});
export const sessionSchema = v.object({
  accessToken: v.string(),
  refreshToken: v.string(),
  expiresAt: v.number(),
  identity: identitySchema,
});
export type LoginInput = v.InferOutput<typeof loginSchema>;
export type RefreshInput = v.InferOutput<typeof refreshSchema>;
export type Identity = v.InferOutput<typeof identitySchema>;
export type SessionResult = v.InferOutput<typeof sessionSchema>;
