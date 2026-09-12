import { MirrorApiError, MirrorClient, MirrorTransportError } from "@mirror/api-client";
import type { ListBankMovementsResult } from "@mirror/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

const baseUrl = "https://mirror.synthetic.invalid";
const requestId = "44242f21-02aa-4a73-a8ab-d70b3efcc9e0";
const privateMarker = "synthetic-private-value";

async function failure(request: Promise<unknown>): Promise<MirrorApiError | MirrorTransportError> {
  try {
    await request;
  } catch (error: unknown) {
    if (error instanceof MirrorApiError || error instanceof MirrorTransportError) return error;
    throw error;
  }
  throw new Error("The request must reject with a public client error.");
}

describe("generated public client transport with synthetic fetch responses", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("preserves path/query/body arguments and captures the current authorization before yielding", async () => {
    const movements = {
      items: [],
      offset: 20,
      limit: 10,
      total: 0,
      planningVersion: 4,
      source: "replay",
      sourceSyncedAt: null,
    } satisfies ListBankMovementsResult;
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(movements))
      .mockResolvedValueOnce(Response.json({ success: true }));
    let token: string | undefined = "synthetic-current-access";
    const client = new MirrorClient({
      baseUrl: `${baseUrl}/`,
      fetch: transport,
      accessToken: () => token,
    });
    const controller = new AbortController();
    await expect(
      client.listBankMovements(
        "business/with space",
        { offset: "20", limit: "10" },
        { signal: controller.signal, timeoutMs: 1000 },
      ),
    ).resolves.toEqual(movements);
    const firstCall = transport.mock.calls[0];
    expect(String(firstCall?.[0])).toBe(
      `${baseUrl}/v1/businesses/business%2Fwith%20space/banking/movements?offset=20&limit=10`,
    );
    expect(firstCall?.[1]).toMatchObject({
      method: "GET",
      headers: { accept: "application/json", authorization: "Bearer synthetic-current-access" },
    });
    const logout = client.logout({ timeoutMs: 1000 });
    token = undefined;
    await logout;
    expect(transport.mock.calls[1]?.[1]?.headers).toMatchObject({
      authorization: "Bearer synthetic-current-access",
    });
  });

  it("serializes a validated write exactly once without changing its idempotency key", async () => {
    const transport = vi.fn<typeof fetch>().mockRejectedValue(new TypeError(privateMarker));
    const client = new MirrorClient({ baseUrl, fetch: transport });
    const body = {
      evaluationId: "synthetic-evaluation",
      alternativeId: "original",
      expectedVersion: 7,
      idempotencyKey: "synthetic_operation_key",
    };
    const error = await failure(client.confirmDecision("synthetic-business", body));
    expect(error).toMatchObject({ code: "NETWORK_ERROR" });
    expect(`${error.message}${JSON.stringify(error)}`).not.toContain(privateMarker);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  });

  it.each([200, 502])(
    "classifies a non-JSON %s response without retaining the body",
    async (status) => {
      const transport = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(`<html>${privateMarker}</html>`, {
          status,
          headers: { "x-request-id": requestId, "retry-after": "60" },
        }),
      );
      const error = await failure(new MirrorClient({ baseUrl, fetch: transport }).listBusinesses());
      expect(error).toMatchObject({
        code: "RESPONSE_NOT_JSON",
        status,
        requestId,
        retryAfterMs: 60000,
      });
      expect(`${error.message}${JSON.stringify(error)}`).not.toContain(privateMarker);
      expect(transport).toHaveBeenCalledTimes(1);
    },
  );

  it.each([200, 401])(
    "classifies a malformed %s response schema without retaining validation details",
    async (status) => {
      const transport = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ code: privateMarker, unexpected: privateMarker }, { status }),
        );
      const error = await failure(new MirrorClient({ baseUrl, fetch: transport }).getSession());
      expect(error).toMatchObject({ code: "RESPONSE_SCHEMA_INVALID", status });
      expect(`${error.message}${JSON.stringify(error)}`).not.toContain(privateMarker);
    },
  );

  it("preserves structured API errors, request IDs, and rate-limit delay without a retry", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { code: "RATE_LIMITED", message: "Wait before another request.", requestId },
          { status: 429, headers: { "retry-after": "60" } },
        ),
      );
    const error = await failure(new MirrorClient({ baseUrl, fetch: transport }).listBusinesses());
    expect(error).toBeInstanceOf(MirrorApiError);
    expect(error).toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      requestId,
      retryAfterMs: 60000,
      message: "Wait before another request.",
    });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["Sat, 12 Sep 2026 18:00:30 GMT", 30000],
    ["Sat, 12 Sep 2026 17:59:59 GMT", 0],
    ["invalid", undefined],
    ["-1", undefined],
    ["1.5", undefined],
    ["99999999999999999999", undefined],
    ["Mon, 31 Feb 2026 18:00:30 GMT", undefined],
  ])("normalizes Retry-After %s as milliseconds", async (header, expected) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-12T18:00:00.000Z"));
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { code: "UNAVAILABLE", message: "Unavailable.", requestId },
          { status: 503, headers: { "retry-after": header } },
        ),
      );
    const error = await failure(new MirrorClient({ baseUrl, fetch: transport }).listBusinesses());
    expect(error.retryAfterMs).toBe(expected);
  });

  it("rejects malformed input before sending and redacts request values", async () => {
    const transport = vi.fn<typeof fetch>();
    const client = new MirrorClient({ baseUrl, fetch: transport });
    const error = await failure(
      client.login({ email: `${privateMarker}@example.invalid`, password: "short" }),
    );
    expect(error).toMatchObject({ code: "REQUEST_SCHEMA_INVALID" });
    expect(`${error.message}${JSON.stringify(error)}`).not.toContain(privateMarker);
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([0, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2147483648])(
    "rejects an unsupported deadline %s before dispatch",
    async (timeoutMs) => {
      const transport = vi.fn<typeof fetch>();
      const error = await failure(
        new MirrorClient({ baseUrl, fetch: transport }).listBusinesses({ timeoutMs }),
      );
      expect(error).toMatchObject({ code: "REQUEST_OPTIONS_INVALID" });
      expect(transport).not.toHaveBeenCalled();
    },
  );

  it("rejects a pre-aborted request without sending it or exposing the abort reason", async () => {
    const transport = vi.fn<typeof fetch>();
    const controller = new AbortController();
    controller.abort(privateMarker);
    const error = await failure(
      new MirrorClient({ baseUrl, fetch: transport }).listBusinesses({ signal: controller.signal }),
    );
    expect(error).toMatchObject({ code: "REQUEST_ABORTED" });
    expect(`${error.message}${JSON.stringify(error)}`).not.toContain(privateMarker);
    expect(transport).not.toHaveBeenCalled();
  });

  it("settles cancellation even when fetch ignores the signal and removes its listener", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockImplementation(() => new Promise<Response>(() => undefined));
    const controller = new AbortController();
    const addListener = vi.spyOn(controller.signal, "addEventListener");
    const removeListener = vi.spyOn(controller.signal, "removeEventListener");
    const result = failure(
      new MirrorClient({ baseUrl, fetch: transport }).listBusinesses({
        signal: controller.signal,
        timeoutMs: 1000,
      }),
    );
    controller.abort(privateMarker);
    expect(await result).toMatchObject({ code: "REQUEST_ABORTED" });
    expect(transport.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(removeListener.mock.calls[0]?.[0]).toBe("abort");
    expect(removeListener.mock.calls[0]?.[1]).toBe(addListener.mock.calls[0]?.[1]);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("enforces the default deadline, lets a request override it, and clears the timer", async () => {
    vi.useFakeTimers();
    const transport = vi
      .fn<typeof fetch>()
      .mockImplementation(() => new Promise<Response>(() => undefined));
    const client = new MirrorClient({ baseUrl, fetch: transport, timeoutMs: 100 });
    const result = failure(client.listBusinesses({ timeoutMs: 250 }));
    await vi.advanceTimersByTimeAsync(100);
    expect(transport.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(150);
    expect(await result).toMatchObject({ code: "REQUEST_TIMEOUT" });
    expect(transport.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    const defaultResult = failure(client.listBusinesses());
    await vi.advanceTimersByTimeAsync(100);
    expect(await defaultResult).toMatchObject({ code: "REQUEST_TIMEOUT" });
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("keeps the deadline active while reading a body after headers arrive", async () => {
    vi.useFakeTimers();
    const body = new ReadableStream<Uint8Array>();
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
    const result = failure(
      new MirrorClient({ baseUrl, fetch: transport }).listBusinesses({ timeoutMs: 50 }),
    );
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toMatchObject({ code: "REQUEST_TIMEOUT" });
    expect(transport.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("classifies interrupted response bodies safely and cleans up successful requests", async () => {
    vi.useFakeTimers();
    const body = new ReadableStream<Uint8Array>({
      start(controller): void {
        controller.error(new Error(privateMarker));
      },
    });
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(body, { status: 200, headers: { "x-request-id": requestId } }),
      )
      .mockResolvedValueOnce(Response.json([]));
    const client = new MirrorClient({ baseUrl, fetch: transport, timeoutMs: 100 });
    const error = await failure(client.listBusinesses());
    expect(error).toMatchObject({ code: "NETWORK_ERROR", status: 200, requestId });
    expect(`${error.message}${JSON.stringify(error)}`).not.toContain(privateMarker);
    expect(vi.getTimerCount()).toBe(0);
    await expect(client.listBusinesses()).resolves.toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
