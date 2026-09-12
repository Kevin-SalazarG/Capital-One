import * as v from "valibot";

const maximumStoredLength = 1_800;
const printableAscii = /^[\x20-\x7e]+$/;
const refreshCredentialSchema = v.strictObject({
  version: v.literal(1),
  environmentId: v.pipe(v.string(), v.minLength(1), v.maxLength(512), v.regex(printableAscii)),
  refreshToken: v.pipe(v.string(), v.minLength(8), v.maxLength(1_600), v.regex(/^[\x21-\x7e]+$/)),
});

export interface RefreshCredentialStore {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  remove(): Promise<void>;
}

export interface RefreshCredential {
  readonly version: 1;
  readonly environmentId: string;
  readonly refreshToken: string;
}

export function decodeRefreshCredential(
  value: string,
  environmentId: string,
): RefreshCredential | null {
  if (value.length > maximumStoredLength) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(value);
  } catch {
    return null;
  }
  const parsed = v.safeParse(refreshCredentialSchema, payload);
  if (!parsed.success || parsed.output.environmentId !== environmentId) return null;
  return parsed.output;
}

export function encodeRefreshCredential(environmentId: string, refreshToken: string): string {
  const credential = v.parse(refreshCredentialSchema, { version: 1, environmentId, refreshToken });
  const value = JSON.stringify(credential);
  if (value.length > maximumStoredLength)
    throw new Error("Refresh credential exceeds storage limit.");
  return value;
}
