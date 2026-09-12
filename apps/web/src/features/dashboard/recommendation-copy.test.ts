import { describe, expect, it } from "vitest";
import { DEMO_DASHBOARD } from "@/demo/fixtures";
import { recommendationTitle } from "@/features/dashboard/recommendation-copy";

describe("recommendation labels", () => {
  it.each([
    ["Collect Casa Roble before 2026-09-23", "Anticipa el cobro de Casa Roble"],
    [
      "Collect from Casa Roble before 2026-09-23",
      "Anticipa el cobro de Casa Roble",
    ],
    [
      "Schedule Proveedor after 2026-09-23",
      "Revisa el plazo de pago a Proveedor",
    ],
    [
      "Increase the cash buffer before 2026-09-23",
      "Refuerza tu reserva de efectivo",
    ],
    ["Ya está en español", "Ya está en español"],
  ])(
    "translates %s without recalculating recommendations",
    (title, expected) => {
      if (!DEMO_DASHBOARD.recommendation)
        throw new Error("Missing recommendation fixture");
      expect(
        recommendationTitle({ ...DEMO_DASHBOARD.recommendation, title }),
      ).toBe(expected);
    },
  );
});
