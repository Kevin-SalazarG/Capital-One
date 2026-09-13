import { describe, expect, it } from "vitest";
import { z } from "zod";
import { DEMO_DATA } from "@/demo/fixtures";
import {
  annualHistorySchema,
  treasurySchema,
} from "@colchon/treasury/treasury-contract";
import {
  accountSchema,
  connectionSchema,
  invoiceSchema,
  obligationSchema,
  transactionSchema,
} from "@/lib/api/contracts";

describe("demo contracts", () => {
  it("validates all serialized treasury scenarios", () => {
    for (const [key, value] of Object.entries(DEMO_DATA))
      if (key === "treasury" || key.startsWith("treasury?"))
        expect(treasurySchema.safeParse(value).success).toBe(true);
  });
  it("validates the annual history fixture", () => {
    expect(
      annualHistorySchema.safeParse(DEMO_DATA["treasury-history"]).success,
    ).toBe(true);
  });
  it("validates every operational fixture", () => {
    expect(
      z.array(accountSchema).parse(DEMO_DATA["bank/accounts"]),
    ).toHaveLength(1);
    expect(
      z.array(transactionSchema).parse(DEMO_DATA["bank/transactions"]),
    ).toHaveLength(5);
    expect(z.array(invoiceSchema).parse(DEMO_DATA.invoices)).toHaveLength(5);
    expect(z.array(connectionSchema).parse(DEMO_DATA.connections)).toHaveLength(
      2,
    );
    expect(z.array(obligationSchema).parse(DEMO_DATA.obligations)).toHaveLength(
      3,
    );
  });
});
