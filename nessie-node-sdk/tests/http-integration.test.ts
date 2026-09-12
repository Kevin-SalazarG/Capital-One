import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { test } from "node:test";
import { NessieClient, NessieNetworkError, NessieTimeoutError } from "../src/nessie.js";
import { customer, customerCreate } from "./fixtures.js";

async function withServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address !== null && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("native fetch works against a real HTTP server for reads and JSON writes", async () => {
  await withServer(
    (request, response) => {
      assert.equal(
        new URL(request.url ?? "/", "http://local").searchParams.get("key"),
        "local-key",
      );
      response.setHeader("content-type", "application/json");
      if (request.method === "POST") {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk: string) => {
          body += chunk;
        });
        request.on("end", () => {
          assert.equal(body, JSON.stringify(customerCreate));
          response
            .writeHead(201)
            .end(JSON.stringify({ code: 201, message: "Created", objectCreated: customer }));
        });
      } else response.end(JSON.stringify([customer]));
    },
    async (baseUrl) => {
      const client = new NessieClient({ apiKey: "local-key", baseUrl });
      assert.deepEqual(await client.customers.list(), [customer]);
      assert.deepEqual(await client.customers.create(customerCreate), {
        code: 201,
        message: "Created",
        objectCreated: customer,
      });
    },
  );
});

test("native fetch aborts stalled bodies", async () => {
  await withServer(
    (_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.write("[");
    },
    async (baseUrl) => {
      const client = new NessieClient({ apiKey: "local-key", baseUrl, timeoutMs: 30 });
      await assert.rejects(client.customers.list(), NessieTimeoutError);
    },
  );
});

test("native fetch never forwards credentials to a redirect target", async () => {
  let targetCalls = 0;
  await withServer(
    (_request, response) => {
      targetCalls++;
      response.end("unexpected");
    },
    async (target) => {
      await withServer(
        (_request, response) => {
          response.writeHead(302, { location: `${target}/customers?key=local-key` }).end();
        },
        async (baseUrl) => {
          const client = new NessieClient({ apiKey: "local-key", baseUrl, maxRetries: 0 });
          await assert.rejects(client.customers.list(), NessieNetworkError);
        },
      );
    },
  );
  assert.equal(targetCalls, 0);
});
