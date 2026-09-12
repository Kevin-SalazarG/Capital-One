import { Decimal } from "decimal.js";
import type { Account, Bill, Deposit, Withdrawal } from "nessie-node-sdk";
import {
  BankingProviderError,
  type MovementStatus,
  type NormalizedAccount,
  type NormalizedBill,
  type NormalizedMovement,
} from "./banking-provider.js";

const MAX_PROVIDER_AMOUNT = new Decimal("999999999999.99");
export const BANKING_RECORD_LIMIT = 500;

export function bankingCalendarDate(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function normalizeProviderAmount(value: number): string {
  if (!Number.isFinite(value)) throw new BankingProviderError("PROVIDER_INVALID_DATA");
  const amount = new Decimal(String(value));
  if (
    amount.isNegative() ||
    amount.decimalPlaces() > 2 ||
    amount.greaterThan(MAX_PROVIDER_AMOUNT)
  ) {
    throw new BankingProviderError("PROVIDER_INVALID_DATA");
  }
  return amount.toFixed(2);
}

function normalizePositiveAmount(value: number): string {
  const amount = normalizeProviderAmount(value);
  if (amount === "0.00") throw new BankingProviderError("PROVIDER_INVALID_DATA");
  return amount;
}

export function validateProviderDate(value: string | undefined): string {
  if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BankingProviderError("PROVIDER_INVALID_DATA");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BankingProviderError("PROVIDER_INVALID_DATA");
  }
  return value;
}

function normalizeStatus(value: string | undefined): MovementStatus {
  if (value !== "pending" && value !== "cancelled" && value !== "completed") {
    throw new BankingProviderError("PROVIDER_INVALID_DATA");
  }
  return value;
}

export function normalizeAccount(account: Account): NormalizedAccount {
  if (account.type !== "Checking") throw new BankingProviderError("PROVIDER_INVALID_DATA");
  return {
    externalId: account._id,
    customerId: account.customer_id,
    nickname: account.nickname,
    balance: normalizeProviderAmount(account.balance),
    currency: "MXN",
  };
}

function normalizeDeposit(deposit: Deposit): NormalizedMovement {
  return {
    externalId: deposit._id,
    resource: "deposit",
    direction: "inflow",
    amount: normalizePositiveAmount(deposit.amount),
    date: validateProviderDate(deposit.transaction_date),
    status: normalizeStatus(deposit.status),
    classification: "unclassified",
    description: deposit.description,
  };
}

function normalizeWithdrawal(withdrawal: Withdrawal, accountId: string): NormalizedMovement {
  if (withdrawal.payer_id !== undefined && withdrawal.payer_id !== accountId) {
    throw new BankingProviderError("PROVIDER_SCOPE_MISMATCH");
  }
  return {
    externalId: withdrawal._id,
    resource: "withdrawal",
    direction: "outflow",
    amount: normalizePositiveAmount(withdrawal.amount),
    date: validateProviderDate(withdrawal.transaction_date),
    status: normalizeStatus(withdrawal.status),
    classification: "unclassified",
    description: withdrawal.description ?? "",
  };
}

export function normalizeMovements(
  deposits: readonly Deposit[],
  withdrawals: readonly Withdrawal[],
  accountId: string,
): readonly NormalizedMovement[] {
  const unique = new Map<string, NormalizedMovement>();
  for (const movement of [
    ...deposits.map(normalizeDeposit),
    ...withdrawals.map((withdrawal) => normalizeWithdrawal(withdrawal, accountId)),
  ]) {
    const key = `${movement.resource}:${movement.externalId}`;
    const existing = unique.get(key);
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(movement)) {
      throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
    }
    unique.set(key, movement);
  }
  return [...unique.values()].sort((left, right) =>
    `${left.date}:${left.resource}:${left.externalId}`.localeCompare(
      `${right.date}:${right.resource}:${right.externalId}`,
    ),
  );
}

export function normalizeBills(
  bills: readonly Bill[],
  accountId: string,
): readonly NormalizedBill[] {
  const unique = new Map<string, NormalizedBill>();
  for (const bill of bills) {
    if (bill.account_id !== accountId) throw new BankingProviderError("PROVIDER_SCOPE_MISMATCH");
    const normalized: NormalizedBill = {
      externalId: bill._id,
      accountId: bill.account_id,
      payee: bill.payee,
      nickname: bill.nickname,
      amount: normalizePositiveAmount(bill.payment_amount),
      paymentDate: validateProviderDate(bill.payment_date),
      upcomingDate: validateProviderDate(bill.upcoming_payment_date),
      recurringDay: bill.recurring_date,
      status: bill.status,
    };
    const existing = unique.get(bill._id);
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(normalized)) {
      throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
    }
    unique.set(bill._id, normalized);
  }
  return [...unique.values()].sort((left, right) =>
    left.externalId.localeCompare(right.externalId),
  );
}
