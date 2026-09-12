import assert from "node:assert/strict";
import { test } from "node:test";
import { inspect } from "node:util";
import { retryDelay } from "../src/http/retry.js";
import {
  NessieAbortError,
  NessieClient,
  NessieConfigurationError,
  NessieHttpError,
  NessieNetworkError,
  NessieResponseError,
  NessieTimeoutError,
  NessieValidationError,
} from "../src/nessie.js";
import { account, customer, customerCreate, id, mockFetch } from "./fixtures.js";

test("isolates credentials, encodes query parameters and retains a base URL prefix", async () => {
  const mock = mockFetch([account]);
  const a = new NessieClient({
    apiKey: "a +?&=☃",
    fetch: mock.fetch,
    baseUrl: "https://example.test/qa/",
  });
  const b = new NessieClient({ apiKey: "b", fetch: mock.fetch });
  await Promise.all([a.accounts.list({ type: "Credit Card" }), b.accounts.list()]);
  assert.equal(mock.calls[0]?.url.pathname, "/qa/accounts");
  assert.equal(mock.calls[0]?.url.searchParams.get("key"), "a +?&=☃");
  assert.equal(mock.calls[0]?.url.searchParams.get("type"), "Credit Card");
  assert.equal(mock.calls[1]?.url.searchParams.get("key"), "b");
  assert.equal(mock.calls[1]?.url.origin, "https://prod-api.nessieisreal.com");
  assert.equal(mock.calls[0]?.init.redirect, "error");
  assert(!inspect(a, { depth: 10 }).includes("a +?&=☃"));
});

test("serializes bodies as JSON and validates nested responses", async () => {
  const mock = mockFetch({ code: 201, message: "Created", objectCreated: customer }, 201);
  const client = new NessieClient({ apiKey: "test", fetch: mock.fetch });
  const result = await client.customers.create(customerCreate);
  assert.deepEqual(result, { code: 201, message: "Created", objectCreated: customer });
  assert.equal(mock.calls[0]?.init.body, JSON.stringify(customerCreate));
  assert.equal(new Headers(mock.calls[0]?.init.headers).get("content-type"), "application/json");
  const broken = new NessieClient({
    apiKey: "test",
    fetch: mockFetch({ code: 201, message: "Created", objectCreated: { _id: id } }, 201).fetch,
  });
  await assert.rejects(broken.customers.create(customerCreate), NessieResponseError);
});

test("decodes UUID identifiers from the deployed API alongside legacy identifiers", async () => {
  const uuidCustomer = { ...customer, _id: "12345678-1234-4234-8234-123456789abc" };
  const client = new NessieClient({
    apiKey: "test",
    fetch: mockFetch([customer, uuidCustomer]).fetch,
  });
  assert.deepEqual(await client.customers.list(), [customer, uuidCustomer]);
});

test("preserves documented string acknowledgements and empty DELETE responses", async () => {
  for (const body of ["Created", { code: 202, message: "Accepted" }, undefined]) {
    const client = new NessieClient({ apiKey: "test", fetch: mockFetch(body).fetch });
    assert.deepEqual(await client.accounts.delete(id), body);
  }
  const client = new NessieClient({
    apiKey: "test",
    fetch: async () => new Response("Customer created", { status: 201 }),
  });
  assert.equal(await client.customers.create(customerCreate), "Customer created");
});

test("rejects malformed JSON and structurally incorrect success bodies without retrying", async () => {
  for (const body of [
    '{"broken":',
    '[{"_id":"short"}]',
    '{"message":"not an array"}',
    "null",
    "",
  ]) {
    let calls = 0;
    const client = new NessieClient({
      apiKey: "test",
      fetch: async () => {
        calls++;
        return new Response(body, { headers: { "content-type": "application/json" } });
      },
    });
    await assert.rejects(client.customers.list(), NessieResponseError);
    assert.equal(calls, 1);
  }
});

