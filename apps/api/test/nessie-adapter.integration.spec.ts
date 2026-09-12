import assert from "node:assert/strict";
import test from "node:test";

import type {
  Account,
  Deposit,
  NessieClient,
  Purchase,
  Transfer,
  Withdrawal,
} from "nessie-node-sdk";

import { NessieBankProvider } from "../src/modules/bank-data/infrastructure/nessie-bank.provider";

const checkingAccount = {
  _id: "checking-account",
  type: "Checking",
  nickname: "Operating account",
  rewards: 0,
  balance: 120000,
  account_number: "1234567890123456",
  customer_id: "customer-1",
} satisfies Account;

const savingsAccount = {
  _id: "savings-account",
  type: "Savings",
  nickname: "Reserve account",
  rewards: 10,
  balance: 25000,
  account_number: "6543210987654321",
  customer_id: "customer-1",
} satisfies Account;

const deposit = {
  _id: "deposit-1",
  medium: "directDeposit",
  transaction_date: "2026-09-10T12:00:00Z",
  status: "completed",
  amount: 1000,
  description: "Customer payment",
} satisfies Deposit;

const withdrawal = {
  _id: "withdrawal-1",
  medium: "balance",
  amount: 200,
  transaction_date: "2026-09-09T12:00:00Z",
  status: "completed",
  description: "Supplier payment",
  payer_id: "customer-1",
} satisfies Withdrawal;

const purchase = {
  _id: "purchase-1",
  merchant_id: "merchant-1",
  medium: "cash",
  amount: 75.5,
  purchase_date: "2026-09-08T12:00:00Z",
  status: "completed",
  description: "Office supplies",
} satisfies Purchase;

const transfer = {
  _id: "transfer-1",
  medium: "balance",
  amount: 500,
  transaction_date: "2026-09-07T12:00:00Z",
  status: "completed",
  description: "Internal transfer",
  payer_id: "customer-1",
  payee_id: "customer-2",
} satisfies Transfer;

function fakeClient(): NessieClient {
  return {
    accounts: {
      listByCustomer: async () => [checkingAccount, savingsAccount],
    },
    deposits: {
      listByAccount: async (accountId: string) =>
        accountId === checkingAccount._id ? [deposit] : [],
    },
    withdrawals: {
      listByAccount: async (accountId: string) =>
        accountId === checkingAccount._id ? [withdrawal] : [],
    },
    purchases: {
      listByAccount: async (accountId: string) =>
        accountId === checkingAccount._id ? [purchase] : [],
    },
    transfers: {
      listByAccount: async () => [transfer],
    },
  } as unknown as NessieClient;
}

test("Nessie adapter normalizes all account transactions and deduplicates transfers", async () => {
  const snapshot = await new NessieBankProvider(fakeClient()).sync(
    "customer-1",
  );

  assert.equal(snapshot.externalCustomerId, "customer-1");
  assert.equal(snapshot.accounts.length, 2);
  assert.equal(snapshot.transactions.length, 4);
  assert.deepEqual(
    snapshot.transactions.map((transaction) => transaction.direction).sort(),
    ["inflow", "outflow", "outflow", "outflow"].sort(),
  );
  assert.equal(snapshot.recordsRead, 7);
});
