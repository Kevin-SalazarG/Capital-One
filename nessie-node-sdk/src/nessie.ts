import type { NessieOptions } from "./http/options.js";
import { HttpTransport } from "./http/transport.js";
import { Accounts } from "./resources/accounts.js";
import { Atms } from "./resources/atms.js";
import { Bills } from "./resources/bills.js";
import { Branches } from "./resources/branches.js";
import { Customers } from "./resources/customers.js";
import { Deposits } from "./resources/deposits.js";
import { Enterprise } from "./resources/enterprise.js";
import { Loans } from "./resources/loans.js";
import { Merchants } from "./resources/merchants.js";
import { Purchases } from "./resources/purchases.js";
import { Transfers } from "./resources/transfers.js";
import { Withdrawals } from "./resources/withdrawals.js";

export * from "./errors/nessie-errors.js";
export type { Fetch, NessieOptions, RequestOptions } from "./http/options.js";
export { NESSIE_BASE_URL } from "./http/transport.js";
export type {
  Account,
  AccountCreate,
  AccountQuery,
  AccountType,
  AccountUpdate,
} from "./models/accounts.js";
export type { Address, Geocode } from "./models/address.js";
export type { ATM, ATMQuery } from "./models/atms.js";
export type { Bill, BillCreate, BillStatus, BillUpdate } from "./models/bills.js";
export type { Branch } from "./models/branches.js";
export type { Customer, CustomerCreate, CustomerUpdate } from "./models/customers.js";
export type { Deposit, DepositCreate, DepositUpdate } from "./models/deposits.js";
export type { Loan, LoanCreate, LoanUpdate } from "./models/loans.js";
export type { Merchant, MerchantCreate, MerchantUpdate } from "./models/merchants.js";
export type { Purchase, PurchaseCreate, PurchaseUpdate } from "./models/purchases.js";
export type { Acknowledgement, CreationResult } from "./models/responses.js";
export type {
  Transfer,
  TransferCreate,
  TransferQuery,
  TransferUpdate,
} from "./models/transfers.js";
export type { Withdrawal, WithdrawalCreate, WithdrawalUpdate } from "./models/withdrawals.js";

export class NessieClient {
  readonly customers: Customers;
  readonly accounts: Accounts;
  readonly bills: Bills;
  readonly deposits: Deposits;
  readonly loans: Loans;
  readonly merchants: Merchants;
  readonly atms: Atms;
  readonly branches: Branches;
  readonly withdrawals: Withdrawals;
  readonly transfers: Transfers;
  readonly purchases: Purchases;
  readonly enterprise: Enterprise;

  constructor(options: NessieOptions) {
    const http = new HttpTransport(options);
    this.customers = new Customers(http);
    this.accounts = new Accounts(http);
    this.bills = new Bills(http);
    this.deposits = new Deposits(http);
    this.loans = new Loans(http);
    this.merchants = new Merchants(http);
    this.atms = new Atms(http);
    this.branches = new Branches(http);
    this.withdrawals = new Withdrawals(http);
    this.transfers = new Transfers(http);
    this.purchases = new Purchases(http);
    this.enterprise = new Enterprise(http);
  }
}
