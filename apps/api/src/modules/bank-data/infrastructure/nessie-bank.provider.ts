import { Inject, Injectable } from "@nestjs/common";
import {
  NessieHttpError,
  type Account,
  type CustomerCreate,
  type Deposit,
  type NessieClient,
  type Purchase,
  type Transfer,
  type Withdrawal,
} from "nessie-node-sdk";

import { toIsoTimestamp } from "../../../common/utilities/date";
import { toDecimal } from "../../../common/utilities/money";
import type {
  BankProviderPort,
  ExternalBankAccount,
  ExternalBankSnapshot,
  ExternalBankTransaction,
} from "../domain/bank-provider.port";
import { NESSIE_CLIENT } from "./nessie-client.provider";

function normalizeOptionalDate(
  value: string | undefined,
  fallbackField: string,
): string | null {
  if (!value) {
    return null;
  }
  return toIsoTimestamp(value, fallbackField);
}

function toExternalAmount(value: number, fieldName: string): string {
  return toDecimal(value, fieldName).toFixed(2);
}

function mapAccount(account: Account): ExternalBankAccount {
  return {
    externalId: account._id,
    name: account.nickname,
    type: account.type,
    currency: "USD",
    balance: toExternalAmount(account.balance, "account.balance"),
    availableBalance: null,
    status: "active",
    metadata: {
      accountNumber: account.account_number,
      customerId: account.customer_id,
      rewards: account.rewards,
    },
  };
}

function mapDeposits(
  account: Account,
  deposits: readonly Deposit[],
): ExternalBankTransaction[] {
  return deposits.flatMap((deposit) => {
    const postedAt = normalizeOptionalDate(
      deposit.transaction_date,
      "deposit.transaction_date",
    );
    return postedAt
      ? [
          {
            externalId: deposit._id,
            accountExternalId: account._id,
            direction: "inflow" as const,
            amount: toExternalAmount(deposit.amount, "deposit.amount"),
            currency: "USD",
            description: deposit.description,
            postedAt,
            status: deposit.status,
            metadata: { medium: deposit.medium },
          },
        ]
      : [];
  });
}

function mapWithdrawals(
  account: Account,
  withdrawals: readonly Withdrawal[],
): ExternalBankTransaction[] {
  return withdrawals.flatMap((withdrawal) => {
    const postedAt = normalizeOptionalDate(
      withdrawal.transaction_date,
      "withdrawal.transaction_date",
    );
    return postedAt
      ? [
          {
            externalId: withdrawal._id,
            accountExternalId: account._id,
            direction: "outflow" as const,
            amount: toExternalAmount(withdrawal.amount, "withdrawal.amount"),
            currency: "USD",
            description: withdrawal.description ?? null,
            postedAt,
            status: withdrawal.status ?? "completed",
            metadata: {
              medium: withdrawal.medium,
              payerId: withdrawal.payer_id ?? null,
            },
          },
        ]
      : [];
  });
}

function mapPurchases(
  account: Account,
  purchases: readonly Purchase[],
): ExternalBankTransaction[] {
  return purchases.flatMap((purchase) => {
    const postedAt = normalizeOptionalDate(
      purchase.purchase_date ?? purchase.transaction_date,
      "purchase.purchase_date",
    );
    return postedAt
      ? [
          {
            externalId: purchase._id,
            accountExternalId: account._id,
            direction: "outflow" as const,
            amount: toExternalAmount(purchase.amount, "purchase.amount"),
            currency: "USD",
            description: purchase.description ?? null,
            postedAt,
            status: purchase.status ?? "completed",
            metadata: {
              medium: purchase.medium,
              merchantId: purchase.merchant_id,
            },
          },
        ]
      : [];
  });
}

