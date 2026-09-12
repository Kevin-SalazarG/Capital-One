import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as v from "valibot";
import { parse } from "yaml";
import { NessieClient } from "../src/nessie.js";
import * as f from "./fixtures.js";

interface RouteCase {
  readonly method: string;
  readonly path: string;
  readonly run: (client: NessieClient) => Promise<unknown>;
  readonly response: unknown;
  readonly body?: unknown;
}
const routes: readonly RouteCase[] = [
  {
    method: "GET",
    path: `/customers`,
    run: (c: NessieClient) => c.customers.list(),
    response: [f.customer],
  },
  {
    method: "GET",
    path: `/customers/${f.id}`,
    run: (c: NessieClient) => c.customers.get(f.id),
    response: f.customer,
  },
  {
    method: "POST",
    path: `/customers`,
    run: (c: NessieClient) => c.customers.create(f.customerCreate),
    response: "Accepted",
    body: f.customerCreate,
  },
  {
    method: "PUT",
    path: `/customers/${f.id}`,
    run: (c: NessieClient) => c.customers.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  {
    method: "GET",
    path: `/accounts/${f.parentId}/customer`,
    run: (c: NessieClient) => c.customers.getByAccount(f.parentId),
    response: f.customer,
  },
  {
    method: "GET",
    path: `/accounts`,
    run: (c: NessieClient) => c.accounts.list(),
    response: [f.account],
  },
  {
    method: "GET",
    path: `/accounts/${f.id}`,
    run: (c: NessieClient) => c.accounts.get(f.id),
    response: f.account,
  },
  {
    method: "POST",
    path: `/customers/${f.parentId}/accounts`,
    run: (c: NessieClient) => c.accounts.create(f.parentId, f.accountCreate),
    response: "Accepted",
    body: f.accountCreate,
  },
  {
    method: "PUT",
    path: `/accounts/${f.id}`,
    run: (c: NessieClient) => c.accounts.update(f.id, { nickname: "Updated" }),
    response: "Accepted",
    body: { nickname: "Updated" },
  },
  {
    method: "DELETE",
    path: `/accounts/${f.id}`,
    run: (c: NessieClient) => c.accounts.delete(f.id),
    response: undefined,
  },
  {
    method: "GET",
    path: `/customers/${f.parentId}/accounts`,
    run: (c: NessieClient) => c.accounts.listByCustomer(f.parentId),
    response: [f.account],
  },
  {
    method: "GET",
    path: `/bills/${f.id}`,
    run: (c: NessieClient) => c.bills.get(f.id),
    response: f.bill,
  },
  {
    method: "POST",
    path: `/accounts/${f.parentId}/bills`,
    run: (c: NessieClient) => c.bills.create(f.parentId, f.billCreate),
    response: "Accepted",
    body: f.billCreate,
  },
  {
    method: "PUT",
    path: `/bills/${f.id}`,
    run: (c: NessieClient) => c.bills.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  {
    method: "DELETE",
    path: `/bills/${f.id}`,
    run: (c: NessieClient) => c.bills.delete(f.id),
    response: undefined,
  },
  {
    method: "GET",
    path: `/accounts/${f.parentId}/bills`,
    run: (c: NessieClient) => c.bills.listByAccount(f.parentId),
    response: [f.bill],
  },
  {
    method: "GET",
    path: `/customers/${f.parentId}/bills`,
    run: (c: NessieClient) => c.bills.listByCustomer(f.parentId),
    response: [f.bill],
  },
  {
    method: "GET",
    path: `/deposits`,
    run: (c: NessieClient) => c.deposits.list(),
    response: [f.deposit],
  },
  {
    method: "GET",
    path: `/deposits/${f.id}`,
    run: (c: NessieClient) => c.deposits.get(f.id),
    response: f.deposit,
  },
  {
    method: "POST",
    path: `/accounts/${f.parentId}/deposits`,
    run: (c: NessieClient) => c.deposits.create(f.parentId, f.depositCreate),
    response: "Accepted",
    body: f.depositCreate,
  },
  {
    method: "PUT",
    path: `/deposits/${f.id}`,
    run: (c: NessieClient) => c.deposits.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  {
    method: "DELETE",
    path: `/deposits/${f.id}`,
    run: (c: NessieClient) => c.deposits.delete(f.id),
    response: undefined,
  },
  {
    method: "GET",
    path: `/accounts/${f.parentId}/deposits`,
    run: (c: NessieClient) => c.deposits.listByAccount(f.parentId),
    response: [f.deposit],
  },
  {
    method: "GET",
    path: `/loans/${f.id}`,
    run: (c: NessieClient) => c.loans.get(f.id),
    response: f.loan,
  },
  {
    method: "POST",
    path: `/accounts/${f.parentId}/loans`,
    run: (c: NessieClient) => c.loans.create(f.parentId, f.loanCreate),
    response: "Accepted",
    body: f.loanCreate,
  },
  {
    method: "PUT",
    path: `/loans/${f.id}`,
    run: (c: NessieClient) => c.loans.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  {
    method: "DELETE",
    path: `/loans/${f.id}`,
    run: (c: NessieClient) => c.loans.delete(f.id),
    response: undefined,
  },
  {
    method: "GET",
    path: `/accounts/${f.parentId}/loans`,
    run: (c: NessieClient) => c.loans.listByAccount(f.parentId),
    response: [f.loan],
  },
  {
    method: "GET",
    path: `/merchants`,
    run: (c: NessieClient) => c.merchants.list(),
    response: [f.merchant],
  },
  {
    method: "GET",
    path: `/merchants/${f.id}`,
    run: (c: NessieClient) => c.merchants.get(f.id),
    response: f.merchant,
  },
  {
    method: "POST",
    path: `/merchants`,
    run: (c: NessieClient) => c.merchants.create(f.merchantCreate),
    response: "Accepted",
    body: f.merchantCreate,
  },
  {
    method: "PUT",
    path: `/merchants/${f.id}`,
    run: (c: NessieClient) => c.merchants.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  { method: "GET", path: `/atms`, run: (c: NessieClient) => c.atms.list(), response: [f.atm] },
  {
    method: "GET",
    path: `/atms/${f.id}`,
    run: (c: NessieClient) => c.atms.get(f.id),
    response: f.atm,
  },
  {
    method: "GET",
    path: `/branches`,
    run: (c: NessieClient) => c.branches.list(),
    response: [f.branch],
  },
  {
    method: "GET",
    path: `/branches/${f.id}`,
    run: (c: NessieClient) => c.branches.get(f.id),
    response: f.branch,
  },
  {
    method: "GET",
    path: `/withdrawal/${f.id}`,
    run: (c: NessieClient) => c.withdrawals.get(f.id),
    response: f.withdrawal,
  },
  {
    method: "POST",
    path: `/accounts/${f.parentId}/withdrawals`,
    run: (c: NessieClient) => c.withdrawals.create(f.parentId, f.withdrawalCreate),
    response: "Accepted",
    body: f.withdrawalCreate,
  },
  {
    method: "PUT",
    path: `/withdrawal/${f.id}`,
    run: (c: NessieClient) => c.withdrawals.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  {
    method: "DELETE",
    path: `/withdrawal/${f.id}`,
    run: (c: NessieClient) => c.withdrawals.delete(f.id),
    response: undefined,
  },
  {
    method: "GET",
    path: `/accounts/${f.parentId}/withdrawals`,
    run: (c: NessieClient) => c.withdrawals.listByAccount(f.parentId),
    response: [f.withdrawal],
  },
  {
    method: "GET",
    path: `/transfers/${f.id}`,
    run: (c: NessieClient) => c.transfers.get(f.id),
    response: f.transfer,
  },
  {
    method: "POST",
    path: `/accounts/${f.parentId}/transfers`,
    run: (c: NessieClient) => c.transfers.create(f.parentId, f.transferCreate),
    response: "Accepted",
    body: f.transferCreate,
  },
  {
    method: "PUT",
    path: `/transfers/${f.id}`,
    run: (c: NessieClient) => c.transfers.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  {
    method: "DELETE",
    path: `/transfers/${f.id}`,
    run: (c: NessieClient) => c.transfers.delete(f.id),
    response: undefined,
  },
  {
    method: "GET",
    path: `/accounts/${f.parentId}/transfers`,
    run: (c: NessieClient) => c.transfers.listByAccount(f.parentId),
    response: [f.transfer],
  },
  {
    method: "GET",
    path: `/purchase/${f.id}`,
    run: (c: NessieClient) => c.purchases.get(f.id),
    response: f.purchase,
  },
  {
    method: "POST",
    path: `/accounts/${f.parentId}/purchases`,
    run: (c: NessieClient) => c.purchases.create(f.parentId, f.purchaseCreate),
    response: "Accepted",
    body: f.purchaseCreate,
  },
  {
    method: "PUT",
    path: `/purchase/${f.id}`,
    run: (c: NessieClient) => c.purchases.update(f.id, {}),
    response: "Accepted",
    body: {},
  },
  {
    method: "DELETE",
    path: `/purchase/${f.id}`,
    run: (c: NessieClient) => c.purchases.delete(f.id),
    response: undefined,
  },
  {
    method: "GET",
    path: `/accounts/${f.parentId}/purchases`,
    run: (c: NessieClient) => c.purchases.listByAccount(f.parentId),
    response: [f.purchase],
  },
  {
    method: "GET",
    path: `/merchants/${f.parentId}/purchases`,
    run: (c: NessieClient) => c.purchases.listByMerchant(f.parentId),
    response: [f.purchase],
  },
  {
    method: "GET",
    path: `/merchants/${f.parentId}/accounts/${f.parentId}/purchases`,
    run: (c: NessieClient) => c.purchases.listByMerchantAndAccount(f.parentId, f.parentId),
    response: [f.purchase],
  },
  {
    method: "GET",
    path: `/enterprise/customers`,
    run: (c: NessieClient) => c.enterprise.listCustomers(),
    response: [f.customer],
  },
  {
    method: "GET",
    path: `/enterprise/customers/${f.id}`,
    run: (c: NessieClient) => c.enterprise.getCustomer(f.id),
    response: f.customer,
  },
  {
    method: "GET",
    path: `/enterprise/deposits`,
    run: (c: NessieClient) => c.enterprise.listDeposits(),
    response: [f.deposit],
  },
  {
    method: "GET",
    path: `/enterprise/deposits/${f.id}`,
    run: (c: NessieClient) => c.enterprise.getDeposit(f.id),
    response: f.deposit,
  },
  {
    method: "GET",
    path: `/enterprise/withdrawal/${f.id}`,
    run: (c: NessieClient) => c.enterprise.getWithdrawal(f.id),
    response: f.withdrawal,
  },
];

function canonical(path: string): string {
  return path.replace(/\{[^}]+\}|5a1b0e4e4f5236049000000[12]/g, "{id}");
}

for (const route of routes) {
  test(`${route.method} ${canonical(route.path)} sends the expected request and decodes its result`, async () => {
    const mock = f.mockFetch(route.response, route.method === "POST" ? 201 : 200);
    const client = new NessieClient({ apiKey: "fixture-key", fetch: mock.fetch });
    assert.deepEqual(await route.run(client), route.response);
    assert.equal(mock.calls.length, 1);
    const call = mock.calls[0];
    assert(call);
    assert.equal(call.url.pathname, route.path);
    assert.equal(call.init.method, route.method);
    assert.equal(call.url.searchParams.get("key"), "fixture-key");
    assert.equal(call.url.searchParams.size, 1);
    if (route.body !== undefined) {
      assert.equal(typeof call.init.body, "string");
      const decoded: unknown = JSON.parse(String(call.init.body));
      assert.deepEqual(decoded, route.body);
    } else assert.equal(call.init.body, undefined);
  });
}

test("covers every published OpenAPI operation; additions must be explicitly sourced", () => {
  const raw: unknown = parse(
    readFileSync(new URL("../spec/nessie-openapi.yaml", import.meta.url), "utf8"),
  );
  const document = v.parse(
    v.object({ paths: v.record(v.string(), v.record(v.string(), v.unknown())) }),
    raw,
  );
  const covered = new Set(routes.map((r) => `${r.method} ${canonical(r.path)}`));
  assert.equal(covered.size, routes.length, "Duplicate route test");
  const documented = new Set<string>();
  for (const [path, operations] of Object.entries(document.paths)) {
    for (const method of Object.keys(operations)) {
      if (!["get", "post", "put", "delete"].includes(method)) continue;
      const key = `${method.toUpperCase()} ${canonical(path)}`;
      documented.add(key);
      assert(covered.has(key), `Missing SDK coverage: ${key}`);
    }
  }
  const supplemental = new Set([
    "GET /accounts/{id}/transfers",
    "POST /accounts/{id}/transfers",
    "GET /accounts/{id}/purchases",
    "POST /accounts/{id}/purchases",
    "GET /merchants/{id}/purchases",
    "GET /merchants/{id}/accounts/{id}/purchases",
  ]);
  assert.deepEqual(new Set([...covered].filter((key) => !documented.has(key))), supplemental);
});

test("retains zero-valued geographic coordinates and validates transfer filters", async () => {
  const mock = f.mockFetch([f.atm]);
  const client = new NessieClient({ apiKey: "fixture-key", fetch: mock.fetch });
  await client.atms.list({ lat: 0, lng: 0, rad: 0 });
  assert.equal(mock.calls[0]?.url.searchParams.get("lat"), "0");
  assert.equal(mock.calls[0]?.url.searchParams.get("lng"), "0");
  assert.equal(mock.calls[0]?.url.searchParams.get("rad"), "0");
  const transfers = f.mockFetch([f.transfer]);
  await new NessieClient({ apiKey: "fixture-key", fetch: transfers.fetch }).transfers.listByAccount(
    f.id,
    { type: "payee" },
  );
  assert.equal(transfers.calls[0]?.url.searchParams.get("type"), "payee");
});
