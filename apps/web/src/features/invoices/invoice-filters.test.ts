import { describe, expect, it } from "vitest";
import { z } from "zod";
import { DEMO_DATA } from "@/demo/fixtures";
import { invoiceSchema } from "@/lib/api/contracts";
import { filterInvoices } from "@/features/invoices/invoice-filters";

const invoices = z.array(invoiceSchema).parse(DEMO_DATA.invoices);
describe("invoice filtering", () => {
  it("combines direction and status", () => {
    const result = filterInvoices(invoices, {
      direction: "receivable",
      status: "pending",
    });
    expect(result).toHaveLength(3);
    expect(
      result.every(
        (item) =>
          item.direction === "receivable" && item.paymentStatus === "pending",
      ),
    ).toBe(true);
  });
  it("searches counterparties and identifiers, ignoring case", () => {
    expect(filterInvoices(invoices, { search: "CASA ROBLE" })).toHaveLength(1);
    expect(filterInvoices(invoices, { search: "CFDI-ENCINO-i-5" })[0]?.id).toBe(
      "i-5",
    );
  });
  it("sorts without mutating query cache", () => {
    const original = invoices.map((item) => item.id);
    const result = filterInvoices(invoices, {});
    expect(result[0]?.dueOn).toBe("2026-09-16");
    expect(invoices.map((item) => item.id)).toEqual(original);
  });
  it("puts invoices without due dates last", () => {
    expect(
      filterInvoices(
        [
          {
            ...invoices[0],
            id: "no-date",
            dueOn: null,
          } as (typeof invoices)[number],
          ...invoices,
        ],
        {},
      ).at(-1)?.id,
    ).toBe("no-date");
  });
  it("returns an honest empty state", () => {
    expect(filterInvoices(invoices, { search: "no-match" })).toEqual([]);
  });
});
