import { createHash } from "node:crypto";

import type { JsonValue } from "../types/json-value";

function stableSerialize(value: JsonValue): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value: JsonValue): string {
  return createHash("sha256")
    .update(stableSerialize(value), "utf8")
    .digest("hex");
}
