import type { Account, Bill, Deposit, Withdrawal } from "nessie-node-sdk";
import {
  REPLAY_ACCOUNT_ID,
  REPLAY_CUSTOMER_ID,
  replayBankingSnapshot,
} from "../../src/modules/banking/replay-snapshot.js";

export const FIXTURE_CUSTOMER_ID = REPLAY_CUSTOMER_ID;
export const FIXTURE_ACCOUNT_ID = REPLAY_ACCOUNT_ID;

export const fixtureAccount: Account = {
  _id: FIXTURE_ACCOUNT_ID,
  customer_id: FIXTURE_CUSTOMER_ID,
  account_number: "0000000000000000",
  type: "Checking",
  nickname: "Synthetic checking account",
  rewards: 0,
  balance: 50_000,
};

export const fixtureDeposit: Deposit = {
  _id: "333333333333333333333333",
  medium: "balance",
  amount: 1_000,
  transaction_date: "2026-09-10",
  status: "completed",
  description: "Synthetic unclassified deposit",
};

export const fixtureWithdrawal: Withdrawal = {
  _id: "444444444444444444444444",
  payer_id: FIXTURE_ACCOUNT_ID,
  medium: "balance",
  amount: 125.25,
  transaction_date: "2026-09-11",
  status: "completed",
  description: "Synthetic overhead payment",
};

export const fixtureBill: Bill = {
  _id: "555555555555555555555555",
  account_id: FIXTURE_ACCOUNT_ID,
  status: "recurring",
  payee: "Synthetic supplier",
  nickname: "Monthly materials",
  creation_date: "2026-09-01",
  payment_date: "2026-09-18",
  upcoming_payment_date: "2026-09-18",
  recurring_date: 18,
  payment_amount: 250.25,
};

export const fixtureBankingSnapshot = replayBankingSnapshot;
