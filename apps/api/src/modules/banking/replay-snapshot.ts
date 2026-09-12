import type { BankingSnapshot } from "./banking-provider.js";

export const REPLAY_CUSTOMER_ID = "222222222222222222222222";
export const REPLAY_ACCOUNT_ID = "111111111111111111111111";
export const REPLAY_CUTOFF_DATE = "2026-09-12";

export const replayBankingSnapshot: BankingSnapshot = {
  source: "replay",
  account: {
    externalId: REPLAY_ACCOUNT_ID,
    customerId: REPLAY_CUSTOMER_ID,
    nickname: "Synthetic checking account",
    balance: "50000.00",
    currency: "MXN",
  },
  movements: [],
  bills: [],
  cutoffDate: REPLAY_CUTOFF_DATE,
  startedAt: "2026-09-12T18:00:00.000Z",
  completedAt: "2026-09-12T18:00:00.000Z",
  consistency: "synthetic_fixture",
  warnings: ["Synthetic replay data; no live Nessie connection was used."],
};
