import type { ForecastInput } from "../../src/modules/planning/domain/forecast-schema.js";
import type { JobInput } from "../../src/modules/planning/domain/job-schema.js";

/** Synthetic reference only: the day numbers and amounts come from Idea.md section 8. */
export function referenceForecast(): ForecastInput {
  return {
    currency: "MXN",
    timezone: "America/Monterrey",
    cutoffDate: "2026-08-31",
    openingBalance: "50000.00",
    cushion: "10000.00",
    capacityDate: "2026-08-31",
    collectionDelayDays: 0,
    events: [
      {
        id: "reference-payroll",
        label: "Existing payroll",
        date: "2026-09-18",
        amount: "30000.00",
        direction: "outflow",
        status: "expected",
        category: "payroll",
        negotiable: false,
      },
    ],
    missingInformation: [],
    sourceFreshness: "current",
  };
}

export function referenceJob(): JobInput {
  return {
    id: "reference-job",
    label: "Additional office cleaning contract",
    totalCollection: "60000.00",
    collectionDate: "2026-09-28",
    costs: [
      {
        id: "reference-supplier",
        label: "Job supplies",
        amount: "40000.00",
        date: "2026-09-10",
        category: "supplies",
        negotiable: true,
      },
    ],
    advance: { maximumAmount: "60000.00", allowedDates: ["2026-09-17"] },
    supplierOptions: [
      {
        id: "reference-installments",
        costId: "reference-supplier",
        initialAmount: "10000.00",
        deferredDate: "2026-09-29",
        feeAmount: "0.00",
        deliveryMaintained: true,
      },
    ],
  };
}
