import * as v from "valibot";
import { addCalendarDays } from "./calendar-date.js";
import { calculateForecast } from "./forecast-engine.js";
import { type ForecastInput, type ForecastResult, forecastInputSchema } from "./forecast-schema.js";
import { deriveJobEvents } from "./job-events.js";
import {
  type JobAlternative,
  type JobEvaluationResult,
  type JobInput,
  type JobSelection,
  type PendingCondition,
  jobEvaluationResultSchema,
  jobInputSchema,
} from "./job-schema.js";
import { money, nonnegative, requiredMoney, serializeMoney } from "./money.js";

function getConditions(job: JobInput, selection: JobSelection): PendingCondition[] {
  if (selection.kind === "advance" && money(selection.amount).gt("0"))
    return [
      {
        id: `${job.id}:customer-advance`,
        kind: "customer_advance",
        description: `Receive ${serializeMoney(money(selection.amount))} MXN on ${selection.date}; the final collection decreases by the same amount.`,
        status: "pending",
        eventId: `${job.id}:advance`,
      },
    ];
  if (selection.kind === "supplier")
    return [
      {
        id: `${job.id}:supplier-agreement`,
        kind: "supplier_agreement",
        description:
          "Obtain the supplier's agreement to the selected installment schedule and disclosed fees.",
        status: "pending",
        eventId: `${job.id}:deferred:${selection.optionId}`,
      },
      {
        id: `${job.id}:delivery`,
        kind: "delivery",
        description:
          "Confirm that the required delivery remains available under the installment agreement.",
        status: "pending",
        eventId: null,
      },
    ];
  return [];
}

function buildAlternative(
  input: ForecastInput,
  job: JobInput,
  selection: JobSelection,
  id: string,
  extraReasons: JobAlternative["reasons"] = [],
): JobAlternative {
  const events = deriveJobEvents(job, selection);
  const forecast = calculateForecast({ ...input, events: [...input.events, ...events] });
  let totalIncome = money("0");
  let totalCost = money("0");
  for (const event of events) {
    if (event.direction === "inflow") totalIncome = totalIncome.plus(event.amount);
    else totalCost = totalCost.plus(event.amount);
  }
  const reasons = [...extraReasons];
  const option =
    selection.kind === "supplier"
      ? job.supplierOptions.find((item) => item.id === selection.optionId)
      : undefined;
  if (option !== undefined && !option.deliveryMaintained) reasons.push("delivery_not_maintained");
  const outsideHorizon = events.some(
    (event) =>
      event.date > forecast.horizonEnd ||
      (event.direction === "inflow" &&
        addCalendarDays(event.date, input.collectionDelayDays) > forecast.horizonEnd),
  );
  if (outsideHorizon) reasons.push("outside_horizon");
  if (forecast.availability === "insufficient_information") reasons.push("missing_information");
  else if (forecast.financialStatus !== "protected") reasons.push("insufficient_capacity");
  const feasibility =
    forecast.availability === "insufficient_information"
      ? "insufficient_information"
      : reasons.some((reason) => reason !== "outside_horizon")
        ? "infeasible"
        : outsideHorizon
          ? "horizon_limited"
          : "feasible";
  return {
    id,
    selection,
    forecast,
    feasibility,
    reasons: [...new Set(reasons)],
    pendingConditions: getConditions(job, selection),
    knownFees: serializeMoney(money(option?.feeAmount ?? "0")),
    totalJobIncome: serializeMoney(totalIncome),
    totalJobCost: serializeMoney(totalCost),
  };
}

function findMinimumAdvance(
  input: ForecastInput,
  job: JobInput,
  originalForecast: ForecastResult,
  date: string,
  maximumAmount: string,
): JobAlternative {
  const id = `advance:${date}`;
  const maximum = buildAlternative(
    input,
    job,
    { kind: "advance", amount: maximumAmount, date },
    id,
    date <= input.cutoffDate ? ["late_advance"] : [],
  );
  if (maximum.forecast.availability === "insufficient_information" || date <= input.cutoffDate)
    return maximum;
  if (maximum.forecast.financialStatus !== "protected") {
    const reasons: JobAlternative["reasons"] = [...maximum.reasons, "advance_limit"];
    return { ...maximum, reasons: [...new Set(reasons)] };
  }
  let required = money("0");
  if (originalForecast.availability === "ready") {
    for (const scenario of originalForecast.scenarios) {
      const advanceDate = addCalendarDays(date, scenario.delayDays);
      const collectionDate = addCalendarDays(job.collectionDate, scenario.delayDays);
      for (const day of scenario.daily) {
        // An advance raises the debit-before-credit minimum only after its receipt day,
        // and until the final receipt day, when the remaining collection is reduced equally.
        if (day.date > advanceDate && day.date <= collectionDate) {
          const deficit = nonnegative(money(input.cushion).minus(day.minimumBalance));
          if (deficit.gt(required)) required = deficit;
        }
      }
    }
  }
  const candidate = buildAlternative(
    input,
    job,
    { kind: "advance", amount: requiredMoney(required), date },
    id,
  );
  if (
    candidate.forecast.availability !== "ready" ||
    candidate.forecast.financialStatus !== "protected"
  ) {
    throw new Error("The minimum-advance verification failed");
  }
  return candidate;
}

/** Searches only the supplied dates and finite supplier schedules; unrelated obligations never move. */
export function evaluateJob(
  candidateInput: ForecastInput,
  candidateJob: JobInput,
): JobEvaluationResult {
  const input = v.parse(forecastInputSchema, candidateInput);
  const job = v.parse(jobInputSchema, candidateJob);
  if (
    job.collectionDate <= input.cutoffDate ||
    job.costs.some((cost) => cost.date <= input.cutoffDate)
  ) {
    throw new Error("A proposed job must use future collection and cost dates");
  }
  const baseline = calculateForecast(input);
  const original = buildAlternative(input, job, { kind: "original" }, "original");
  const alternatives: JobAlternative[] = [];
  if (job.advance !== null) {
    for (const date of [...job.advance.allowedDates].sort()) {
      alternatives.push(
        findMinimumAdvance(input, job, original.forecast, date, job.advance.maximumAmount),
      );
    }
  }
  for (const option of [...job.supplierOptions].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  )) {
    alternatives.push(
      buildAlternative(
        input,
        job,
        { kind: "supplier", optionId: option.id },
        `supplier:${option.id}`,
      ),
    );
  }
  return v.parse(jobEvaluationResultSchema, {
    jobId: job.id,
    baseline,
    original,
    alternatives,
    searchStatus:
      baseline.availability === "insufficient_information"
        ? "insufficient_information"
        : alternatives.some((alternative) => alternative.feasibility === "feasible")
          ? "feasible_alternative"
          : "no_feasible_alternative",
    searchScope:
      "Minimum cent-denominated customer advance per permitted date and each supplied supplier schedule; all selected scenarios and the full 30-day horizon are checked.",
  });
}
