import { arch, cpus, platform, release } from "node:os";
import { performance } from "node:perf_hooks";
import { addCalendarDays } from "../src/modules/planning/domain/calendar-date.js";
import { evaluateJob } from "../src/modules/planning/domain/evaluate-job.js";
import { calculateForecast } from "../src/modules/planning/domain/forecast-engine.js";
import type { ForecastInput } from "../src/modules/planning/domain/forecast-schema.js";
import type { JobInput } from "../src/modules/planning/domain/job-schema.js";
import { money } from "../src/modules/planning/domain/money.js";

interface BenchmarkCase {
  readonly name: string;
  readonly input: ForecastInput;
  readonly job: JobInput;
  readonly samples: number;
}

function buildCase(
  name: string,
  existingEvents: number,
  costCount: number,
  optionCount: number,
  largeAmounts: boolean,
): BenchmarkCase {
  const input: ForecastInput = {
    currency: "MXN",
    timezone: "America/Monterrey",
    cutoffDate: "2026-08-31",
    capacityDate: "2026-08-31",
    openingBalance: largeAmounts ? "999999999999.99" : "50000.00",
    cushion: "10000.00",
    collectionDelayDays: 1,
    sourceFreshness: "current",
    missingInformation: [],
    events: Array.from({ length: existingEvents }, (_, index) => ({
      id: `existing-${index}`,
      label: `Synthetic obligation ${index}`,
      date: "2026-09-18",
      amount: largeAmounts ? "1000000.01" : "750.00",
      direction: "outflow",
      status: "expected",
      category: "payroll",
      negotiable: false,
    })),
  };
  const job: JobInput = {
    id: "benchmark-job",
    label: "Synthetic benchmark contract",
    totalCollection: largeAmounts ? "999999999999.99" : "60000.00",
    collectionDate: "2026-09-30",
    costs: Array.from({ length: costCount }, (_, index) => ({
      id: `cost-${index}`,
      label: `Synthetic cost ${index}`,
      date: "2026-09-10",
      amount: largeAmounts
        ? "1000000.01"
        : money("40000").dividedBy(costCount.toString()).toFixed(2),
      category: "supplies",
      negotiable: true,
    })),
    advance: {
      maximumAmount: largeAmounts ? "999999999999.99" : "60000.00",
      allowedDates: Array.from({ length: optionCount }, (_, index) =>
        addCalendarDays(optionCount === 32 ? "2026-08-29" : "2026-09-01", index),
      ),
    },
    supplierOptions: Array.from({ length: optionCount }, (_, index) => ({
      id: `option-${index}`,
      costId: "cost-0",
      initialAmount: "1.00",
      deferredDate: "2026-09-29",
      feeAmount: "0.01",
      deliveryMaintained: true,
    })),
  };
  return { name, input, job, samples: largeAmounts ? 20 : 50 };
}

function measure(
  operation: () => void,
  samples: number,
): { readonly p50Ms: string; readonly p95Ms: string; readonly maximumMs: string } {
  for (let warmup = 0; warmup < 5; warmup += 1) operation();
  const durations: number[] = [];
  for (let sample = 0; sample < samples; sample += 1) {
    const start = performance.now();
    operation();
    durations.push(performance.now() - start);
  }
  durations.sort((left, right) => left - right);
  const at = (quantile: number): string =>
    (durations[Math.ceil(samples * quantile) - 1] ?? 0).toFixed(3);
  return { p50Ms: at(0.5), p95Ms: at(0.95), maximumMs: at(1) };
}

const cases = [
  buildCase("normal", 40, 10, 10, false),
  buildCase("bounded-maximum", 397, 100, 32, true),
];
const results = cases.map((item) => ({
  name: item.name,
  existingEvents: item.input.events.length,
  jobCosts: item.job.costs.length,
  advanceDates: item.job.advance?.allowedDates.length ?? 0,
  supplierSchedules: item.job.supplierOptions.length,
  maximumDerivedEvents: item.input.events.length + item.job.costs.length + 3,
  samples: item.samples,
  forecast: measure(() => {
    calculateForecast(item.input);
  }, item.samples),
  evaluation: measure(() => {
    evaluateJob(item.input, item.job);
  }, item.samples),
}));
console.log(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: platform(),
        release: release(),
        architecture: arch(),
        cpu: cpus()[0]?.model ?? "unavailable",
      },
      results,
    },
    null,
    2,
  ),
);
