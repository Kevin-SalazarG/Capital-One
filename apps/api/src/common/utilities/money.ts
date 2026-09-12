import Decimal from "decimal.js";

import { AppError } from "../errors/app-error";

export type DecimalInput = Decimal.Value;

export function toDecimal(value: DecimalInput, fieldName = "amount"): Decimal {
  try {
    const decimal = new Decimal(value);
    if (!decimal.isFinite()) {
      throw new Error("Value is not finite");
    }
    return decimal;
  } catch (error) {
    throw new AppError(`Invalid decimal value for ${fieldName}`, {
      code: "VALIDATION_FAILED",
      status: 400,
      details: { fieldName },
      cause: error,
    });
  }
}

export function money(value: DecimalInput): string {
  return toDecimal(value).toFixed(2);
}

export function sumDecimals(values: readonly DecimalInput[]): Decimal {
  let total = new Decimal(0);
  for (const value of values) {
    total = total.plus(toDecimal(value));
  }
  return total;
}
