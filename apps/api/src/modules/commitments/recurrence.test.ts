import { describe, expect, it } from "vitest";
import { monthlyDates } from "./commitments.service.js";

describe("finite monthly recurrence calendar", () => {
  it("clamps short months without shifting the next intended day", () => {
    expect(monthlyDates("2026-01-31", 31, 3)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });
  it("emits the requested count without dates before the start", () => {
    expect(monthlyDates("2026-01-20", 10, 3)).toEqual(["2026-02-10", "2026-03-10", "2026-04-10"]);
  });
  it("keeps leap-day labels in the business calendar", () => {
    expect(monthlyDates("2028-02-01", 31, 2)).toEqual(["2028-02-29", "2028-03-31"]);
  });
});
