import { formatMoney, formatMoneyAmount } from "./format-money";
import { formatCalendarDate } from "./format-calendar-date";

describe("exact presentation", () => {
  it("preserves cents, signs, zero and maximum decimal strings", () => {
    expect(formatMoney("999999999999.99")).toBe("$999,999,999,999.99 MXN");
    expect(formatMoney("9999999999999999.99")).toBe("$9,999,999,999,999,999.99 MXN");
    expect(formatMoney("-20000.01")).toBe("-$20,000.01 MXN");
    expect(formatMoney("0")).toBe("$0.00 MXN");
    expect(formatMoneyAmount("9999999999999999.99")).toBe("$9,999,999,999,999,999.99");
    expect(formatMoneyAmount("-20000.01")).toBe("-$20,000.01");
    expect(formatMoneyAmount("0.1")).toBe("$0.10");
    for (const value of ["", "1,00", "01", "1.001", "1e3"])
      expect(() => formatMoney(value)).toThrow();
  });
  it("retains a calendar day without converting it to the device timezone", () => {
    expect(formatCalendarDate("2026-09-12")).toBe("12 sep 2026");
    expect(formatCalendarDate("2028-02-29")).toBe("29 feb 2028");
    expect(() => formatCalendarDate("2026-02-29")).toThrow();
  });
});