test("rejects invalid request values before making a network request", async () => {
  const mock = mockFetch([]);
  const client = new NessieClient({ apiKey: "test", fetch: mock.fetch });
  await assert.rejects(
    client.accounts.create(id, { type: "Checking", nickname: "x", balance: -1, rewards: 0 }),
    NessieValidationError,
  );
  await assert.rejects(
    client.bills.create(id, {
      status: "pending",
      payee: "x",
      payment_amount: 5,
      recurring_date: 32,
    }),
    NessieValidationError,
  );
  await assert.rejects(client.atms.list({ lat: 91, lng: 0, rad: 1 }), NessieValidationError);
  for (const badId of ["", " ", ".", ".."])
    await assert.rejects(client.customers.get(badId), NessieValidationError);
  const extraField = { ...customerCreate, unexpected: true };
  await assert.rejects(client.customers.create(extraField), NessieValidationError);
  assert.equal(mock.calls.length, 0);
});

test("escapes IDs instead of allowing them to change routes or authentication", async () => {
  const mock = mockFetch(customer);
  const client = new NessieClient({ apiKey: "test", fetch: mock.fetch });
  await client.customers.get("a/b?key=other#x");
  assert.equal(mock.calls[0]?.url.pathname, "/customers/a%2Fb%3Fkey%3Dother%23x");
  assert.equal(mock.calls[0]?.url.searchParams.get("key"), "test");
});

test("validates constructor and request configuration", async () => {
  for (const baseUrl of [
    "garbage",
    "file:///etc",
    "https://u:p@example.test",
    "https://example.test?key=secret",
    "https://example.test/#frag",
  ]) {
    assert.throws(() => new NessieClient({ apiKey: "test", baseUrl }), NessieConfigurationError);
  }
  for (const apiKey of ["", " "])
    assert.throws(() => new NessieClient({ apiKey }), NessieConfigurationError);
  for (const timeoutMs of [0, -1, NaN, Infinity, 1.5, 2 ** 32]) {
    assert.throws(() => new NessieClient({ apiKey: "test", timeoutMs }), NessieConfigurationError);
  }
  const client = new NessieClient({ apiKey: "test", fetch: mockFetch([]).fetch });
  await assert.rejects(client.customers.list({ maxRetries: -1 }), NessieConfigurationError);
});

test("redacts nested API-key echoes from HTTP errors", async () => {
  const secret = "my key&secret";
  const body = {
    message: `https://api.test?key=${encodeURIComponent(secret)}`,
    details: {
      api_key: secret,
      nested: [secret],
      query: new URLSearchParams({ key: secret }).toString(),
    },
  };
  const client = new NessieClient({
    apiKey: secret,
    maxRetries: 0,
    fetch: async () => Response.json(body, { status: 401, headers: { "x-request-id": "req-123" } }),
  });
  await assert.rejects(client.customers.list(), (error: unknown) => {
    assert(error instanceof NessieHttpError);
    assert.equal(error.status, 401);
    assert.equal(error.requestId, "req-123");
    assert.equal(error.method, "GET");
    assert.equal(error.path, "/customers");
    for (const token of [secret, encodeURIComponent(secret), "my+key%26secret"])
      assert(!inspect(error, { depth: 10 }).includes(token));
    return true;
  });
});

test("preserves non-JSON HTTP errors without treating them as parsing failures", async () => {
  const client = new NessieClient({
    apiKey: "test",
    maxRetries: 0,
    fetch: async () => new Response("<h1>Unavailable</h1>", { status: 503 }),
  });
  await assert.rejects(client.customers.list(), (error: unknown) => {
    assert(error instanceof NessieHttpError);
    assert.equal(error.body, "<h1>Unavailable</h1>");
    return true;
  });
});

test("retries transient GET failures and honors per-request retry overrides", async () => {
  let attempts = 0;
  const client = new NessieClient({
    apiKey: "test",
    fetch: async () => {
      attempts++;
      return attempts < 3
        ? new Response("busy", { status: 503, headers: { "retry-after": "0" } })
        : Response.json([customer]);
    },
  });
  assert.deepEqual(await client.customers.list(), [customer]);
  assert.equal(attempts, 3);
  attempts = 0;
  await assert.rejects(client.customers.list({ maxRetries: 0 }), NessieHttpError);
  assert.equal(attempts, 1);
});

