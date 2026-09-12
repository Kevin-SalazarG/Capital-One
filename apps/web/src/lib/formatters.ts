export function formatMoney(
  value: string,
  currency = "MXN",
  compact = false,
): string {
  if (compact)
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 0,
    }).format(Number(value));
  // Intl accepts decimal strings without sacrificing the precision of large balances.
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return Reflect.apply(formatter.format, formatter, [value]);
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
): string {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value,
  );
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    ...options,
  }).format(date);
}

export function formatTimestamp(
  value: string | null,
  timeZone: string,
): string {
  if (!value) return "Sin actualizar";
  return formatDate(value, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  analyst: "Analista",
  operator: "Operador",
  viewer: "Solo lectura",
};
export const PAYMENT_LABELS: Record<string, string> = {
  pending: "Pendiente",
  partial: "Pago parcial",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};
