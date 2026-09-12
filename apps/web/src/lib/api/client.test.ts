import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

function ok(data: unknown) {
  return new Response(
    JSON.stringify({ data, meta: { requestId: "test-request" } }),
    { status: 200 },
  );
}
function fail(status: number, code: string) {
  return new Response(
    JSON.stringify({ error: { code }, meta: { requestId: "test-request" } }),
    { status },
  );
}
afterEach(() => vi.unstubAllGlobals());
describe("API client", () => {
  it("uses HttpOnly-cookie transport and keeps the envelope out of UI data", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ id: "record" }));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      apiRequest("/example", z.object({ id: z.string() })),
    ).resolves.toEqual({ id: "record" });
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      credentials: "include",
      cache: "no-store",
    });
  });
  it("renews an expired session once and retries", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(fail(401, "UNAUTHENTICATED"))
      .mockResolvedValueOnce(ok({ refreshed: true }))
      .mockResolvedValueOnce(ok({ id: "record" }));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      apiRequest("/example", z.object({ id: z.string() })),
    ).resolves.toEqual({ id: "record" });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[1]?.[0]).toMatch(/\/auth\/refresh$/);
  });
  it("stops when refresh fails", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(fail(401, "UNAUTHENTICATED"))
      .mockResolvedValueOnce(fail(401, "AUTH_SESSION_INVALID"));
    vi.stubGlobal("fetch", fetcher);
    await expect(apiRequest("/example", z.unknown())).rejects.toMatchObject({
      code: "AUTH_SESSION_INVALID",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("never retries failed writes automatically and preserves support IDs", async () => {
    const fetcher = vi.fn().mockResolvedValue(fail(500, "INTERNAL_ERROR"));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      apiRequest("/example", z.unknown(), {
        method: "POST",
        body: { name: "example" },
      }),
    ).rejects.toMatchObject({ status: 500, requestId: "test-request" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ id: 123 })));
    await expect(
      apiRequest("/example", z.object({ id: z.string() })),
    ).rejects.toMatchObject({ code: "RESPONSE_INVALID" });
  });
  it("does not refresh invalid sign-in credentials", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(fail(401, "AUTH_INVALID_CREDENTIALS"));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      apiRequest("/auth/sign-in", z.unknown(), { method: "POST" }),
    ).rejects.toMatchObject({ code: "AUTH_INVALID_CREDENTIALS" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("passes caller cancellation without showing a network failure", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(controller.signal.reason));
    await expect(
      apiRequest("/example", z.unknown(), { signal: controller.signal }),
    ).rejects.toBe(controller.signal.reason);
  });
});
