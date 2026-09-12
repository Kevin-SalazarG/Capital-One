import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NessieClient, NessieHttpError } from "nessie-node-sdk";

import { NessieBankProvider } from "../src/modules/bank-data/infrastructure/nessie-bank.provider";

const CUSTOMER_ID = "12345678-1234-4234-8234-123456789abc";
const ACCOUNT_ID = "23456789-1234-4234-8234-123456789abc";
const DEPOSIT_ID = "34567890-1234-4234-8234-123456789abc";

function providerWithTransferResponse(status: number, body: unknown) {
  const client = new NessieClient({
    apiKey: "test-key",
    maxRetries: 0,
    fetch: async (url) => {
      if (url.pathname === `/customers/${CUSTOMER_ID}/accounts`) {
        return Response.json([
          {
            _id: ACCOUNT_ID,
            customer_id: CUSTOMER_ID,
            account_number: "1234567890123456",
            type: "Checking",
            nickname: "Test account",
            rewards: 0,
            balance: 1000,
          },
        ]);
      }
      if (url.pathname === `/accounts/${ACCOUNT_ID}/transfers`) {
        return typeof body === "string"
          ? new Response(body, { status })
          : Response.json(body, { status });
      }
      if (url.pathname === `/accounts/${ACCOUNT_ID}/deposits`) {
        return Response.json([
          {
            _id: DEPOSIT_ID,
            medium: "balance",
            amount: 125,
            transaction_date: "2026-09-01",
            status: "completed",
            description: "Test deposit",
          },
        ]);
      }
      if (
        url.pathname === `/accounts/${ACCOUNT_ID}/withdrawals` ||
        url.pathname === `/accounts/${ACCOUNT_ID}/purchases`
      ) {
        return Response.json([]);
      }
      throw new Error(`Unexpected test route: ${url.pathname}`);
    },
  });
  return new NessieBankProvider(client);
}

describe("NessieBankProvider", () => {
  it("syncs an existing account when Nessie reports an empty transfer collection as 404", async () => {
    const provider = providerWithTransferResponse(
      404,
      "No transfers found for this account",
    );

    const result = await provider.sync(CUSTOMER_ID);

    assert.equal(result.externalCustomerId, CUSTOMER_ID);
    assert.equal(result.accounts.length, 1);
    assert.equal(result.accounts[0]?.balance, "1000.00");
    assert.equal(result.transactions.length, 1);
    assert.equal(result.transactions[0]?.externalId, DEPOSIT_ID);
    assert.equal(result.transactions[0]?.direction, "inflow");
    assert.equal(result.transactions[0]?.amount, "125.00");
    assert.equal(result.transactions[0]?.currency, "USD");
    assert.equal(result.recordsRead, 2);
  });

  it("also accepts the normal empty-array transfer response", async () => {
    const result = await providerWithTransferResponse(200, []).sync(
      CUSTOMER_ID,
    );
    assert.equal(result.transactions.length, 1);
  });

  for (const scenario of [
    { status: 404, body: "Account not found" },
    { status: 401, body: "No transfers found for this account" },
    { status: 403, body: "Forbidden" },
    { status: 500, body: "No transfers found for this account" },
  ]) {
    it(`does not suppress HTTP ${scenario.status} errors with response ${scenario.body}`, async () => {
      const provider = providerWithTransferResponse(
        scenario.status,
        scenario.body,
      );
      await assert.rejects(provider.sync(CUSTOMER_ID), NessieHttpError);
    });
  }
});
