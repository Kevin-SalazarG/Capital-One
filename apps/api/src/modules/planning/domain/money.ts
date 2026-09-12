import { Decimal } from "decimal.js";

const FinancialDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function money(value: string): Decimal {
  return new FinancialDecimal(value);
}

export function serializeMoney(value: Decimal): string {
  return value.toFixed(2);
}

export function requiredMoney(value: Decimal): string {
  return value.toDecimalPlaces(2, Decimal.ROUND_CEIL).toFixed(2);
}

export function nonnegative(value: Decimal): Decimal {
  return value.isNegative() ? money("0") : value;
}
