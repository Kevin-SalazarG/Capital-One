import * as v from "valibot";

export interface MobileConfig {
  readonly apiUrl: string;
  readonly localDevelopment: boolean;
}

export function readMobileConfig(input: unknown, development: boolean): MobileConfig {
  const raw = v.parse(v.pipe(v.string(), v.url()), input);
  const url = new URL(raw);
  const local = ["localhost", "127.0.0.1", "[::1]", "10.0.2.2"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "") ||
    (url.protocol !== "https:" && !(development && local && url.protocol === "http:"))
  ) {
    throw new Error(
      "Set a Mirror API origin without credentials or /v1. HTTPS is required outside local development.",
    );
  }
  return { apiUrl: url.origin, localDevelopment: url.protocol === "http:" };
}
