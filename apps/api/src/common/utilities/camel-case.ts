function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_match, character: string) =>
    character.toUpperCase(),
  );
}

export function camelize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelize(item)) as T;
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[toCamelCase(key)] = camelize(item);
  }
  return result as T;
}
