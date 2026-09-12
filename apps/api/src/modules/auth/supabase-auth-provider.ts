import { Inject, Injectable, Optional } from "@nestjs/common";
import { createClient, isAuthRetryableFetchError } from "@supabase/supabase-js";
import type { AuthError, Session, SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";
import { APP_CONFIG } from "../../config/app-config.js";
import type { AppConfig } from "../../config/app-config.js";
import { DatabaseService } from "../../platform/database/database.service.js";
import { ApiError } from "../../platform/http/api-error.js";
import { AuthProvider } from "./auth-provider.js";
import { identitySchema, sessionSchema } from "./auth-schemas.js";
import type { Identity, LoginInput, SessionResult } from "./auth-schemas.js";

const claimsSchema = v.object({
  sub: v.string(),
  session_id: v.string(),
  exp: v.number(),
  iss: v.string(),
  aud: v.literal("authenticated"),
});

export const AUTH_OPERATION_TIMEOUT_MS = Symbol("AUTH_OPERATION_TIMEOUT_MS");

@Injectable()
export class SupabaseAuthProvider extends AuthProvider {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Optional() @Inject(AUTH_OPERATION_TIMEOUT_MS) private readonly operationTimeoutMs = 10_000,
  ) {
    super();
    if (
      !Number.isSafeInteger(operationTimeoutMs) ||
      operationTimeoutMs < 1 ||
      operationTimeoutMs > 10_000
    ) {
      throw new Error("Auth operation timeout must be between 1 and 10000 milliseconds.");
    }
  }

  private client(signal: AbortSignal): SupabaseClient {
    return createClient(this.config.SUPABASE_URL, this.config.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input, init) => authFetch(input, init, signal),
      },
    });
  }

  override async login(input: LoginInput): Promise<SessionResult> {
    return this.operation(async (client) => {
      const { data, error } = await client.auth.signInWithPassword(input);
      if (error) throw providerFailure(error);
      if (!data.session) throw unauthorized();
      return this.session(data.session, client);
    });
  }

  override async refresh(refreshToken: string): Promise<SessionResult> {
    return this.operation(async (client) => {
      const { data, error } = await client.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (error) throw providerFailure(error);
      if (!data.session) throw unauthorized();
      return this.session(data.session, client);
    });
  }

  override async verify(accessToken: string): Promise<Identity> {
    return this.operation((client) => this.verifyWithClient(accessToken, client));
  }

  private async verifyWithClient(accessToken: string, client: SupabaseClient): Promise<Identity> {
    const { data, error } = await client.auth.getClaims(accessToken);
    const parsed = v.safeParse(claimsSchema, data?.claims);
    if (error) throw providerFailure(error);
    if (!parsed.success) throw unauthorized();
    const claims = parsed.output;
    if (
      claims.iss !== `${this.config.SUPABASE_URL.replace(/\/$/, "")}/auth/v1` ||
      claims.exp * 1000 <= Date.now()
    )
      throw unauthorized();
    const user = await client.auth.getUser(accessToken);
    if (user.error) throw providerFailure(user.error);
    if (user.data.user?.id !== claims.sub) throw unauthorized();
    const identity = v.parse(identitySchema, {
      userId: claims.sub,
      sessionId: claims.session_id,
      expiresAt: claims.exp,
    });
    if (!(await this.database.isSessionActive(identity.userId, identity.sessionId)))
      throw unauthorized();
    return identity;
  }

  override async logout(accessToken: string): Promise<void> {
    return this.operation(async (client) => {
      const identity = await this.verifyWithClient(accessToken, client);
      await this.database.revokeSession(
        identity.userId,
        identity.sessionId,
        new Date(identity.expiresAt * 1000),
      );
      try {
        const result = await client.auth.admin.signOut(accessToken, "local");
        if (result.error) throw result.error;
      } catch {
        throw new ApiError(
          "AUTH_LOGOUT_INCOMPLETE",
          "La sesión está bloqueada en Mirror; no se pudo cerrar en el proveedor.",
          503,
        );
      }
    });
  }

  private async session(session: Session, client: SupabaseClient): Promise<SessionResult> {
    const identity = await this.verifyWithClient(session.access_token, client);
    return v.parse(sessionSchema, {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      identity,
    });
  }

  private async operation<Result>(
    callback: (client: SupabaseClient) => Promise<Result>,
  ): Promise<Result> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.operationTimeoutMs);
    try {
      const result = await callback(this.client(controller.signal));
      if (controller.signal.aborted) throw unavailable();
      return result;
    } catch (error: unknown) {
      throw safeFailure(error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  operationSignal: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const signals = [operationSignal, controller.signal];
  if (init?.signal) signals.push(init.signal);
  try {
    const response = await fetch(input, { ...init, signal: AbortSignal.any(signals) });
    if (response.status >= 500) {
      await response.body?.cancel();
      return unavailableTransportResponse();
    }
    const body = response.body === null ? null : await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch {
    return unavailableTransportResponse();
  } finally {
    clearTimeout(timeout);
  }
}

function unavailableTransportResponse(): Response {
  // The installed SDK retries common 5xx and fetch errors without accepting an
  // abort signal for its backoff. A private non-retryable response lets the
  // awaited SDK operation finish after cancellation; public callers receive 503.
  return Response.json(
    { code: "mirror_auth_unavailable", message: "Authentication unavailable." },
    { status: 598 },
  );
}

function unauthorized(): ApiError {
  return new ApiError("UNAUTHORIZED", "Se requiere una sesión válida.", 401);
}

function unavailable(): ApiError {
  return new ApiError("AUTH_UNAVAILABLE", "No se pudo verificar la sesión.", 503);
}

function providerFailure(error: AuthError): ApiError {
  return isAuthRetryableFetchError(error) ||
    (typeof error.status === "number" && error.status >= 500)
    ? unavailable()
    : unauthorized();
}

function safeFailure(error: unknown): ApiError {
  return error instanceof ApiError ? error : unavailable();
}
