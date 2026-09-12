import * as v from "valibot";
import { addCalendarDays, isCalendarDate } from "./calendar-date.js";

export const ENGINE_VERSION = "1.0.0";
export const FORECAST_DAYS = 30;
export const MAX_FINANCIAL_EVENTS = 500;

export const moneySchema = v.pipe(
  v.string(),
  v.regex(/^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, "Use decimal money with at most two places"),
);
export const positiveMoneySchema = v.pipe(
  v.string(),
  v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, "Use nonnegative decimal money"),
);
export const resultMoneySchema = v.pipe(v.string(), v.regex(/^-?(?:0|[1-9]\d{0,15})\.\d{2}$/));
export const dateSchema = v.pipe(
  v.string(),
  v.check(isCalendarDate, "Use a valid YYYY-MM-DD date"),
);
export const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(120));
export const labelSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
export const cashEventSchema = v.strictObject({
  id: identifierSchema,
  label: labelSchema,
  date: dateSchema,
  amount: positiveMoneySchema,
  direction: v.picklist(["inflow", "outflow"]),
  status: v.picklist(["expected", "conditional", "settled", "cancelled"]),
  category: labelSchema,
  negotiable: v.boolean(),
  conservativeDate: v.optional(dateSchema),
});
export type CashEvent = v.InferOutput<typeof cashEventSchema>;

export const forecastInputSchema = v.pipe(
  v.strictObject({
    currency: v.literal("MXN"),
    timezone: v.literal("America/Monterrey"),
    cutoffDate: dateSchema,
    openingBalance: moneySchema,
    cushion: positiveMoneySchema,
    capacityDate: dateSchema,
    collectionDelayDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30)),
    events: v.pipe(v.array(cashEventSchema), v.maxLength(MAX_FINANCIAL_EVENTS)),
    missingInformation: v.pipe(v.array(labelSchema), v.maxLength(50)),
    sourceFreshness: v.picklist(["current", "stale", "unavailable"]),
  }),
  v.check(
    (input) =>
      input.capacityDate >= input.cutoffDate &&
      input.capacityDate <= addCalendarDays(input.cutoffDate, FORECAST_DAYS),
    "Capacity date must be inside the evaluated horizon",
  ),
  v.check(
    (input) => new Set(input.events.map((event) => event.id)).size === input.events.length,
    "Cash event identifiers must be unique",
  ),
  v.check(
    (input) =>
      input.events.every((event) => event.status !== "settled" || event.date <= input.cutoffDate),
    "Settled events must already be included in the cutoff balance",
  ),
  v.check(
    (input) =>
      input.events.every(
        (event) =>
          event.conservativeDate === undefined ||
          (event.direction === "outflow" && event.conservativeDate <= event.date),
      ),
    "A conservative date must preserve the earlier payable due date",
  ),
);
export type ForecastInput = v.InferOutput<typeof forecastInputSchema>;

export const forecastWarningSchema = v.strictObject({
  code: v.picklist([
    "overdue_payable",
    "overdue_receivable",
    "outside_horizon",
    "conditional_cash",
    "stale_source",
    "unavailable_source",
    "horizon_limit",
  ]),
  eventIds: v.array(identifierSchema),
  dates: v.array(dateSchema),
});
export type ForecastWarning = v.InferOutput<typeof forecastWarningSchema>;

export const financialMetricsSchema = v.strictObject({
  minimumBalance: resultMoneySchema,
  minimumDate: dateSchema,
  closingBalance: resultMoneySchema,
  operationalShortfall: resultMoneySchema,
  protectionGap: resultMoneySchema,
  firstCriticalDate: v.nullable(dateSchema),
  reserveTarget: resultMoneySchema,
  reserveCoverageGap: resultMoneySchema,
  availableCapacity: resultMoneySchema,
  unconditionalCapacity: resultMoneySchema,
});
export type FinancialMetrics = v.InferOutput<typeof financialMetricsSchema>;

export const dailyBalanceSchema = v.strictObject({
  date: dateSchema,
  openingBalance: resultMoneySchema,
  inflows: resultMoneySchema,
  outflows: resultMoneySchema,
  minimumBalance: resultMoneySchema,
  closingBalance: resultMoneySchema,
  eventIds: v.array(identifierSchema),
});
export type DailyBalance = v.InferOutput<typeof dailyBalanceSchema>;

export const criticalObligationSchema = v.strictObject({
  eventId: identifierSchema,
  label: labelSchema,
  date: dateSchema,
  amount: resultMoneySchema,
  category: labelSchema,
});
export type CriticalObligation = v.InferOutput<typeof criticalObligationSchema>;

export const forecastScenarioSchema = v.strictObject({
  id: v.picklist(["base", "collection_delay"]),
  delayDays: v.number(),
  daily: v.array(dailyBalanceSchema),
  metrics: financialMetricsSchema,
  criticalObligations: v.array(criticalObligationSchema),
});
export type ForecastScenario = v.InferOutput<typeof forecastScenarioSchema>;

const forecastMetadata = {
  engineVersion: v.literal(ENGINE_VERSION),
  currency: v.literal("MXN"),
  timezone: v.literal("America/Monterrey"),
  cutoffDate: dateSchema,
  horizonEnd: dateSchema,
  capacityDate: dateSchema,
  conditionStatus: v.picklist(["conditional", "none"]),
  freshness: v.picklist(["current", "stale", "unavailable"]),
  assumptions: v.array(v.string()),
  warnings: v.array(forecastWarningSchema),
  missingInformation: v.array(labelSchema),
};

export const forecastResultSchema = v.variant("availability", [
  v.strictObject({
    ...forecastMetadata,
    availability: v.literal("ready"),
    financialStatus: v.picklist(["protected", "cushion_shortfall", "operational_shortfall"]),
    scenarios: v.pipe(v.array(forecastScenarioSchema), v.length(2)),
    worstCase: financialMetricsSchema,
  }),
  v.strictObject({
    ...forecastMetadata,
    availability: v.literal("insufficient_information"),
    financialStatus: v.literal("not_evaluated"),
    scenarios: v.pipe(v.array(forecastScenarioSchema), v.length(0)),
    worstCase: v.null(),
  }),
]);
export type ForecastResult = v.InferOutput<typeof forecastResultSchema>;
