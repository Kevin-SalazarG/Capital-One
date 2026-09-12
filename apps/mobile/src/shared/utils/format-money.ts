const MONEY_PATTERN = /^(-?)(0|[1-9]\d{0,15})(?:\.(\d{1,2}))?$/;

export function formatMoneyAmount(value: string): string {
  const match = MONEY_PATTERN.exec(value);
  if (!match || match[2] === undefined) throw new Error("Invalid canonical amount");
  const whole = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = (match[3] ?? "").padEnd(2, "0");
  return `${match[1]}$${whole}.${fraction}`;
}

export function formatMoney(value: string, currency: "MXN" = "MXN"): string {
  return `${formatMoneyAmount(value)} ${currency}`;
}
