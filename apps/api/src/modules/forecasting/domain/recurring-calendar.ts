import { addDays } from "@colchon/treasury/treasury-date";

/** Calendar recurrence anchored to the original day (Jan 31 → Feb 28 → Mar 31). */
export function occurrenceAt(
  start: string,
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly",
  index: number,
): string {
  if (frequency === "weekly" || frequency === "biweekly")
    return addDays(start, index * (frequency === "weekly" ? 7 : 14));
  const date = new Date(`${start}T12:00:00Z`);
  const months =
    index * (frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}
