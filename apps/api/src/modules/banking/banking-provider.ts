export type BankingSource = "nessie_live" | "replay";
export type MovementStatus = "pending" | "cancelled" | "completed";
export type BillStatus = MovementStatus | "recurring";

export interface BankingLoadRequest {
  readonly customerId: string;
  readonly accountId: string;
  readonly cutoffDate: string;
  readonly timezone: string;
  readonly signal?: AbortSignal;
}

export interface NormalizedAccount {
  readonly externalId: string;
  readonly customerId: string;
  readonly nickname: string;
  readonly balance: string;
  readonly currency: "MXN";
}

export interface NormalizedMovement {
  readonly externalId: string;
  readonly resource: "deposit" | "withdrawal";
  readonly direction: "inflow" | "outflow";
  readonly amount: string;
  readonly date: string;
  readonly status: MovementStatus;
  readonly classification: "unclassified";
  readonly description: string;
}

export interface NormalizedBill {
  readonly externalId: string;
  readonly accountId: string;
  readonly payee: string;
  readonly nickname: string;
  readonly amount: string;
  readonly paymentDate: string;
  readonly upcomingDate: string;
  readonly recurringDay: number;
  readonly status: BillStatus;
}

export interface BankingSnapshot {
  readonly source: BankingSource;
  readonly account: NormalizedAccount;
  readonly movements: readonly NormalizedMovement[];
  readonly bills: readonly NormalizedBill[];
  readonly startedAt: string;
  readonly completedAt: string;
  readonly cutoffDate: string;
  readonly consistency: "stable_balance_bracket" | "synthetic_fixture";
  readonly warnings: readonly string[];
}

export abstract class BankingProvider {
  abstract load(request: BankingLoadRequest): Promise<BankingSnapshot>;
}

export type BankingProviderErrorCode =
  | "PROVIDER_NOT_VERIFIED"
  | "PROVIDER_SCOPE_MISMATCH"
  | "PROVIDER_INVALID_DATA"
  | "PROVIDER_INCONSISTENT_SNAPSHOT"
  | "PROVIDER_INPUT_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_CANCELLED";

export class BankingProviderError extends Error {
  constructor(readonly code: BankingProviderErrorCode) {
    super(code);
    this.name = "BankingProviderError";
  }
}
