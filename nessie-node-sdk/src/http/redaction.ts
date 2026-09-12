export function redact(value: unknown, secret: string): unknown {
  if (typeof value === "string") {
    return [
      secret,
      encodeURIComponent(secret),
      new URLSearchParams({ key: secret }).get("key") ?? secret,
      new URLSearchParams({ key: secret }).toString().slice(4),
    ].reduce((text, token) => text.split(token).join("[REDACTED]"), value);
  }
  if (Array.isArray(value)) {
    const items: unknown[] = value;
    return items.map((item) => redact(item, secret));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]: [string, unknown]) => [
        String(redact(key, secret)),
        /^(key|api[-_]?key|authorization|token)$/i.test(key) ? "[REDACTED]" : redact(item, secret),
      ]),
    );
  }
  return value;
}
