import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { referenceForecast, referenceJob } from "../../../../test/fixtures/financial-reference.js";
import { addCalendarDays, isCalendarDate } from "./calendar-date.js";
import { calculateForecast } from "./forecast-engine.js";
import {
  type CashEvent,
  type ForecastInput,
  forecastInputSchema,
  forecastResultSchema,
} from "./forecast-schema.js";
import { deriveJobEvents } from "./job-events.js";
import { money, requiredMoney } from "./money.js";

function event(overrides: Partial<CashEvent>): CashEvent {
  return {
    id: "test-event",
    label: "Synthetic event",
    date: "2026-09-10",
    amount: "10.00",
    direction: "outflow",
    status: "expected",
    category: "supplies",
    negotiable: false,
    ...overrides,
  };
}

describe("calculateForecast", () => {
  it("calculates the reference reserve and immediate capacity", () => {
    const result = calculateForecast(referenceForecast());
    expect(result.worstCase).toMatchObject({
      minimumBalance: "20000.00",
      reserveTarget: "40000.00",
      reserveCoverageGap: "0.00",
      availableCapacity: "10000.00",
      unconditionalCapacity: "10000.00",
    });
    expect(result.scenarios[0]?.daily).toHaveLength(31);
    expect(result.financialStatus).toBe("protected");
    expect(v.safeParse(forecastResultSchema, result).success).toBe(true);
  });

  it("finds the shortfall before the positive closing balance of a new job", () => {
    const input = referenceForecast();
    const result = calculateForecast({
      ...input,
      events: [...input.events, ...deriveJobEvents(referenceJob(), { kind: "original" })],
    });
    expect(result.worstCase).toMatchObject({
      minimumBalance: "-20000.00",
      minimumDate: "2026-09-18",
      closingBalance: "40000.00",
      operationalShortfall: "20000.00",
      protectionGap: "30000.00",
    });
    expect(result.scenarios[0]?.criticalObligations.map((item) => item.eventId)).toEqual([
      "reference-job:cost:reference-supplier",
      "reference-payroll",
    ]);
  });

  it("checks the opening cash and preserves negative balances", () => {
    const result = calculateForecast({
      ...referenceForecast(),
      openingBalance: "-0.01",
      events: [],
    });
    expect(result.worstCase).toMatchObject({
      minimumBalance: "-0.01",
      minimumDate: "2026-08-31",
      operationalShortfall: "0.01",
      protectionGap: "10000.01",
      availableCapacity: "0.00",
    });
  });

  it("does not assume same-day receipts fund earlier payments", () => {
    const result = calculateForecast({
      ...referenceForecast(),
      openingBalance: "0.00",
      cushion: "0.00",
      events: [
        event({ id: "receipt", direction: "inflow", amount: "100.00" }),
        event({ id: "payment", amount: "100.00" }),
      ],
    });
    expect(result.worstCase).toMatchObject({ minimumBalance: "-100.00", closingBalance: "0.00" });
  });

  it("measures capacity at the beginning of the requested spending day", () => {
    const input = { ...referenceForecast(), capacityDate: "2026-09-18" };
    expect(calculateForecast(input).worstCase).toMatchObject({
      reserveTarget: "40000.00",
      availableCapacity: "10000.00",
    });
    expect(calculateForecast({ ...input, capacityDate: "2026-09-19" }).worstCase).toMatchObject({
      reserveTarget: "10000.00",
      availableCapacity: "10000.00",
    });
  });

  it("excludes already settled and cancelled events without double-counting opening cash", () => {
    const input = referenceForecast();
    const result = calculateForecast({
      ...input,
      events: [
        ...input.events,
        event({
          id: "settled",
          direction: "inflow",
          status: "settled",
          date: input.cutoffDate,
          amount: "50000.00",
        }),
        event({ id: "cancelled", status: "cancelled", amount: "999.99" }),
      ],
    });
    expect(result.worstCase?.closingBalance).toBe("20000.00");
  });

  it("treats overdue payables as immediately due and excludes overdue uncollected receipts", () => {
    const result = calculateForecast({
      ...referenceForecast(),
      events: [
        event({ id: "overdue-payable", date: "2026-08-15", amount: "20000.00" }),
        event({
          id: "overdue-receivable",
          date: "2026-08-15",
          direction: "inflow",
          amount: "90000.00",
        }),
      ],
    });
    expect(result.worstCase?.closingBalance).toBe("30000.00");
    expect(result.warnings.map((warning) => warning.code)).toContain("overdue_receivable");
    expect(result.scenarios[0]?.daily[1]?.outflows).toBe("20000.00");
  });

  it("separates projected and unconditional capacity and preserves original supplier due dates", () => {
    const input: ForecastInput = {
      ...referenceForecast(),
      events: [
        event({
          id: "pending-receipt",
          direction: "inflow",
          status: "conditional",
          date: "2026-09-05",
          amount: "30000.00",
        }),
        event({
          id: "pending-extension",
          status: "conditional",
          date: "2026-09-29",
          conservativeDate: "2026-09-10",
          amount: "40000.00",
        }),
      ],
      capacityDate: "2026-09-15",
    };
    expect(calculateForecast(input).worstCase).toMatchObject({
      availableCapacity: "30000.00",
      unconditionalCapacity: "0.00",
    });
  });

  it("keeps delayed collections and horizon limitations visible", () => {
    const result = calculateForecast({
      ...referenceForecast(),
      collectionDelayDays: 3,
      events: [
        event({ id: "late-collection", date: "2026-09-29", amount: "100.00", direction: "inflow" }),
      ],
    });
    expect(result.scenarios[0]?.metrics.closingBalance).toBe("50100.00");
    expect(result.scenarios[1]?.metrics.closingBalance).toBe("50000.00");
    expect(result.warnings.find((warning) => warning.code === "outside_horizon")?.eventIds).toEqual(
      ["late-collection"],
    );
  });

  it("returns insufficient information without fabricated metrics", () => {
    const missing = calculateForecast({
      ...referenceForecast(),
      missingInformation: ["Confirm upcoming taxes"],
    });
    expect(missing).toMatchObject({
      availability: "insufficient_information",
      financialStatus: "not_evaluated",
      worstCase: null,
      scenarios: [],
    });
    expect(
      calculateForecast({ ...referenceForecast(), sourceFreshness: "unavailable" }).availability,
    ).toBe("insufficient_information");
    expect(calculateForecast({ ...referenceForecast(), sourceFreshness: "stale" }).freshness).toBe(
      "stale",
    );
  });

  it("is deterministic under reordered input and never mutates its input", () => {
    const input = referenceForecast();
    input.events.push(event({ id: "other", amount: "50.45" }));
    const before = JSON.stringify(input);
    const result = calculateForecast(input);
    expect(calculateForecast({ ...input, events: [...input.events].reverse() })).toEqual(result);
    expect(calculateForecast(input)).toEqual(result);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("retains cents at the maximum bounded event count", () => {
    const input = {
      ...referenceForecast(),
      events: Array.from({ length: 500 }, (_, index) =>
        event({ id: `event-${index}`, amount: "999999999999.99" }),
      ),
    };
    expect(calculateForecast(input).worstCase?.closingBalance).toBe("-499999999949995.00");
    expect(
      v.safeParse(forecastInputSchema, {
        ...input,
        events: [...input.events, event({ id: "excess" })],
      }).success,
    ).toBe(false);
  });

  it.each(["NaN", "Infinity", "1e3", "1.001", "1000000000000.00", "01.00", " 1.00"])(
    "rejects invalid monetary input %s",
    (amount) => {
      expect(
        v.safeParse(forecastInputSchema, { ...referenceForecast(), openingBalance: amount })
          .success,
      ).toBe(false);
    },
  );

  it("rejects duplicates, unsettled future history, incompatible currency and invalid capacity dates", () => {
    const input = referenceForecast();
    for (const invalid of [
      { ...input, events: [event({}), event({})] },
      { ...input, events: [event({ status: "settled" })] },
      { ...input, currency: "USD" },
      { ...input, capacityDate: "2026-10-01" },
      { ...input, collectionDelayDays: 31 },
    ])
      expect(v.safeParse(forecastInputSchema, invalid).success).toBe(false);
  });
});

describe("financial calendar and rounding", () => {
  it("rounds required adjustments upwards to an admitted cent", () => {
    expect(requiredMoney(money("0.001"))).toBe("0.01");
    expect(requiredMoney(money("123.45001"))).toBe("123.46");
  });
  it("handles leap days and month boundaries without timezone shifts", () => {
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(isCalendarDate("2026-02-29")).toBe(false);
    expect(isCalendarDate("2026-04-31")).toBe(false);
    expect(isCalendarDate("2026-09-12T00:00:00Z")).toBe(false);
  });
});
