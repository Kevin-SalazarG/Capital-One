import type {
  Account,
  AccountCreate,
  ATM,
  Bill,
  BillCreate,
  Branch,
  Customer,
  CustomerCreate,
  Deposit,
  DepositCreate,
  Fetch,
  Loan,
  LoanCreate,
  Merchant,
  MerchantCreate,
  Purchase,
  PurchaseCreate,
  Transfer,
  TransferCreate,
  Withdrawal,
  WithdrawalCreate,
} from "../src/nessie.js";

export const id = "5a1b0e4e4f52360490000001";
export const parentId = "5a1b0e4e4f52360490000002";
export const address = {
  street_number: "1",
  street_name: "Main St",
  city: "Arlington",
  state: "VA",
  zip: "22201",
};
export const customerCreate: CustomerCreate = { first_name: "Jane", last_name: "Doe", address };
export const customer: Customer = { _id: id, ...customerCreate };
export const accountCreate: AccountCreate = {
  type: "Checking",
  nickname: "Everyday",
  rewards: 0,
  balance: 100,
};
export const account: Account = {
  _id: id,
  ...accountCreate,
  account_number: "1234567890123456",
  customer_id: parentId,
};
export const billCreate: BillCreate = {
  status: "pending",
  payee: "Electric Company",
  payment_amount: 120.5,
};
export const bill: Bill = {
  _id: id,
  ...billCreate,
  nickname: "Electric",
  creation_date: "2026-09-12",
  payment_date: "2026-10-01",
  recurring_date: 1,
  upcoming_payment_date: "2026-10-01",
  account_id: parentId,
};
export const depositCreate: DepositCreate = {
  medium: "balance",
  amount: 100,
  status: "completed",
  transaction_date: "2026-09-12",
  description: "Payroll",
};
export const deposit: Deposit = { _id: id, ...depositCreate };
export const loanCreate: LoanCreate = {
  type: "home",
  status: "approved",
  credit_score: 750,
  monthly_payment: 1200,
  amount: 250000,
  description: "Home mortgage",
};
export const loan: Loan = { _id: id, ...loanCreate, creation_date: "2026-09-12" };
export const merchantCreate: MerchantCreate = { name: "Corner Grocery", category: "food", address };
export const merchant: Merchant = { _id: id, ...merchantCreate };
export const atm: ATM = {
  _id: id,
  name: "Downtown",
  address,
  geocode: { lat: 0, lng: 0 },
  amount_left: 5000,
};
export const branch: Branch = {
  _id: id,
  name: "Main",
  address,
  phone_number: "703-555-0100",
  hours: ["Mon-Fri 9-5"],
  notes: [],
};
export const withdrawalCreate: WithdrawalCreate = { medium: "balance", amount: 10.5 };
export const withdrawal: Withdrawal = { _id: id, ...withdrawalCreate };
export const transferCreate: TransferCreate = {
  medium: "balance",
  amount: 10.5,
  payee_id: parentId,
};
export const transfer: Transfer = { _id: id, ...transferCreate };
export const purchaseCreate: PurchaseCreate = {
  merchant_id: parentId,
  medium: "balance",
  amount: 10.5,
};
export const purchase: Purchase = { _id: id, ...purchaseCreate };

export interface CapturedRequest {
  readonly url: URL;
  readonly init: RequestInit;
}
export function mockFetch(body: unknown, status = 200) {
  const calls: CapturedRequest[] = [];
  const fetch: Fetch = async (url, init) => {
    calls.push({ url, init });
    return body === undefined ? new Response(null, { status }) : Response.json(body, { status });
  };
  return { calls, fetch };
}
