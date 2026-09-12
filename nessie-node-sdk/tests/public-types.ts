import type { Account, AccountCreate, ATMQuery, Customer, NessieClient } from "../src/nessie.js";

// This file is compiled, not executed. A removed type error fails the typecheck.
export async function verifyPublicTypes(client: NessieClient): Promise<void> {
  const customers: Customer[] = await client.customers.list();
  const accounts: Account[] = await client.accounts.list({ type: "Checking" });
  void customers;
  void accounts;
  const account: AccountCreate = { type: "Savings", nickname: "Goal", balance: 0, rewards: 0 };
  await client.accounts.create("customer-id", account);
  const near: ATMQuery = { lat: 0, lng: 0, rad: 1 };
  await client.atms.list(near);
  // @ts-expect-error A required field is missing.
  await client.customers.create({ first_name: "Jane" });
  // @ts-expect-error Only Nessie account types are accepted.
  await client.accounts.list({ type: "Wallet" });
  await client.transfers.create("account-id", {
    medium: "balance",
    // @ts-expect-error Amount is numeric.
    amount: "10",
    payee_id: "recipient",
  });
  // @ts-expect-error Input must contain named fields.
  await client.accounts.update("id", { nicknme: "typo" });
  // @ts-expect-error Geographic filters must contain all three coordinates.
  await client.atms.list({ lat: 0 });
  // @ts-expect-error Unknown ATM filters are not accepted.
  await client.atms.list({ page: 1 });
  // @ts-expect-error No API key override is allowed per request.
  await client.customers.list({ apiKey: "other" });
  // @ts-expect-error Results stay strongly typed.
  const wrong: string = await client.customers.get("id");
  void wrong;
}
