const MILLISECONDS_PER_DAY = 86_400_000;

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > "9998-12-31") {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** UTC arithmetic carries calendar labels; it does not reinterpret a business due date as an instant. */
export function addCalendarDays(value: string, days: number): string {
  if (!isCalendarDate(value) || !Number.isInteger(days) || Math.abs(days) > 366) {
    throw new Error("Invalid calendar arithmetic");
  }
  const timestamp = Date.parse(`${value}T00:00:00.000Z`) + days * MILLISECONDS_PER_DAY;
  return new Date(timestamp).toISOString().slice(0, 10);
}