test("does not retry writes, authorization errors, redirects or other permanent failures", async () => {
  for (const status of [301, 400, 401, 403, 404, 422]) {
    const mock = mockFetch("failure", status);
    const client = new NessieClient({ apiKey: "test", fetch: mock.fetch });
    await assert.rejects(client.customers.list(), NessieHttpError);
    assert.equal(mock.calls.length, 1);
  }
  for (const action of ["create", "update", "delete"]) {
    const mock = mockFetch("busy", 503);
    const client = new NessieClient({ apiKey: "test", fetch: mock.fetch });
    const call =
      action === "create"
        ? client.customers.create(customerCreate)
        : action === "update"
          ? client.customers.update(id, { first_name: "New" })
          : client.accounts.delete(id);
    await assert.rejects(call, NessieHttpError);
    assert.equal(mock.calls.length, 1);
  }
});

test("bounds Retry-After and does not retry sooner than the server permits", async () => {
  const now = Date.UTC(2026, 0, 1);
  assert.equal(retryDelay(0, "2", now), 2000);
  assert.equal(retryDelay(0, new Date(now + 5000).toUTCString(), now), 5000);
  assert.equal(retryDelay(0, "31", now), null);
  const mock = mockFetch("busy", 429);
  let calls = 0;
  const client = new NessieClient({
    apiKey: "test",
    fetch: async (url, init) => {
      calls++;
      const response = await mock.fetch(url, init);
      response.headers.set("retry-after", "60");
      return response;
    },
  });
  await assert.rejects(client.customers.list(), NessieHttpError);
  assert.equal(calls, 1);
});

test("handles network errors without leaking the thrown error or replaying writes", async () => {
  let attempts = 0;
  const client = new NessieClient({
    apiKey: "secret",
    maxRetries: 1,
    fetch: async () => {
      attempts++;
      throw new Error("failed URL ?key=secret");
    },
  });
  await assert.rejects(client.customers.list(), (error: unknown) => {
    assert(error instanceof NessieNetworkError);
    assert(!inspect(error).includes("secret"));
    return true;
  });
  assert.equal(attempts, 2);
  attempts = 0;
  await assert.rejects(client.customers.create(customerCreate), NessieNetworkError);
  assert.equal(attempts, 1);
});

test("supports cancellation before dispatch and while waiting for fetch", async () => {
  const mock = mockFetch([]);
  const client = new NessieClient({ apiKey: "test", fetch: mock.fetch });
  const before = AbortSignal.abort("private caller reason");
  await assert.rejects(client.customers.list({ signal: before }), NessieAbortError);
  assert.equal(mock.calls.length, 0);
  const controller = new AbortController();
  const waiting = new NessieClient({
    apiKey: "test",
    fetch: async () => new Promise<Response>(() => {}),
  });
  const request = waiting.customers.list({ signal: controller.signal });
  controller.abort("private caller reason");
  await assert.rejects(request, NessieAbortError);
});

test("enforces the total timeout, including a stalled response body and retry backoff", async () => {
  const waiting = new NessieClient({
    apiKey: "test",
    timeoutMs: 20,
    fetch: async () => new Promise<Response>(() => {}),
  });
  await assert.rejects(waiting.customers.list(), NessieTimeoutError);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("["));
    },
  });
  const body = new NessieClient({
    apiKey: "test",
    timeoutMs: 20,
    fetch: async () => new Response(stream),
  });
  await assert.rejects(body.customers.list(), NessieTimeoutError);
  let attempts = 0;
  const retrying = new NessieClient({
    apiKey: "test",
    timeoutMs: 20,
    fetch: async () => {
      attempts++;
      return new Response("busy", { status: 429, headers: { "retry-after": "1" } });
    },
  });
  await assert.rejects(retrying.customers.list(), NessieTimeoutError);
  assert.equal(attempts, 1);
});

test("cancels retry backoff promptly", async () => {
  const controller = new AbortController();
  const client = new NessieClient({
    apiKey: "test",
    fetch: async () => {
      setTimeout(() => controller.abort(), 10);
      return new Response("busy", { status: 503, headers: { "retry-after": "10" } });
    },
  });
  await assert.rejects(client.customers.list({ signal: controller.signal }), NessieAbortError);
});
