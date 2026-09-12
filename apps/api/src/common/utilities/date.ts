import { AppError } from "../errors/app-error";

export function toIsoDate(value: string | Date, fieldName = "date"): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${fieldName}`, {
      code: "VALIDATION_FAILED",
      status: 400,
      details: { fieldName },
    });
  }
  return date.toISOString().slice(0, 10);
}

export function toIsoTimestamp(
  value: string | Date,
  fieldName = "date",
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${fieldName}`, {
      code: "VALIDATION_FAILED",
      status: 400,
      details: { fieldName },
    });
  }
  return date.toISOString();
}

export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string): number {
  const startTime = new Date(
    `${toIsoDate(start, "start date")}T00:00:00.000Z`,
  ).getTime();
  const endTime = new Date(
    `${toIsoDate(end, "end date")}T00:00:00.000Z`,
  ).getTime();
  return Math.round((endTime - startTime) / 86_400_000);
}
