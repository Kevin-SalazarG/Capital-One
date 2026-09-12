import { MirrorApiError } from "@mirror/api-client";
import type { GetSessionResult, LoginResult, MirrorClient } from "@mirror/api-client";
import { describeApiError } from "../api/api-error";
import { decodeRefreshCredential, encodeRefreshCredential } from "./refresh-credential";
import type { RefreshCredentialStore } from "./refresh-credential";

export type SessionState =
  | { readonly status: "restoring" | "signing-in" }
  | {
      readonly status: "authenticated";
      readonly identity: GetSessionResult;
      readonly scopeKey: string;
    }
  | {
      readonly status: "unavailable";
      readonly reason: "network" | "response-invalid" | "storage" | "rotation-uncertain";
      readonly message: string;
      readonly requiresSignIn: boolean;
    }
  | {
      readonly status: "signed-out";
      readonly reason: "initial" | "invalid" | "explicit" | "invalid-storage";
      readonly revocation: "not-requested" | "pending" | "confirmed" | "unconfirmed";
      readonly credentialCleared: boolean | null;
    };

export interface SessionControllerOptions {
  readonly client: Pick<MirrorClient, "login" | "refreshSession" | "logout">;
  readonly store: RefreshCredentialStore;
  readonly environmentId: string;
  readonly now?: () => number;
  readonly onIdentityChange: () => Promise<void>;
}

export class SessionAccessError extends Error {
  constructor() {
    super("No hay una sesión verificada disponible.");
    this.name = "SessionAccessError";
  }
}

class SessionStorageError extends Error {}
class SessionResponseError extends Error {}

interface SessionAttempt {
  readonly generation: number;
  readonly abort: AbortController;
}

export class SessionController {
  private state: SessionState = { status: "restoring" };
  private readonly listeners = new Set<() => void>();
  private accessToken: string | undefined;
  private expiresAt = 0;
  private generation = 0;
  private abort: AbortController | undefined;
  private pending: Promise<void> | undefined;
  private storageTail: Promise<void> = Promise.resolve();

  constructor(private readonly options: SessionControllerOptions) {}

  readonly getSnapshot = (): SessionState => this.state;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getAccessToken = (): string | undefined => this.accessToken;

  restore(): Promise<void> {
    if (this.pending) return this.pending;
    if (
      this.state.status !== "restoring" &&
      !(this.state.status === "unavailable" && !this.state.requiresSignIn)
    )
      return Promise.resolve();
    const attempt = this.begin({ status: "restoring" });
    return this.track(this.restoreCredential(attempt), attempt);
  }

  signIn(email: string, password: string): Promise<void> {
    if (this.state.status === "signing-in" && this.pending) return this.pending;
    const attempt = this.begin({ status: "signing-in" });
    return this.track(this.login(email, password, attempt), attempt);
  }

  refresh(): Promise<void> {
    if (this.pending) return this.pending;
    if (this.state.status !== "authenticated") return Promise.resolve();
    const attempt: SessionAttempt = { generation: this.generation, abort: new AbortController() };
    this.abort = attempt.abort;
    return this.track(this.restoreCredential(attempt, this.state.identity), attempt);
  }

  async ensureAccess(expectedScopeKey?: string): Promise<void> {
    if (this.pending) await this.pending;
    const now = (this.options.now ?? Date.now)();
    if (this.state.status === "authenticated" && this.expiresAt * 1_000 <= now + 30_000)
      await this.refresh();
    if (
      this.state.status !== "authenticated" ||
      !this.accessToken ||
      (expectedScopeKey !== undefined && this.state.scopeKey !== expectedScopeKey)
    )
      throw new SessionAccessError();
  }

