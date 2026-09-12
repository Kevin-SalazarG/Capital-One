import { describe, expect, it } from "vitest";
import {
  amountInput,
  cfdiImportSchema,
  companyFormSchema,
  companyPayload,
  connectionFormSchema,
  memberFormSchema,
  obligationFormSchema,
} from "@/lib/form-schemas";

const company = {
  name: "Mi empresa",
  legalName: "",
  rfc: "",
  currency: "MXN",
  timeZone: "America/Monterrey",
  minimumCashReserve: "0.00",
};
describe("company and money inputs", () => {
  it("keeps amounts as decimal strings", () => {
    expect(
      companyFormSchema.parse({
        ...company,
        minimumCashReserve: "9007199254740993.25",
      }).minimumCashReserve,
    ).toBe("9007199254740993.25");
  });
  it.each(["-2", "1e8", "NaN", "3.141", "1,500", "", "Infinity"])(
    "rejects invalid amount %s",
    (value) => {
      expect(amountInput.safeParse(value).success).toBe(false);
    },
  );
  it("does not submit an empty RFC", () => {
    expect(
      JSON.parse(JSON.stringify(companyPayload(company))),
    ).not.toHaveProperty("rfc");
  });
  it("accepts optional fiscal data and a valid timezone", () => {
    expect(companyFormSchema.safeParse(company).success).toBe(true);
  });
  it("rejects invalid fiscal data and timezones", () => {
    expect(
      companyFormSchema.safeParse({
        ...company,
        rfc: "INVALID",
        timeZone: "Moon/Base",
      }).success,
    ).toBe(false);
  });
});
describe("administration inputs", () => {
  it("requires a Nessie customer ID without asking for secrets", () => {
    expect(
      connectionFormSchema.safeParse({
        kind: "bank",
        displayName: "Banco",
        externalCustomerId: "",
      }).success,
    ).toBe(false);
    expect(
      connectionFormSchema.safeParse({
        kind: "cfdi",
        displayName: "Facturas",
        externalCustomerId: "",
      }).success,
    ).toBe(true);
  });
  it.each(["owner", "operator", "superadmin"])(
    "never offers unsupported invitation role %s",
    (role) => {
      expect(
        memberFormSchema.safeParse({ email: "person@example.com", role })
          .success,
      ).toBe(false);
    },
  );
  it.each(["admin", "analyst", "viewer"])(
    "accepts supported role %s",
    (role) => {
      expect(
        memberFormSchema.safeParse({ email: "person@example.com", role })
          .success,
      ).toBe(true);
    },
  );
  it("requires a real calendar date", () => {
    expect(
      obligationFormSchema.safeParse({
        name: "Renta",
        amount: "1000.00",
        frequency: "monthly",
        nextDueOn: "2026-02-30",
      }).success,
    ).toBe(false);
  });
});
describe("CFDI import boundary", () => {
  const document = {
    cfdiUuid: "EXAMPLE-INVOICE-001",
    direction: "receivable",
    issuerRfc: "AAA010101AAA",
    receiverRfc: "BBB010101BBB",
    issuedAt: "2026-09-12T12:00:00Z",
    dueOn: "2026-09-30",
    totalAmount: "1500.00",
    outstandingAmount: "500.00",
    currency: "USD",
    paymentStatus: "partial",
  };
  it("accepts the API contract and preserves currency and money", () => {
    const parsed = cfdiImportSchema.parse({
      sourceName: "fixture",
      documents: [document],
    });
    expect(parsed.documents[0]?.outstandingAmount).toBe("500.00");
    expect(parsed.documents[0]?.currency).toBe("USD");
  });
  it("rejects empty imports", () => {
    expect(
      cfdiImportSchema.safeParse({ sourceName: "fixture", documents: [] })
        .success,
    ).toBe(false);
  });
  it("rejects numeric money and unknown fields", () => {
    expect(
      cfdiImportSchema.safeParse({
        sourceName: "fixture",
        documents: [{ ...document, totalAmount: 1500, secret: "not-accepted" }],
      }).success,
    ).toBe(false);
  });
});
