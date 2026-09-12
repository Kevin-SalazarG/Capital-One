import { describe, expect, it, jest } from "@jest/globals";
import { MirrorApiError, MirrorTransportError } from "@mirror/api-client";
import type { LoginResult, MirrorClient } from "@mirror/api-client";
import { apiErrorMessage, describeApiError } from "../api/api-error";
import { decodeRefreshCredential, encodeRefreshCredential } from "./refresh-credential";
import type { RefreshCredentialStore } from "./refresh-credential";
import { createSessionController, SessionAccessError } from "./session-controller";

const environmentId = "http://127.0.0.1:3000";
const now = 1_800_000_000_000;

interface SyntheticRefreshStore {
  value: string | null;
  readonly read: ReturnType<typeof jest.fn<RefreshCredentialStore["read"]>>;
  readonly write: ReturnType<typeof jest.fn<RefreshCredentialStore["write"]>>;
  readonly remove: ReturnType<typeof jest.fn<RefreshCredentialStore["remove"]>>;
}

function sessionResult(suffix = "one", expiresAt = now / 1_000 + 3_600): LoginResult {
  return {
    accessToken: `synthetic-access-${suffix}`,
    refreshToken: `synthetic-refresh-${suffix}`,
    expiresAt,
    identity: {
      userId: "synthetic-user",
      sessionId: "synthetic-session",
      expiresAt,
    },
  };
}

function deferred<Value>(): {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
  readonly reject: (error: Error) => void;
} {
  let fulfill: ((value: Value) => void) | undefined;
  let fail: ((error: Error) => void) | undefined;
  const promise = new Promise<Value>((resolve, reject) => {
    fulfill = resolve;
    fail = reject;
  });
  return {
    promise,
    resolve: (value) => {
      if (!fulfill) throw new Error("Deferred value was not initialized.");
      fulfill(value);
    },
    reject: (error) => {
      if (!fail) throw new Error("Deferred error was not initialized.");
      fail(error);
    },
  };
}

function harness(initialCredential: string | null = null): {
  readonly controller: ReturnType<typeof createSessionController>;
  readonly client: {
    readonly login: ReturnType<typeof jest.fn<MirrorClient["login"]>>;
    readonly refreshSession: ReturnType<typeof jest.fn<MirrorClient["refreshSession"]>>;
    readonly logout: ReturnType<typeof jest.fn<MirrorClient["logout"]>>;
  };
  readonly store: SyntheticRefreshStore;
  readonly onIdentityChange: ReturnType<typeof jest.fn<() => Promise<void>>>;
} {
  const client = {
    login: jest.fn<MirrorClient["login"]>().mockResolvedValue(sessionResult()),
    refreshSession: jest
      .fn<MirrorClient["refreshSession"]>()
      .mockResolvedValue(sessionResult("two")),
    logout: jest.fn<MirrorClient["logout"]>().mockResolvedValue({ success: true }),
  };
  const store: SyntheticRefreshStore = {
    value: initialCredential,
    read: jest.fn<RefreshCredentialStore["read"]>(async () => store.value),
    write: jest.fn<RefreshCredentialStore["write"]>(async (value) => {
      store.value = value;
    }),
    remove: jest.fn<RefreshCredentialStore["remove"]>(async () => {
      store.value = null;
    }),
  };
  const onIdentityChange = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const controller = createSessionController({
    client,
    store,
    environmentId,
    now: () => now,
    onIdentityChange,
  });
  return { controller, client, store, onIdentityChange };
}