  async rejectInvalidAccess(error: unknown, scopeKey: string): Promise<void> {
    if (
      !(error instanceof MirrorApiError) ||
      error.status !== 401 ||
      this.state.status !== "authenticated" ||
      this.state.scopeKey !== scopeKey
    )
      return;
    const attempt = this.begin({
      status: "signed-out",
      reason: "invalid",
      revocation: "not-requested",
      credentialCleared: null,
    });
    await this.options.onIdentityChange();
    let credentialCleared = true;
    try {
      await this.storage(async () => {
        if (this.current(attempt)) await this.options.store.remove();
      });
    } catch {
      credentialCleared = false;
    }
    if (this.current(attempt))
      this.publish({
        status: "signed-out",
        reason: "invalid",
        revocation: "not-requested",
        credentialCleared,
      });
  }

  async signOut(): Promise<void> {
    // The generated transport captures the access header synchronously before
    // its first await. Local state can then clear without delaying server logout.
    const hasAccessToken = this.accessToken !== undefined;
    const revocation = hasAccessToken
      ? this.options.client.logout({ timeoutMs: 10_000 }).then(
          () => "confirmed" as const,
          () => "unconfirmed" as const,
        )
      : Promise.resolve("unconfirmed" as const);
    const attempt = this.begin({
      status: "signed-out",
      reason: "explicit",
      revocation: hasAccessToken ? "pending" : "unconfirmed",
      credentialCleared: null,
    });
    const clearing = this.options.onIdentityChange();
    let credentialCleared = true;
    try {
      await this.storage(() => this.options.store.remove());
    } catch {
      credentialCleared = false;
    }
    if (this.current(attempt))
      this.publish({
        status: "signed-out",
        reason: "explicit",
        revocation: hasAccessToken ? "pending" : "unconfirmed",
        credentialCleared,
      });
    const result = await revocation;
    await clearing;
    if (this.current(attempt))
      this.publish({
        status: "signed-out",
        reason: "explicit",
        revocation: result,
        credentialCleared,
      });
  }

  private begin(state: SessionState): SessionAttempt {
    this.generation += 1;
    this.abort?.abort();
    const abort = new AbortController();
    this.abort = abort;
    this.pending = undefined;
    this.accessToken = undefined;
    this.expiresAt = 0;
    this.publish(state);
    return { generation: this.generation, abort };
  }

  private track(work: Promise<void>, attempt: SessionAttempt): Promise<void> {
    const tracked = work.finally(() => {
      if (this.current(attempt)) this.pending = undefined;
    });
    this.pending = tracked;
    return tracked;
  }

  private async login(email: string, password: string, attempt: SessionAttempt): Promise<void> {
    try {
      await this.options.onIdentityChange();
      if (!this.current(attempt)) return;
      await this.storage(async () => {
        if (this.current(attempt)) await this.options.store.remove();
      });
      if (!this.current(attempt)) return;
      const result = await this.options.client.login(
        { email, password },
        { signal: attempt.abort.signal, timeoutMs: 10_000 },
      );
      await this.accept(result, attempt);
    } catch (error: unknown) {
      await this.fail(error, attempt, false);
    }
  }

  private async restoreCredential(
    attempt: SessionAttempt,
    expectedIdentity?: GetSessionResult,
  ): Promise<void> {
    let dispatched = false;
    try {
      if (!expectedIdentity) await this.options.onIdentityChange();
      const value = await this.storage(() => this.options.store.read());
      if (!this.current(attempt)) return;
      if (value === null) {
        this.accessToken = undefined;
        this.publish({
          status: "signed-out",
          reason: expectedIdentity ? "invalid" : "initial",
          revocation: "not-requested",
          credentialCleared: true,
        });
        if (expectedIdentity) await this.options.onIdentityChange();
        return;
      }
      const credential = decodeRefreshCredential(value, this.options.environmentId);
      // Deleting before dispatch makes process death or a lost response require
      // fresh sign-in, instead of replaying a possibly consumed rotation token.
      await this.storage(async () => {
        if (this.current(attempt)) await this.options.store.remove();
      });
      if (!this.current(attempt)) return;
      if (!credential) {
        this.accessToken = undefined;
        this.publish({
          status: "signed-out",
          reason: "invalid-storage",
          revocation: "not-requested",
          credentialCleared: true,
        });
        if (expectedIdentity) await this.options.onIdentityChange();
        return;
      }
      dispatched = true;
      const result = await this.options.client.refreshSession(
        { refreshToken: credential.refreshToken },
        { signal: attempt.abort.signal, timeoutMs: 10_000 },
      );
      if (
        expectedIdentity &&
        (expectedIdentity.userId !== result.identity.userId ||
          expectedIdentity.sessionId !== result.identity.sessionId)
      )
        throw new SessionResponseError();
      await this.accept(result, attempt);
    } catch (error: unknown) {
      await this.fail(error, attempt, dispatched);
    }
  }

