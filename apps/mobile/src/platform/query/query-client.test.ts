import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MirrorApiError, MirrorTransportError } from "@mirror/api-client";
import { onlineManager } from "@tanstack/react-query";
import { createQueryClient, readRetryDelay, shouldRetryRead } from "./query-client";

function apiFailure(status: number, retryAfterMs?: number): MirrorApiError {
  return new MirrorApiError(
    status,
    "SYNTHETIC_FAILURE",
    "synthetic-request",
    "redacted",
    retryAfterMs,
  );
}

describe("read retry policy", () => {
  it.each([502, 503, 504])("permits one extra read for transient status %s", (status) => {
    expect(shouldRetryRead(0, apiFailure(status))).toBe(true);
    expect(shouldRetryRead(1, apiFailure(status))).toBe(false);
  });

  it.each([400, 401, 403, 404, 409, 422, 429, 500])(
    "does not retry status %s, including an unreadable error body",
    (status) => {
      expect(shouldRetryRead(0, apiFailure(status))).toBe(false);
      expect(shouldRetryRead(0, new MirrorTransportError("NETWORK_ERROR", status))).toBe(false);
    },
  );

  it("retries network loss or timeout once without replaying cancellations or invalid responses", () => {
    expect(shouldRetryRead(0, new MirrorTransportError("NETWORK_ERROR"))).toBe(true);
    expect(shouldRetryRead(0, new MirrorTransportError("REQUEST_TIMEOUT"))).toBe(true);
    expect(shouldRetryRead(0, new MirrorTransportError("NETWORK_ERROR", 200))).toBe(true);
    expect(shouldRetryRead(1, new MirrorTransportError("NETWORK_ERROR"))).toBe(false);
    expect(shouldRetryRead(0, new MirrorTransportError("REQUEST_ABORTED"))).toBe(false);
    expect(shouldRetryRead(0, new MirrorTransportError("RESPONSE_SCHEMA_INVALID"))).toBe(false);
    expect(shouldRetryRead(0, new MirrorTransportError("RESPONSE_NOT_JSON", 503))).toBe(false);
    expect(shouldRetryRead(0, new Error("Unclassified error."))).toBe(false);
  });

  it("honors server delays, including zero, for both API and transport errors", () => {
    expect(readRetryDelay(0, apiFailure(503, 8_000))).toBe(8_000);
    expect(readRetryDelay(0, apiFailure(503, 0))).toBe(0);
    expect(
      readRetryDelay(
        0,
        new MirrorTransportError("NETWORK_ERROR", 503, "synthetic-request", 12_000),
      ),
    ).toBe(12_000);
    expect(readRetryDelay(0, new MirrorTransportError("NETWORK_ERROR"))).toBe(1_000);
    expect(readRetryDelay(0, apiFailure(503, Number.NaN))).toBe(1_000);
    expect(readRetryDelay(0, apiFailure(503, -1))).toBe(1_000);
  });

  it("declines an automatic retry when its delay would overflow native timers", () => {
    expect(shouldRetryRead(0, apiFailure(503, 2_147_483_648))).toBe(false);
    expect(shouldRetryRead(0, apiFailure(503, 2_147_483_647))).toBe(true);
  });
});

describe("query client retry behavior", () => {
  let previouslyOnline = true;
  beforeEach(() => {
    previouslyOnline = onlineManager.isOnline();
    jest.useFakeTimers();
  });
  afterEach(() => {
    onlineManager.setOnline(previouslyOnline);
    jest.useRealTimers();
  });

  it("can read an approved local API when the device reports no internet", async () => {
    onlineManager.setOnline(false);
    const client = createQueryClient({ allowLocalReads: true });
    const read = jest.fn<() => Promise<string>>().mockResolvedValue("synthetic-local-response");
    await expect(
      client.fetchQuery({ queryKey: ["synthetic-local", "dashboard"], queryFn: read }),
    ).resolves.toBe("synthetic-local-response");
    expect(read).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(["synthetic-local", "dashboard"])?.fetchStatus).toBe("idle");
    client.clear();
  });

  it("keeps remote reads paused until connectivity returns by default", async () => {
    onlineManager.setOnline(false);
    const client = createQueryClient();
    client.mount();
    const read = jest.fn<() => Promise<string>>().mockResolvedValue("synthetic-remote-response");
    const result = client.fetchQuery({
      queryKey: ["synthetic-remote", "dashboard"],
      queryFn: read,
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(read).not.toHaveBeenCalled();
    expect(client.getQueryState(["synthetic-remote", "dashboard"])?.fetchStatus).toBe("paused");
    onlineManager.setOnline(true);
    await expect(result).resolves.toBe("synthetic-remote-response");
    expect(read).toHaveBeenCalledTimes(1);
    client.unmount();
    client.clear();
  });

  it("waits for Retry-After before its single automatic retry", async () => {
    const client = createQueryClient();
    const read = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(apiFailure(503, 5_000))
      .mockResolvedValue("synthetic-response");
    const result = client.fetchQuery({ queryKey: ["synthetic", "dashboard"], queryFn: read });
    await jest.advanceTimersByTimeAsync(4_999);
    expect(read).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe("synthetic-response");
    expect(read).toHaveBeenCalledTimes(2);
    client.clear();
  });

  it("stops after one extra failed read and never retries a financial mutation", async () => {
    const client = createQueryClient();
    const error = apiFailure(503, 1_000);
    const read = jest.fn<() => Promise<string>>().mockRejectedValue(error);
    const result = client.fetchQuery({ queryKey: ["synthetic", "dashboard"], queryFn: read });
    const readFailure = expect(result).rejects.toBe(error);
    await jest.advanceTimersByTimeAsync(5_000);
    await readFailure;
    expect(read).toHaveBeenCalledTimes(2);
    const write = jest.fn<() => Promise<void>>().mockRejectedValue(error);
    const mutation = client
      .getMutationCache()
      .build(client, { mutationKey: ["synthetic", "confirmation"], mutationFn: write });
    await expect(mutation.execute(undefined)).rejects.toBe(error);
    await jest.advanceTimersByTimeAsync(5_000);
    expect(write).toHaveBeenCalledTimes(1);
    expect(mutation.state.isPaused).toBe(false);
    client.clear();
  });
});
