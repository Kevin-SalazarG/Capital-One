import { occurrenceAt } from "./recurring-calendar";

describe("Recurring payment calendar", () => {
  it("anchors month end instead of drifting after February", () => {
    expect(occurrenceAt("2026-01-31", "monthly", 1)).toBe("2026-02-28");
    expect(occurrenceAt("2026-01-31", "monthly", 2)).toBe("2026-03-31");
  });
  it("supports leap years and exact 14-day periods", () => {
    expect(occurrenceAt("2028-01-31", "monthly", 1)).toBe("2028-02-29");
    expect(occurrenceAt("2026-09-25", "biweekly", 1)).toBe("2026-10-09");
    expect(occurrenceAt("2026-12-25", "weekly", 1)).toBe("2027-01-01");
  });
  it("retains the original anchor for yearly and quarterly payments", () => {
    expect(occurrenceAt("2024-02-29", "yearly", 1)).toBe("2025-02-28");
    expect(occurrenceAt("2024-02-29", "yearly", 4)).toBe("2028-02-29");
    expect(occurrenceAt("2026-01-31", "quarterly", 1)).toBe("2026-04-30");
  });
});
