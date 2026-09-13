import { planningMetadata } from "./planning-metadata.mapper";

describe("Planning metadata boundary", () => {
  it("never invents flexibility for historical metadata", () => {
    expect(planningMetadata({ legacy: true })).toEqual({
      category: "other",
      critical: false,
      earliestDate: null,
      latestDate: null,
      negotiationCost: "0.00",
    });
  });
  it("retains payroll protection when unrelated metadata is malformed", () => {
    const result = planningMetadata({
      category: "payroll",
      critical: true,
      negotiationCost: "not-money",
      latestDate: "invalid",
    });
    expect(result.category).toBe("payroll");
    expect(result.critical).toBe(true);
    expect(result.latestDate).toBeNull();
  });
});