function mapTransfers(
  account: Account,
  customerId: string,
  transfers: readonly Transfer[],
): ExternalBankTransaction[] {
  return transfers.flatMap((transfer) => {
    const postedAt = normalizeOptionalDate(
      transfer.transaction_date,
      "transfer.transaction_date",
    );
    if (!postedAt) {
      return [];
    }
    return [
      {
        externalId: transfer._id,
        accountExternalId: account._id,
        direction:
          transfer.payer_id === customerId
            ? ("outflow" as const)
            : ("inflow" as const),
        amount: toExternalAmount(transfer.amount, "transfer.amount"),
        currency: "USD",
        description: transfer.description ?? null,
        postedAt,
        status: transfer.status ?? "completed",
        metadata: {
          medium: transfer.medium,
          payerId: transfer.payer_id ?? null,
          payeeId: transfer.payee_id ?? null,
        },
      },
    ];
  });
}

@Injectable()
export class NessieBankProvider implements BankProviderPort {
  public readonly provider = "nessie" as const;

  public constructor(
    @Inject(NESSIE_CLIENT) private readonly client: NessieClient,
  ) {}

  public async sync(
    externalCustomerId: string | null,
  ): Promise<ExternalBankSnapshot> {
    const customerId = externalCustomerId ?? (await this.resolveCustomerId());
    const accounts = await this.client.accounts.listByCustomer(customerId);
    const mappedAccounts = accounts.map(mapAccount);
    if (accounts.length === 0) {
      return {
        provider: this.provider,
        externalCustomerId: customerId,
        accounts: mappedAccounts,
        transactions: [],
        recordsRead: mappedAccounts.length,
      };
    }

    const accountSnapshots = await Promise.all(
      accounts.map(async (account) => {
        const [deposits, withdrawals, purchases, transfers] = await Promise.all(
          [
            this.client.deposits.listByAccount(account._id),
            this.client.withdrawals.listByAccount(account._id),
            this.client.purchases.listByAccount(account._id),
            this.listTransfers(account._id),
          ],
        );
        return { account, deposits, withdrawals, purchases, transfers };
      }),
    );

    const transactionByExternalId = new Map<string, ExternalBankTransaction>();
    for (const snapshot of accountSnapshots) {
      const transactions = [
        ...mapDeposits(snapshot.account, snapshot.deposits),
        ...mapWithdrawals(snapshot.account, snapshot.withdrawals),
        ...mapPurchases(snapshot.account, snapshot.purchases),
        ...mapTransfers(snapshot.account, customerId, snapshot.transfers),
      ];
      for (const transaction of transactions) {
        transactionByExternalId.set(transaction.externalId, transaction);
      }
    }
    const transactions = [...transactionByExternalId.values()];

    return {
      provider: this.provider,
      externalCustomerId: customerId,
      accounts: mappedAccounts,
      transactions,
      recordsRead:
        mappedAccounts.length +
        accountSnapshots.reduce(
          (total, snapshot) =>
            total +
            snapshot.deposits.length +
            snapshot.withdrawals.length +
            snapshot.purchases.length +
            snapshot.transfers.length,
          0,
        ),
    };
  }

  private async listTransfers(accountId: string): Promise<Transfer[]> {
    try {
      return await this.client.transfers.listByAccount(accountId);
    } catch (error) {
      // Nessie uses this specific 404 for an empty collection on an existing account.
      if (
        error instanceof NessieHttpError &&
        error.status === 404 &&
        error.body === "No transfers found for this account"
      ) {
        return [];
      }
      throw error;
    }
  }

  private async resolveCustomerId(): Promise<string> {
    const customers = await this.client.customers.list();
    const firstCustomer = customers[0];
    if (firstCustomer) {
      return firstCustomer._id;
    }

    const input: CustomerCreate = {
      first_name: "Colchon",
      last_name: "Demo",
      address: {
        street_number: "1",
        street_name: "Main St",
        city: "Arlington",
        state: "VA",
        zip: "22201",
      },
    };
    const result = await this.client.customers.create(input);
    if (typeof result !== "string" && result.objectCreated?._id) {
      return result.objectCreated._id;
    }

    const refreshedCustomers = await this.client.customers.list();
    const refreshedCustomer = refreshedCustomers[0];
    if (!refreshedCustomer) {
      throw new Error("Nessie customer could not be resolved");
    }
    return refreshedCustomer._id;
  }
}
