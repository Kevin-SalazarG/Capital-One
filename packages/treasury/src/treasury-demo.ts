import type { TreasuryEvent, TreasuryInput } from "./treasury-contract";
import { addDays } from "./treasury-date";

export function createDemoInput(asOf = "2026-09-12"): TreasuryInput {
  const event = (
    id: string,
    offset: number,
    amount: string,
    label: string,
    extra: Partial<TreasuryEvent> = {},
  ): TreasuryEvent => ({
    id,
    date: addDays(asOf, offset),
    amount,
    label,
    source: "invoice",
    sourceId: id,
    category: "supplier",
    critical: false,
    earliestDate: null,
    latestDate: null,
    negotiationCost: "0.00",
    ...extra,
  });
  return {
    asOf,
    horizonDays: 30,
    currency: "MXN",
    currentBalance: "185000.00",
    reserve: "40000.00",
    dailyOperatingExpense: "1200.00",
    warnings: [
      "Ejemplo sintético. Las fechas de cobro, flexibilidad y costos son supuestos explícitos, no datos inferidos del CFDI.",
      "La proyección usa cierres diarios; no garantiza el orden intradía de cobros y pagos.",
    ],
    events: [
      event("senda", 4, "32600.00", "Estudio Senda"),
      event("materials", 6, "-46000.00", "Maderas del Norte", {
        latestDate: addDays(asOf, 19),
        negotiationCost: "500.00",
      }),
      event("tax", 8, "-28000.00", "Impuestos", {
        source: "obligation",
        category: "tax",
        critical: true,
      }),
      event("rent", 10, "-18000.00", "Renta del taller", {
        source: "obligation",
        category: "rent",
        critical: true,
      }),
      event("payroll", 13, "-118000.00", "Nómina · 12 personas", {
        source: "obligation",
        category: "payroll",
        critical: true,
      }),
      event("roble", 18, "65000.00", "Casa Roble", {
        earliestDate: addDays(asOf, 11),
        negotiationCost: "1300.00",
      }),
      event("alameda", 22, "55700.00", "Hotel Alameda", {
        earliestDate: addDays(asOf, 12),
        negotiationCost: "0.00",
      }),
      event("supplies", 24, "-12000.00", "Insumos de producción"),
    ],
  };
}