describe("session controller", () => {
  it("starts without authorization and restores an empty store as signed out", async () => {
    const { controller, client } = harness();
    expect(controller.getSnapshot()).toEqual({ status: "restoring" });
    expect(controller.getAccessToken()).toBeUndefined();
    await controller.restore();
    expect(controller.getSnapshot()).toMatchObject({ status: "signed-out", reason: "initial" });
    expect(client.refreshSession).not.toHaveBeenCalled();
    await expect(controller.ensureAccess()).rejects.toBeInstanceOf(SessionAccessError);
  });

  it.each([
    "not-json",
    JSON.stringify({ version: 1, environmentId, refreshToken: 42 }),
    JSON.stringify({ version: 2, environmentId, refreshToken: "synthetic-refresh" }),
    JSON.stringify({
      version: 1,
      environmentId,
      refreshToken: "synthetic-refresh",
      accessToken: "extra",
    }),
    encodeRefreshCredential("https://other-environment.invalid", "synthetic-refresh"),
    "x".repeat(1_801),
  ])("rejects malformed or incorrectly scoped stored values before a request", async (value) => {
    const { controller, client, store } = harness(value);
    await controller.restore();
    expect(controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      reason: "invalid-storage",
    });
    expect(client.refreshSession).not.toHaveBeenCalled();
    expect(store.value).toBeNull();
  });

  it("stores only the scoped refresh credential and keeps access in memory", async () => {
    const { controller, store, onIdentityChange } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    expect(controller.getSnapshot()).toMatchObject({
      status: "authenticated",
      identity: sessionResult().identity,
    });
    expect(controller.getAccessToken()).toBe("synthetic-access-one");
    expect(store.value).toBe(encodeRefreshCredential(environmentId, "synthetic-refresh-one"));
    expect(store.value).not.toContain("accessToken");
    expect(onIdentityChange).toHaveBeenCalledTimes(1);
  });

  it("distinguishes a rejected credential from a transport outage", async () => {
    const invalid = harness();
    invalid.client.login.mockRejectedValue(
      new MirrorApiError(401, "UNAUTHORIZED", "test-request", "sensitive-payload"),
    );
    await invalid.controller.signIn("synthetic@example.invalid", "test-only-password");
    expect(invalid.controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      reason: "invalid",
    });
    const unavailable = harness();
    unavailable.client.login.mockRejectedValue(new MirrorTransportError("NETWORK_ERROR"));
    await unavailable.controller.signIn("synthetic@example.invalid", "test-only-password");
    expect(unavailable.controller.getSnapshot()).toMatchObject({
      status: "unavailable",
      reason: "network",
    });
    expect(JSON.stringify(unavailable.controller.getSnapshot())).not.toContain("sensitive-payload");
  });

  it("consumes persisted rotation credentials before dispatch and saves only the replacement", async () => {
    const { controller, client, store } = harness(
      encodeRefreshCredential(environmentId, "synthetic-refresh-one"),
    );
    client.refreshSession.mockImplementation(async () => {
      expect(store.value).toBeNull();
      expect(controller.getAccessToken()).toBeUndefined();
      return sessionResult("two");
    });
    await controller.restore();
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
    expect(store.value).toBe(encodeRefreshCredential(environmentId, "synthetic-refresh-two"));
    expect(controller.getSnapshot().status).toBe("authenticated");
  });

  it("serializes refresh calls and keeps the same cache scope for a verified identity", async () => {
    const { controller, client } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    const before = controller.getSnapshot();
    const response = deferred<LoginResult>();
    const dispatched = deferred<void>();
    client.refreshSession.mockImplementation(() => {
      dispatched.resolve();
      return response.promise;
    });
    const first = controller.refresh();
    const second = controller.refresh();
    expect(first).toBe(second);
    await dispatched.promise;
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
    response.resolve(sessionResult("two"));
    await Promise.all([first, second]);
    expect(controller.getSnapshot()).toEqual(before);
    expect(controller.getAccessToken()).toBe("synthetic-access-two");
  });

  it("renews access near expiry with one refresh shared by concurrent callers", async () => {
    const { controller, client } = harness();
    client.login.mockResolvedValue(sessionResult("one", now / 1_000 + 10));
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    await Promise.all([
      controller.ensureAccess(),
      controller.ensureAccess(),
      controller.ensureAccess(),
    ]);
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
    await controller.ensureAccess();
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
  });

  it("does not replay a possibly rotated token after a lost response or process restart", async () => {
    const { controller, client, store } = harness(
      encodeRefreshCredential(environmentId, "synthetic-refresh-one"),
    );
    client.refreshSession.mockRejectedValue(new MirrorTransportError("REQUEST_TIMEOUT"));
    await controller.restore();
    expect(controller.getSnapshot()).toMatchObject({
      status: "unavailable",
      reason: "rotation-uncertain",
      requiresSignIn: true,
    });
    expect(store.value).toBeNull();
    expect(controller.getAccessToken()).toBeUndefined();
    await controller.restore();
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
    const restarted = harness(store.value);
    await restarted.controller.restore();
    expect(restarted.client.refreshSession).not.toHaveBeenCalled();
  });

  it("has no recoverable credential while a rotation response is still pending", async () => {
    const { controller, client, store } = harness(
      encodeRefreshCredential(environmentId, "synthetic-refresh-one"),
    );
    const response = deferred<LoginResult>();
    const dispatched = deferred<void>();
    client.refreshSession.mockImplementation(() => {
      dispatched.resolve();
      return response.promise;
    });
    const restoring = controller.restore();
    await dispatched.promise;
    const restarted = harness(store.value);
    await restarted.controller.restore();
    expect(restarted.client.refreshSession).not.toHaveBeenCalled();
    response.reject(new MirrorTransportError("NETWORK_ERROR"));
    await restoring;
  });

  it("does not dispatch when secure storage cannot be read or consumed", async () => {
    for (const failure of ["read", "remove"] as const) {
      const { controller, client, store } = harness(
        encodeRefreshCredential(environmentId, "synthetic-refresh-one"),
      );
      store[failure].mockRejectedValueOnce(new Error("Device locked."));
      await controller.restore();
      expect(controller.getSnapshot()).toMatchObject({
        status: "unavailable",
        reason: "storage",
        requiresSignIn: false,
      });
      expect(client.refreshSession).not.toHaveBeenCalled();
      expect(store.value).not.toBeNull();
      await controller.restore();
      expect(controller.getSnapshot().status).toBe("authenticated");
    }
  });

  it("does not authenticate if saving a newly rotated credential fails", async () => {
    const { controller, store } = harness(
      encodeRefreshCredential(environmentId, "synthetic-refresh-one"),
    );
    store.write.mockRejectedValue(new Error("Secure storage unavailable."));
    await controller.restore();
    expect(controller.getSnapshot()).toMatchObject({
      status: "unavailable",
      reason: "storage",
      requiresSignIn: true,
    });
    expect(controller.getAccessToken()).toBeUndefined();
    expect(store.value).toBeNull();
  });

  it("removes a partial native write when secure persistence rejects after taking effect", async () => {
    const { controller, store } = harness();
    store.write.mockImplementation(async (value) => {
      store.value = value;
      throw new Error("Native write outcome is uncertain.");
    });
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    expect(controller.getSnapshot()).toMatchObject({ status: "unavailable", reason: "storage" });
    expect(controller.getAccessToken()).toBeUndefined();
    expect(store.value).toBeNull();
  });

  it("does not let an obsolete identity cleanup erase the next session credential", async () => {
    const { controller, store, onIdentityChange } = harness();
    const cleaning = deferred<void>();
    onIdentityChange.mockImplementationOnce(() => cleaning.promise);
    const obsolete = controller.signIn("synthetic@example.invalid", "test-only-password");
    await controller.signOut();
    await controller.signIn("different@example.invalid", "test-only-password");
    cleaning.resolve();
    await obsolete;
    expect(controller.getSnapshot().status).toBe("authenticated");
    expect(store.value).toBe(encodeRefreshCredential(environmentId, "synthetic-refresh-one"));
  });

  it("rejects a credential too large for the storage budget without an insecure fallback", async () => {
    const { controller, client, store } = harness();
    client.login.mockResolvedValue({ ...sessionResult(), refreshToken: "x".repeat(2_000) });
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    expect(controller.getSnapshot()).toMatchObject({ status: "unavailable", reason: "storage" });
    expect(controller.getAccessToken()).toBeUndefined();
    expect(store.write).not.toHaveBeenCalled();
  });

  it("ignores a login response delivered after sign-out", async () => {
    const { controller, client, store } = harness();
    const response = deferred<LoginResult>();
    const dispatched = deferred<void>();
    client.login.mockImplementation(() => {
      dispatched.resolve();
      return response.promise;
    });
    const signingIn = controller.signIn("synthetic@example.invalid", "test-only-password");
    await dispatched.promise;
    await controller.signOut();
    response.resolve(sessionResult());
    await signingIn;
    expect(controller.getSnapshot()).toMatchObject({ status: "signed-out", reason: "explicit" });
    expect(controller.getAccessToken()).toBeUndefined();
    expect(store.value).toBeNull();
    expect(store.write).not.toHaveBeenCalled();
    expect(client.login.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it("clears a secure write that finishes after sign-out", async () => {
    const { controller, store } = harness();
    const writing = deferred<void>();
    const releaseWrite = deferred<void>();
    store.write.mockImplementation(async (value) => {
      writing.resolve();
      await releaseWrite.promise;
      store.value = value;
    });
    const signingIn = controller.signIn("synthetic@example.invalid", "test-only-password");
    await writing.promise;
    const signingOut = controller.signOut();
    releaseWrite.resolve();
    await Promise.all([signingIn, signingOut]);
    expect(store.value).toBeNull();
    expect(controller.getSnapshot().status).toBe("signed-out");
    expect(controller.getAccessToken()).toBeUndefined();
  });

  it("ignores old refresh results after a different sign-in", async () => {
    const { controller, client, store } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    const response = deferred<LoginResult>();
    const dispatched = deferred<void>();
    client.refreshSession.mockImplementation(() => {
      dispatched.resolve();
      return response.promise;
    });
    const refreshing = controller.refresh();
    await dispatched.promise;
    const nextSession = {
      ...sessionResult("next-user"),
      identity: {
        ...sessionResult().identity,
        userId: "different-user",
        sessionId: "different-session",
      },
    };
    client.login.mockResolvedValue(nextSession);
    await controller.signIn("different@example.invalid", "test-only-password");
    response.resolve(sessionResult("old-late"));
    await refreshing;
    expect(controller.getSnapshot()).toMatchObject({
      status: "authenticated",
      identity: nextSession.identity,
    });
    expect(controller.getAccessToken()).toBe(nextSession.accessToken);
    expect(store.value).toBe(encodeRefreshCredential(environmentId, nextSession.refreshToken));
  });

  it("clears local state even if remote logout fails and reports uncertain revocation", async () => {
    const { controller, client, store, onIdentityChange } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    client.logout.mockImplementation(async () => {
      expect(controller.getAccessToken()).toBe("synthetic-access-one");
      throw new MirrorTransportError("NETWORK_ERROR");
    });
    await controller.signOut();
    expect(controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      revocation: "unconfirmed",
      credentialCleared: true,
    });
    expect(controller.getAccessToken()).toBeUndefined();
    expect(store.value).toBeNull();
    expect(onIdentityChange).toHaveBeenCalledTimes(2);
  });

  it("distinguishes pending deletion from failure and publishes local cleanup before remote logout completes", async () => {
    const { controller, client, store } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    const deletionStarted = deferred<void>();
    const releaseDeletion = deferred<void>();
    const localCleanupPublished = deferred<void>();
    const revocation = deferred<{ readonly success: true }>();
    store.remove.mockImplementationOnce(async () => {
      deletionStarted.resolve();
      await releaseDeletion.promise;
      store.value = null;
    });
    client.logout.mockImplementationOnce(() => revocation.promise);
    const unsubscribe = controller.subscribe(() => {
      const state = controller.getSnapshot();
      if (
        state.status === "signed-out" &&
        state.credentialCleared === true &&
        state.revocation === "pending"
      )
        localCleanupPublished.resolve();
    });
    const signingOut = controller.signOut();
    expect(controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      credentialCleared: null,
      revocation: "pending",
    });
    expect(controller.getAccessToken()).toBeUndefined();
    await deletionStarted.promise;
    releaseDeletion.resolve();
    await localCleanupPublished.promise;
    expect(controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      credentialCleared: true,
      revocation: "pending",
    });
    expect(store.value).toBeNull();
    revocation.resolve({ success: true });
    await signingOut;
    expect(controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      credentialCleared: true,
      revocation: "confirmed",
    });
    unsubscribe();
  });

  it("reports a secure deletion failure separately from confirmed server revocation", async () => {
    const { controller, store } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    store.remove.mockRejectedValue(new Error("Device storage failure."));
    await controller.signOut();
    expect(controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      revocation: "confirmed",
      credentialCleared: false,
    });
    expect(controller.getAccessToken()).toBeUndefined();
  });

  it("clears a confirmed invalid current access token without replaying a request", async () => {
    const { controller, client, store } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    const snapshot = controller.getSnapshot();
    if (snapshot.status !== "authenticated") throw new Error("Expected a synthetic session.");
    await controller.rejectInvalidAccess(
      new MirrorApiError(401, "UNAUTHORIZED", "test-request", "redacted"),
      snapshot.scopeKey,
    );
    expect(controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      reason: "invalid",
      credentialCleared: true,
    });
    expect(controller.getAccessToken()).toBeUndefined();
    expect(store.value).toBeNull();
    expect(client.refreshSession).not.toHaveBeenCalled();
  });

  it("ignores late access rejection from an older session and rejects that query scope", async () => {
    const { controller, store } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    const previous = controller.getSnapshot();
    if (previous.status !== "authenticated") throw new Error("Expected a synthetic session.");
    await controller.signOut();
    await controller.signIn("different@example.invalid", "test-only-password");
    const current = controller.getSnapshot();
    await controller.rejectInvalidAccess(
      new MirrorApiError(401, "UNAUTHORIZED", "old-request", "redacted"),
      previous.scopeKey,
    );
    expect(controller.getSnapshot()).toEqual(current);
    expect(store.value).not.toBeNull();
    await expect(controller.ensureAccess(previous.scopeKey)).rejects.toBeInstanceOf(
      SessionAccessError,
    );
  });

  it("does not revoke a session because one object is forbidden", async () => {
    const { controller } = harness();
    await controller.signIn("synthetic@example.invalid", "test-only-password");
    const snapshot = controller.getSnapshot();
    if (snapshot.status !== "authenticated") throw new Error("Expected a synthetic session.");
    await controller.rejectInvalidAccess(
      new MirrorApiError(403, "FORBIDDEN", "test-request", "redacted"),
      snapshot.scopeKey,
    );
    expect(controller.getSnapshot()).toEqual(snapshot);
  });

  it("rejects an expired response and a refresh that changes authenticated identity", async () => {
    const expired = harness();
    expired.client.login.mockResolvedValue(sessionResult("expired", now / 1_000));
    await expired.controller.signIn("synthetic@example.invalid", "test-only-password");
    expect(expired.controller.getSnapshot()).toMatchObject({
      status: "unavailable",
      reason: "response-invalid",
    });
    const changed = harness();
    await changed.controller.signIn("synthetic@example.invalid", "test-only-password");
    changed.client.refreshSession.mockResolvedValue({
      ...sessionResult("wrong-user"),
      identity: { ...sessionResult().identity, userId: "different-user" },
    });
    await changed.controller.refresh();
    expect(changed.controller.getSnapshot()).toMatchObject({
      status: "unavailable",
      requiresSignIn: true,
    });
    expect(changed.controller.getAccessToken()).toBeUndefined();
  });
});

describe("safe API errors and persisted credentials", () => {
  it("keeps raw provider messages out of user-facing errors", () => {
    const error = new MirrorApiError(
      503,
      "AUTH_UNAVAILABLE",
      "synthetic-request",
      "secret-data-token-and-url",
    );
    expect(apiErrorMessage(error)).not.toContain("secret-data");
    expect(describeApiError(error).kind).toBe("unavailable");
    expect(describeApiError(new MirrorTransportError("RESPONSE_NOT_JSON")).kind).toBe(
      "invalid-response",
    );
    expect(describeApiError(new MirrorTransportError("REQUEST_ABORTED")).kind).toBe("cancelled");
  });

  it("validates a restored credential without trusting additional stored identity", () => {
    expect(
      decodeRefreshCredential(
        encodeRefreshCredential(environmentId, "synthetic-refresh"),
        environmentId,
      ),
    ).toEqual({ version: 1, environmentId, refreshToken: "synthetic-refresh" });
    expect(
      decodeRefreshCredential(
        JSON.stringify({
          version: 1,
          environmentId,
          refreshToken: "synthetic-refresh",
          userId: "pretend-authorized",
        }),
        environmentId,
      ),
    ).toBeNull();
  });
});
