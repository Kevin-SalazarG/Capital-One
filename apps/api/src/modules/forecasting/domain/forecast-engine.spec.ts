import Decimal from "decimal.js";

import { ForecastEngine } from "./forecast-engine";
import type { ForecastInput } from "./forecast.types";

describe("ForecastEngine", () => {
  it("creates daily points and identifies the first safety gap", () => {
    const input: ForecastInput = {
      asOf: "2026-09-12",
      horizonDays: 3,
      currentBalance: new Decimal("1000"),
      minimumCashReserve: new Decimal("950"),
      averageMonthlyOutflow: new Decimal("3000"),
      variableOutflowPerDay: new Decimal("100"),
      confidence: "high",
      events: [
        {
          id: "invoice-1",
          date: "2026-09-13",
          signedExpectedAmount: new Decimal("200"),
          sourceType: "cfdi_invoice",
          sourceId: "invoice-1",
          label: "Customer One",
          confidence: "high",
        },
      ],
    };

    const result = new ForecastEngine().calculate(input);

    expect(result.points).toHaveLength(3);
    expect(result.points[0]?.closingBalance.toFixed(2)).toBe("900.00");
    expect(result.points[1]?.closingBalance.toFixed(2)).toBe("1000.00");
    expect(result.firstGap?.gapDate).toBe("2026-09-12");
    expect(result.firstGap?.amount.toFixed(2)).toBe("50.00");
    expect(result.recommendation?.type).toBe("collect_receivable");
  });

  it("does not create a gap when the projected balance stays above the threshold", () => {
    const input: ForecastInput = {
      asOf: "2026-09-12",
      horizonDays: 2,
      currentBalance: new Decimal("10000"),
      minimumCashReserve: new Decimal("500"),
      averageMonthlyOutflow: new Decimal("3000"),
      variableOutflowPerDay: new Decimal("10"),
      confidence: "medium",
      events: [],
    };

    const result = new ForecastEngine().calculate(input);

    expect(result.firstGap).toBeNull();
    expect(result.recommendation).toBeNull();
  });
});
