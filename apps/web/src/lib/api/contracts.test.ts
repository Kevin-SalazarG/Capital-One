import { describe, expect, it } from "vitest";
import { z } from "zod";
import { DEMO_DATA, DEMO_DASHBOARD } from "@/demo/fixtures";
import {
  accountSchema,
  connectionSchema,
  dashboardSchema,
  invoiceSchema,
  memberSchema,
  obligationSchema,
  transactionSchema,
} from "@/lib/api/contracts";

describe("demo contracts", () => {
  it("validates dashboard data with and without a gap", () => {
    expect(dashboardSchema.safeParse(DEMO_DASHBOARD).success).toBe(true);
    expect(
      dashboardSchema.safeParse({
        ...DEMO_DASHBOARD,
        gap: null,
        recommendation: null,
      }).success,
    ).toBe(true);
  });
  it("validates every operational fixture", () => {
    expect(
      z.array(accountSchema).parse(DEMO_DATA["bank/accounts"]),
    ).toHaveLength(1);
    expect(
      z.array(transactionSchema).parse(DEMO_DATA["bank/transactions"]),
    ).toHaveLength(5);
    expect(z.array(invoiceSchema).parse(DEMO_DATA.invoices)).toHaveLength(8);
    expect(z.array(connectionSchema).parse(DEMO_DATA.connections)).toHaveLength(
      2,
    );
    expect(z.array(memberSchema).parse(DEMO_DATA.members)).toHaveLength(1);
    expect(z.array(obligationSchema).parse(DEMO_DATA.obligations)).toHaveLength(
      1,
    );
  });
});
