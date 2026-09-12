import * as v from "valibot";
import type { CashEvent } from "./forecast-schema.js";
import {
  type JobInput,
  type JobSelection,
  jobInputSchema,
  jobSelectionSchema,
} from "./job-schema.js";
import { money, serializeMoney } from "./money.js";

/** The same event derivation is used by evaluation and registration; no cash is created by a plan. */
export function deriveJobEvents(
  candidate: JobInput,
  candidateSelection: JobSelection,
): CashEvent[] {
  const job = v.parse(jobInputSchema, candidate);
  const selection = v.parse(jobSelectionSchema, candidateSelection);
  const events: CashEvent[] = job.costs.map((cost) => ({
    id: `${job.id}:cost:${cost.id}`,
    label: cost.label,
    date: cost.date,
    amount: serializeMoney(money(cost.amount)),
    direction: "outflow",
    status: "expected",
    category: cost.category,
    negotiable: cost.negotiable,
  }));
  let finalCollection = money(job.totalCollection);
  if (selection.kind === "advance") {
    if (
      job.advance === null ||
      !job.advance.allowedDates.includes(selection.date) ||
      money(selection.amount).gt(job.advance.maximumAmount)
    ) {
      throw new Error("The selected advance is outside the job constraints");
    }
    finalCollection = finalCollection.minus(selection.amount);
    if (money(selection.amount).gt("0"))
      events.push({
        id: `${job.id}:advance`,
        label: `${job.label} advance`,
        date: selection.date,
        amount: serializeMoney(money(selection.amount)),
        direction: "inflow",
        status: "conditional",
        category: "job_income",
        negotiable: false,
      });
  }
  if (selection.kind === "supplier") {
    const option = job.supplierOptions.find((item) => item.id === selection.optionId);
    const cost = job.costs.find((item) => item.id === option?.costId);
    const initialEvent = events.find((event) => event.id === `${job.id}:cost:${option?.costId}`);
    if (option === undefined || cost === undefined || initialEvent === undefined) {
      throw new Error("The selected supplier option does not exist");
    }
    initialEvent.amount = serializeMoney(money(option.initialAmount));
    events.push({
      id: `${job.id}:deferred:${option.id}`,
      label: `${cost.label} deferred installment`,
      date: option.deferredDate,
      conservativeDate: cost.date,
      amount: serializeMoney(money(cost.amount).minus(option.initialAmount)),
      direction: "outflow",
      status: "conditional",
      category: cost.category,
      negotiable: false,
    });
    if (money(option.feeAmount).gt("0"))
      events.push({
        id: `${job.id}:fee:${option.id}`,
        label: `${cost.label} installment fee`,
        date: cost.date,
        amount: serializeMoney(money(option.feeAmount)),
        direction: "outflow",
        status: "expected",
        category: cost.category,
        negotiable: false,
      });
  }
  if (finalCollection.gt("0"))
    events.push({
      id: `${job.id}:collection`,
      label: `${job.label} final collection`,
      date: job.collectionDate,
      amount: serializeMoney(finalCollection),
      direction: "inflow",
      status: "conditional",
      category: "job_income",
      negotiable: false,
    });
  return events;
}