  private async accept(result: LoginResult, attempt: SessionAttempt): Promise<void> {
    if (!this.current(attempt)) return;
    if (
      !result.accessToken ||
      !result.identity.userId ||
      !result.identity.sessionId ||
      !Number.isFinite(result.expiresAt) ||
      result.expiresAt * 1_000 <= (this.options.now ?? Date.now)() ||
      result.identity.expiresAt !== result.expiresAt
    )
      throw new SessionResponseError();
    try {
      await this.storage(async () => {
        if (!this.current(attempt)) return;
        const value = encodeRefreshCredential(this.options.environmentId, result.refreshToken);
        await this.options.store.write(value);
      });
    } catch (error: unknown) {
      // A native rejection does not prove the write had no effect. Remove any
      // partial result while retaining the original storage failure for the UI.
      await this.storage(async () => {
        if (this.current(attempt)) await this.options.store.remove();
      }).catch(() => undefined);
      throw error;
    }
    if (!this.current(attempt)) return;
    this.accessToken = result.accessToken;
    this.expiresAt = result.expiresAt;
    this.publish({
      status: "authenticated",
      identity: result.identity,
      scopeKey: JSON.stringify([
        this.options.environmentId,
        result.identity.userId,
        result.identity.sessionId,
        this.generation,
      ]),
    });
  }

  private async fail(
    error: unknown,
    attempt: SessionAttempt,
    rotationDispatched: boolean,
  ): Promise<void> {
    if (!this.current(attempt)) return;
    this.accessToken = undefined;
    this.expiresAt = 0;
    await this.options.onIdentityChange();
    if (!this.current(attempt)) return;
    if (error instanceof MirrorApiError && error.status === 401) {
      this.publish({
        status: "signed-out",
        reason: "invalid",
        revocation: "not-requested",
        credentialCleared: true,
      });
      return;
    }
    if (error instanceof SessionStorageError) {
      this.publish({
        status: "unavailable",
        reason: "storage",
        message:
          "No pudimos acceder al almacenamiento seguro. Desbloquea el dispositivo e inténtalo de nuevo.",
        requiresSignIn: rotationDispatched || this.state.status === "signing-in",
      });
      return;
    }
    if (rotationDispatched) {
      this.publish({
        status: "unavailable",
        reason: "rotation-uncertain",
        message:
          "No pudimos confirmar la renovación. Inicia sesión nuevamente para recuperar el acceso.",
        requiresSignIn: true,
      });
      return;
    }
    const description = describeApiError(error);
    this.publish({
      status: "unavailable",
      reason:
        error instanceof SessionResponseError || description.kind === "invalid-response"
          ? "response-invalid"
          : "network",
      message:
        error instanceof SessionResponseError
          ? "No pudimos verificar la sesión recibida."
          : description.message,
      requiresSignIn: true,
    });
  }

  private storage<Result>(operation: () => Promise<Result>): Promise<Result> {
    const result = this.storageTail.then(operation).catch(() => {
      throw new SessionStorageError();
    });
    this.storageTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private current(attempt: SessionAttempt): boolean {
    return attempt.generation === this.generation && !attempt.abort.signal.aborted;
  }

  private publish(state: SessionState): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}

export function createSessionController(options: SessionControllerOptions): SessionController {
  return new SessionController(options);
}
