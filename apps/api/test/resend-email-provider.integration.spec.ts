import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { AppError } from "../src/common/errors/app-error";
import type { EmailDeliveryConfig } from "../src/modules/notifications/email-delivery.port";
import { ResendEmailProvider } from "../src/modules/notifications/resend-email.provider";

const message = {
  to: "owner@example.com",
  subject: "Aviso de caja",
  text: "Hay un faltante proyectado.",
};
const originalFetch = globalThis.fetch;

function createConfig(apiKey?: string): EmailDeliveryConfig {
  const values = new Map<string, string | number>([
    ["RESEND_FROM_EMAIL", "Colchón <alerts@example.com>"],
    ["RESEND_TIMEOUT_MS", 1000],
  ]);
  if (apiKey) values.set("RESEND_API_KEY", apiKey);
  return {
    get<T>(key: string): T | undefined {
      return values.get(key) as T | undefined;
    },
    getOrThrow<T>(key: string): T {
      const value = values.get(key);
      if (value === undefined) throw new Error(`Missing test config: ${key}`);
      return value as T;
    },
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("sends a plain-text message through the Resend API", async () => {
  const calls: Array<{ readonly url: string; readonly init?: RequestInit }> =
    [];
  globalThis.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    calls.push({
      url: typeof input === "string" ? input : input.toString(),
      ...(init ? { init } : {}),
    });
    return new Response(JSON.stringify({ id: "email_123" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const provider = new ResendEmailProvider(createConfig("re_test"));

  const result = await provider.send(message);

  assert.deepEqual(result, { id: "email_123" });
  assert.equal(calls[0]?.url, "https://api.resend.com/emails");
  assert.deepEqual(calls[0]?.init?.headers, {
    Accept: "application/json",
    Authorization: "Bearer re_test",
    "Content-Type": "application/json",
  });
  assert.equal(
    calls[0]?.init?.body,
    JSON.stringify({
      from: "Colchón <alerts@example.com>",
      to: ["owner@example.com"],
      subject: "Aviso de caja",
      text: "Hay un faltante proyectado.",
    }),
  );
});

test("fails safely when the server has no Resend key", async () => {
  let calls = 0;
  globalThis.fetch = async (): Promise<Response> => {
    calls += 1;
    return new Response();
  };
  const provider = new ResendEmailProvider(createConfig());

  await assert.rejects(provider.send(message), (error: unknown) => {
    return (
      error instanceof AppError &&
      error.code === "EMAIL_DELIVERY_UNAVAILABLE" &&
      error.status === 503
    );
  });
  assert.equal(calls, 0);
});
