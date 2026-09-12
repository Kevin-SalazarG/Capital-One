const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatCalendarDate(value: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const year = parts?.[1];
  const month = parts?.[2];
  const day = parts?.[3];
  if (!year || !month || !day) throw new Error("Invalid calendar date");
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new Error("Invalid calendar date");
  const label = MONTHS[Number(month) - 1];
  if (!label) throw new Error("Invalid calendar month");
  return `${Number(day)} ${label} ${year}`;
}

export function formatInstant(value: string, timezone: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid timestamp");
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}
