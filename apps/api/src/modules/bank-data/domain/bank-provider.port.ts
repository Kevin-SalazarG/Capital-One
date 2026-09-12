import type { ConnectionProvider } from "../../../common/database/database.types";

export interface ExternalBankAccount {
  readonly externalId: string;
  readonly name: string;
  readonly type: string;
  readonly currency: string;
  readonly balance: string;
  readonly availableBalance: string | null;
  readonly status: string;
  readonly metadata: Record<string, string | number | boolean | null>;
}

export interface ExternalBankTransaction {
  readonly externalId: string;
  readonly accountExternalId: string;
  readonly direction: "inflow" | "outflow" | "transfer";
  readonly amount: string;
  readonly currency: string;
  readonly description: string | null;
  readonly postedAt: string;
  readonly status: string;
  readonly metadata: Record<string, string | number | boolean | null>;
}

export interface ExternalBankSnapshot {
  readonly provider: ConnectionProvider;
  readonly externalCustomerId: string;
  readonly accounts: readonly ExternalBankAccount[];
  readonly transactions: readonly ExternalBankTransaction[];
  readonly recordsRead: number;
}

export const BANK_PROVIDER_PORT = Symbol("BANK_PROVIDER_PORT");

export interface BankProviderPort {
  readonly provider: ConnectionProvider;

  sync(externalCustomerId: string | null): Promise<ExternalBankSnapshot>;
}
