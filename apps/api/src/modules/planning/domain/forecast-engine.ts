import type { Decimal } from "decimal.js";
import * as v from "valibot";
import { addCalendarDays } from "./calendar-date.js";
import {
  type CashEvent,
  type CriticalObligation,
  type DailyBalance,
  ENGINE_VERSION,
  FORECAST_DAYS,
  type FinancialMetrics,
  type ForecastInput,
  type ForecastResult,
  type ForecastScenario,
  type ForecastWarning,
  forecastInputSchema,
  forecastResultSchema,
} from "./forecast-schema.js";
import { money, nonnegative, requiredMoney, serializeMoney } from "./money.js";

interface ScheduledEvent {
  readonly event: CashEvent;
  readonly date: string;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function scheduleEvents(
  input: ForecastInput,
  delayDays: number,
  unconditional: boolean,
): ScheduledEvent[] {
  return input.events
    .filter(
      (event) =>
        event.status !== "settled" &&
        event.status !== "cancelled" &&
        (!unconditional || event.direction === "outflow") &&
        (event.direction !== "inflow" || event.date > input.cutoffDate),
    )
    .map((event) => {
      const requestedDate =
        unconditional && event.conservativeDate !== undefined ? event.conservativeDate : event.date;
      const date =
        requestedDate <= input.cutoffDate
          ? addCalendarDays(input.cutoffDate, 1)
          : event.direction === "inflow"
            ? addCalendarDays(requestedDate, delayDays)
            : requestedDate;
      return { event, date };
    })
    .sort(
      (left, right) =>
        compareText(left.date, right.date) || compareText(left.event.id, right.event.id),
    );
}

function warningFor(code: ForecastWarning["code"], events: readonly CashEvent[]): ForecastWarning {
  const sorted = [...events].sort((left, right) => compareText(left.id, right.id));
  return {
    code,
    eventIds: sorted.map((event) => event.id),
    dates: sorted.map((event) => event.date),
  };
}

function getWarnings(input: ForecastInput, horizonEnd: string): ForecastWarning[] {
  const warnings: ForecastWarning[] = [
    { code: "horizon_limit", eventIds: [], dates: [horizonEnd] },
  ];
  const active = input.events.filter(
    (event) => event.status !== "settled" && event.status !== "cancelled",
  );
  const overduePayables = active.filter(
    (event) => event.direction === "outflow" && event.date <= input.cutoffDate,
  );
  const overdueReceivables = active.filter(
    (event) => event.direction === "inflow" && event.date <= input.cutoffDate,
  );
  const outside = active.filter(
    (event) =>
      event.date > horizonEnd ||
      (event.direction === "inflow" &&
        addCalendarDays(event.date, input.collectionDelayDays) > horizonEnd),
  );
  const conditional = active.filter(
    (event) => event.direction === "inflow" || event.status === "conditional",
  );
  if (overduePayables.length > 0) warnings.push(warningFor("overdue_payable", overduePayables));
  if (overdueReceivables.length > 0)
    warnings.push(warningFor("overdue_receivable", overdueReceivables));
  if (outside.length > 0) warnings.push(warningFor("outside_horizon", outside));
  if (conditional.length > 0) warnings.push(warningFor("conditional_cash", conditional));
  if (input.sourceFreshness === "stale") warnings.push(warningFor("stale_source", []));
  if (input.sourceFreshness === "unavailable") warnings.push(warningFor("unavailable_source", []));
  return warnings;
}

function buildDaily(input: ForecastInput, scheduled: readonly ScheduledEvent[]): DailyBalance[] {
  let balance = money(input.openingBalance);
  const daily: DailyBalance[] = [];
  for (let offset = 0; offset <= FORECAST_DAYS; offset += 1) {
    const date = addCalendarDays(input.cutoffDate, offset);
    const due = scheduled.filter((item) => item.date === date);
    let inflows = money("0");
    let outflows = money("0");
    for (const item of due) {
      if (item.event.direction === "inflow") inflows = inflows.plus(item.event.amount);
      else outflows = outflows.plus(item.event.amount);
    }
    const openingBalance = balance;
    // All outgoing payments must clear before receipts on the same calendar day become available.
    const minimumBalance = balance.minus(outflows);
    balance = minimumBalance.plus(inflows);
    daily.push({
      date,
      openingBalance: serializeMoney(openingBalance),
      inflows: serializeMoney(inflows),
      outflows: serializeMoney(outflows),
      minimumBalance: serializeMoney(minimumBalance),
      closingBalance: serializeMoney(balance),
      eventIds: due.map((item) => item.event.id),
    });
  }
  return daily;
}

interface CalendarMetrics {
  readonly minimumBalance: Decimal;
  readonly minimumDate: string;
  readonly closingBalance: Decimal;
  readonly firstCriticalDate: string | null;
  readonly reserveTarget: Decimal;
  readonly reserveCoverageGap: Decimal;
  readonly availableCapacity: Decimal;
}

function measureDaily(input: ForecastInput, daily: readonly DailyBalance[]): CalendarMetrics {
  let minimumBalance = money(input.openingBalance);
  let minimumDate = input.cutoffDate;
  let closingBalance = money(input.openingBalance);
  let firstCriticalDate: string | null = minimumBalance.lt(input.cushion) ? input.cutoffDate : null;
  let capacityOpening = money(input.openingBalance);
  let futureMinimum: Decimal | null = null;
  for (const day of daily) {
    const minimum = money(day.minimumBalance);
    if (minimum.lt(minimumBalance)) {
      minimumBalance = minimum;
      minimumDate = day.date;
    }
    if (firstCriticalDate === null && minimum.lt(input.cushion)) firstCriticalDate = day.date;
    closingBalance = money(day.closingBalance);
    if (day.date === input.capacityDate) capacityOpening = money(day.openingBalance);
    if (day.date >= input.capacityDate && (futureMinimum === null || minimum.lt(futureMinimum))) {
      futureMinimum = minimum;
    }
  }
  const requiredDrawdown = nonnegative(capacityOpening.minus(futureMinimum ?? capacityOpening));
  const reserveTarget = requiredDrawdown.plus(input.cushion);
  return {
    minimumBalance,
    minimumDate,
    closingBalance,
    firstCriticalDate,
    reserveTarget,
    reserveCoverageGap: nonnegative(reserveTarget.minus(capacityOpening)),
    availableCapacity:
      firstCriticalDate === null ? nonnegative(capacityOpening.minus(reserveTarget)) : money("0"),
  };
}

function getCriticalObligations(
  scheduled: readonly ScheduledEvent[],
  throughDate: string,
): CriticalObligation[] {
  return scheduled
    .filter((item) => item.event.direction === "outflow" && item.date <= throughDate)
    .map((item) => ({
      eventId: item.event.id,
      label: item.event.label,
      date: item.date,
      amount: serializeMoney(money(item.event.amount)),
      category: item.event.category,
    }));
}

function calculateScenario(
  input: ForecastInput,
  id: ForecastScenario["id"],
  delayDays: number,
  unconditionalCapacity: Decimal,
): ForecastScenario {
  const scheduled = scheduleEvents(input, delayDays, false);
  const daily = buildDaily(input, scheduled);
  const metrics = measureDaily(input, daily);
  return {
    id,
    delayDays,
    daily,
    metrics: {
      minimumBalance: serializeMoney(metrics.minimumBalance),
      minimumDate: metrics.minimumDate,
      closingBalance: serializeMoney(metrics.closingBalance),
      operationalShortfall: requiredMoney(nonnegative(metrics.minimumBalance.negated())),
      protectionGap: requiredMoney(nonnegative(money(input.cushion).minus(metrics.minimumBalance))),
      firstCriticalDate: metrics.firstCriticalDate,
      reserveTarget: requiredMoney(metrics.reserveTarget),
      reserveCoverageGap: requiredMoney(metrics.reserveCoverageGap),
      availableCapacity: serializeMoney(metrics.availableCapacity),
      unconditionalCapacity: serializeMoney(unconditionalCapacity),
    },
    criticalObligations: getCriticalObligations(scheduled, metrics.minimumDate),
  };
}

function aggregateMetrics(base: FinancialMetrics, delayed: FinancialMetrics): FinancialMetrics {
  const worstMinimum =
    money(base.minimumBalance).lt(delayed.minimumBalance) ||
    (money(base.minimumBalance).eq(delayed.minimumBalance) &&
      base.minimumDate <= delayed.minimumDate)
      ? base
      : delayed;
  const smaller = (left: string, right: string): string => (money(left).lte(right) ? left : right);
  const larger = (left: string, right: string): string => (money(left).gte(right) ? left : right);
  const criticalDates = [base.firstCriticalDate, delayed.firstCriticalDate]
    .filter((date): date is string => date !== null)
    .sort(compareText);
  return {
    ...worstMinimum,
    closingBalance: smaller(base.closingBalance, delayed.closingBalance),
    operationalShortfall: larger(base.operationalShortfall, delayed.operationalShortfall),
    protectionGap: larger(base.protectionGap, delayed.protectionGap),
    firstCriticalDate: criticalDates[0] ?? null,
    reserveTarget: larger(base.reserveTarget, delayed.reserveTarget),
    reserveCoverageGap: larger(base.reserveCoverageGap, delayed.reserveCoverageGap),
    availableCapacity: smaller(base.availableCapacity, delayed.availableCapacity),
    unconditionalCapacity: smaller(base.unconditionalCapacity, delayed.unconditionalCapacity),
  };
}

/** Pure projection: all receipts remain expectations; unconditional capacity uses observed opening cash only. */
export function calculateForecast(candidate: ForecastInput): ForecastResult {
  const input = v.parse(forecastInputSchema, candidate);
  const horizonEnd = addCalendarDays(input.cutoffDate, FORECAST_DAYS);
  const warnings = getWarnings(input, horizonEnd);
  const metadata = {
    engineVersion: ENGINE_VERSION,
    currency: input.currency,
    timezone: input.timezone,
    cutoffDate: input.cutoffDate,
    horizonEnd,
    capacityDate: input.capacityDate,
    conditionStatus: warnings.some((warning) => warning.code === "conditional_cash")
      ? "conditional"
      : "none",
    freshness: input.sourceFreshness,
    assumptions: [
      "The cutoff is the end of the business calendar day; settled history is already included in opening cash.",
      "Outgoing payments clear before incoming receipts on the same day.",
      "Overdue unpaid obligations are due immediately on the first projected day; overdue receivables need a revised date and are excluded.",
      "Unconditional capacity excludes future receipts and preserves original due dates for pending supplier agreements.",
      `The collection-delay scenario moves all future receipts by ${input.collectionDelayDays} calendar days.`,
      "Results cover only the opening balance and next 30 days; they do not establish whole-contract viability.",
    ],
    warnings,
    missingInformation: input.missingInformation,
  };
  if (input.missingInformation.length > 0 || input.sourceFreshness === "unavailable") {
    return v.parse(forecastResultSchema, {
      ...metadata,
      availability: "insufficient_information",
      financialStatus: "not_evaluated",
      scenarios: [],
      worstCase: null,
    });
  }
  const unconditional = measureDaily(input, buildDaily(input, scheduleEvents(input, 0, true)));
  const base = calculateScenario(input, "base", 0, unconditional.availableCapacity);
  const delayed = calculateScenario(
    input,
    "collection_delay",
    input.collectionDelayDays,
    unconditional.availableCapacity,
  );
  const worstCase = aggregateMetrics(base.metrics, delayed.metrics);
  const financialStatus = money(worstCase.minimumBalance).isNegative()
    ? "operational_shortfall"
    : money(worstCase.minimumBalance).lt(input.cushion)
      ? "cushion_shortfall"
      : "protected";
  return v.parse(forecastResultSchema, {
    ...metadata,
    availability: "ready",
    financialStatus,
    scenarios: [base, delayed],
    worstCase,
  });
}
