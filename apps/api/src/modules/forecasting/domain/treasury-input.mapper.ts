import type { TreasuryInput } from "@colchon/treasury/treasury-contract";
import type { ForecastInput } from "./forecast.types";
export function treasuryInput(input: ForecastInput): TreasuryInput {
  return {
    asOf: input.asOf,
    horizonDays: input.horizonDays,
    currency: input.currency ?? "MXN",
    currentBalance: input.currentBalance.toFixed(2),
    reserve: input.minimumCashReserve.toFixed(2),
    dailyOperatingExpense: input.variableOutflowPerDay.toFixed(2),
    warnings: [...(input.warnings ?? [])],
    events: input.events.map((event) => ({
      id: event.id,
      date: event.date,
      amount: event.signedExpectedAmount.toFixed(2),
      source: event.sourceType === "cfdi_invoice" ? "invoice" : "obligation",
      sourceId: event.sourceId,
      label: event.label,
      category: event.category ?? "other",
      critical: event.critical ?? false,
      earliestDate: event.earliestDate ?? null,
      latestDate: event.latestDate ?? null,
      negotiationCost: event.negotiationCost ?? "0.00",
    })),
  };
}
