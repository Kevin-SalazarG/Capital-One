import "reflect-metadata";
import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Client } from "pg";
import * as v from "valibot";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../../src/config/app-config.js";
import { SupabaseAuthProvider } from "../../src/modules/auth/supabase-auth-provider.js";
import { createDatabaseFixture, type DatabaseFixture } from "../fixtures/database-fixture.js";

interface JwtClaims {
  readonly iss: string;
  readonly aud: string;
  readonly sub: string;
  readonly session_id: string;
  readonly role: "authenticated";
  readonly exp: number;
  readonly iat: number;
}

interface SyntheticAuthUser {
  readonly id: string;
  readonly aud: "authenticated";
  readonly role: "authenticated";
  readonly email: string;
  readonly app_metadata: { readonly provider: "email"; readonly providers: readonly string[] };
  readonly user_metadata: { readonly synthetic: true };
  readonly created_at: string;
}

interface SyntheticAuthSession {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_in: number;
  readonly expires_at: number;
  readonly token_type: "bearer";
  readonly user: SyntheticAuthUser;
}

interface SessionFixture {
  readonly userId: string;
  readonly sessionId: string;
  readonly email: string;
  readonly response: SyntheticAuthSession;
}

const passwordSchema = v.object({ email: v.string(), password: v.string() });
const refreshSchema = v.object({ refresh_token: v.string() });
const jwkSchema = v.object({
  kty: v.literal("EC"),
  crv: v.literal("P-256"),
  x: v.string(),
  y: v.string(),
});
const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const publicJwk = v.parse(jwkSchema, publicKey.export({ format: "jwk" }));
const keyId = randomUUID();
const passwordSessions = new Map<string, SessionFixture>();
const refreshSessions = new Map<string, SessionFixture>();
const accessUsers = new Map<string, SyntheticAuthUser>();
let sourceUrl = "";
let jwksReads = 0;
let userReads = 0;
let logoutRequests = 0;
let failUserEndpoint = false;
let failLogoutEndpoint = false;
let disconnectUserEndpoint = false;
let failedTokenStatus: number | undefined;
let stallTokenEndpoint = false;
let tokenRequests = 0;
let tokenDisconnections = 0;

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Auth contract integration requires ${name}`);
  return value;
}

function isolatedAdminUrl(): string {
  const value = requiredEnvironment("TEST_ADMIN_DATABASE_URL");
  const url = new URL(value);
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.MIRROR_TEST_DATABASE_ISOLATED !== "true" ||
    url.hostname !== "127.0.0.1"
  ) {
    throw new Error("Auth contract fixture DDL is restricted to the isolated local test runner.");
  }
  return value;
}

const admin = new Client({ connectionString: isolatedAdminUrl() });
let persistence: DatabaseFixture;

function jwt(claims: JwtClaims): string {
  const header = Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT", kid: keyId })).toString(
    "base64url",
  );
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const content = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(content), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `${content}.${signature}`;
}

async function sessionFixture(overrides: Partial<JwtClaims> = {}): Promise<SessionFixture> {
  const userId = overrides.sub ?? randomUUID();
  const sessionId = overrides.session_id ?? randomUUID();
  const email = `synthetic-${userId}@example.test`;
  const now = Math.floor(Date.now() / 1_000);
  const claims: JwtClaims = {
    iss: `${sourceUrl}/auth/v1`,
    aud: "authenticated",
    sub: userId,
    session_id: sessionId,
    role: "authenticated",
    exp: now + 3_600,
    iat: now,
    ...overrides,
  };
  const user: SyntheticAuthUser = {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { synthetic: true },
    created_at: new Date().toISOString(),
  };
  const response: SyntheticAuthSession = {
    access_token: jwt(claims),
    refresh_token: `synthetic-refresh-${randomUUID()}`,
    expires_in: 3_600,
    expires_at: claims.exp,
    token_type: "bearer",
    user,
  };
  const fixture = { userId, sessionId, email, response };
  accessUsers.set(response.access_token, user);
  passwordSessions.set(email, fixture);
  refreshSessions.set(response.refresh_token, fixture);
  await admin.query(
    "INSERT INTO auth.sessions (id, user_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT (id) DO NOTHING",
    [sessionId, userId],
  );
  return fixture;
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

async function body(request: IncomingMessage): Promise<unknown> {
  const parts: Buffer[] = [];
  let length = 0;
  const chunks: AsyncIterable<unknown> = request;
  for await (const chunk of chunks) {
    if (!Buffer.isBuffer(chunk)) throw new Error("Unexpected synthetic HTTP body type.");
    length += chunk.length;
    if (length > 32_768) throw new Error("Synthetic Auth fixture payload limit exceeded.");
    parts.push(chunk);
  }
  const decoded: unknown = JSON.parse(Buffer.concat(parts).toString("utf8"));
  return decoded;
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", sourceUrl);
  if (url.pathname === "/auth/v1/.well-known/jwks.json" && request.method === "GET") {
    jwksReads += 1;
    sendJson(response, 200, { keys: [{ ...publicJwk, kid: keyId, alg: "ES256", use: "sig" }] });
    return;
  }
  if (url.pathname === "/auth/v1/user" && request.method === "GET") {
    userReads += 1;
    if (disconnectUserEndpoint) {
      request.socket.destroy();
      return;
    }
    const token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
    if (failUserEndpoint) {
      sendJson(response, 500, {
        msg: "Synthetic provider-private failure detail",
        code: "unexpected_failure",
      });
      return;
    }
    const user = accessUsers.get(token);
    sendJson(response, user ? 200 : 401, user ?? { msg: "Invalid synthetic access token" });
    return;
  }
  if (url.pathname === "/auth/v1/token" && request.method === "POST") {
    tokenRequests += 1;
    if (stallTokenEndpoint) {
      await body(request);
      response.once("close", () => {
        tokenDisconnections += 1;
      });
      return;
    }
    if (failedTokenStatus !== undefined) {
      sendJson(response, failedTokenStatus, {
        msg: "Synthetic provider-private token failure",
        code: "unexpected_failure",
      });
      return;
    }
    const input = await body(request);
    if (url.searchParams.get("grant_type") === "password") {
      const parsed = v.safeParse(passwordSchema, input);
      const fixture =
        parsed.success && parsed.output.password === "synthetic-auth-password"
          ? passwordSessions.get(parsed.output.email)
          : undefined;
      sendJson(
        response,
        fixture ? 200 : 400,
        fixture?.response ?? { msg: "Invalid synthetic credentials", code: "invalid_credentials" },
      );
      return;
    }
    const parsed = v.safeParse(refreshSchema, input);
    const previous = parsed.success ? refreshSessions.get(parsed.output.refresh_token) : undefined;
    if (!previous) {
      sendJson(response, 400, {
        msg: "Invalid synthetic refresh token",
        code: "refresh_token_not_found",
      });
      return;
    }
    refreshSessions.delete(previous.response.refresh_token);
    const refreshed = await sessionFixture({
      sub: previous.userId,
      session_id: previous.sessionId,
    });
    sendJson(response, 200, refreshed.response);
    return;
  }
  if (url.pathname === "/auth/v1/logout" && request.method === "POST") {
    logoutRequests += 1;
    if (failLogoutEndpoint)
      sendJson(response, 500, { msg: "Synthetic provider-private logout detail" });
    else {
      response.writeHead(204);
      response.end();
    }
    return;
  }
  sendJson(response, 404, { msg: "Unknown local Auth contract operation" });
}

const server = createServer((request, response) => {
  void handle(request, response).catch(() =>
    sendJson(response, 500, { msg: "Synthetic Auth fixture failure" }),
  );
});

function configuration(): AppConfig {
  return {
    NODE_ENV: "test",
    PORT: 3000,
    SUPABASE_URL: sourceUrl,
    SUPABASE_ANON_KEY: "synthetic-public-key",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-unused-auth-service-key",
    BANKING_MODE: "replay",
    TRUST_PROXY_HOPS: 0,
  };
}

function provider(operationTimeoutMs = 10_000): SupabaseAuthProvider {
  return new SupabaseAuthProvider(configuration(), persistence.database, operationTimeoutMs);
}

describe("Supabase Auth SDK against a local cryptographic contract fixture", () => {
  beforeAll(async () => {
    await admin.connect();
    persistence = await createDatabaseFixture();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Local Auth contract server did not bind a TCP address.");
    sourceUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await Promise.all([persistence.close(), admin.end()]);
  });

  it("verifies ES256 signatures through JWKS and checks the live session table", async () => {
    const fixture = await sessionFixture();
    const identity = await provider().verify(fixture.response.access_token);
    expect(identity.userId).toBe(fixture.userId);
    expect(identity.sessionId).toBe(fixture.sessionId);
    expect(jwksReads).toBeGreaterThan(0);
    expect(userReads).toBeGreaterThan(0);
  });

  it("rejects wrong issuer, audience, expiry, and cryptographic tampering", async () => {
    const invalidClaims = [
      { iss: "https://foreign.example.test/auth/v1" },
      { aud: "service_role" },
      { exp: Math.floor(Date.now() / 1_000) - 60 },
    ];
    for (const claims of invalidClaims) {
      const fixture = await sessionFixture(claims);
      await expect(provider().verify(fixture.response.access_token)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
    const fixture = await sessionFixture();
    const parts = fixture.response.access_token.split(".");
    const payload = parts[1];
    if (!parts[0] || !payload || !parts[2]) throw new Error("Synthetic JWT encoding is invalid.");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: randomUUID(),
        session_id: fixture.sessionId,
        iss: `${sourceUrl}/auth/v1`,
        aud: "authenticated",
        exp: Math.floor(Date.now() / 1_000) + 3600,
      }),
    ).toString("base64url");
    const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const readsBefore = userReads;
    await expect(provider().verify(tampered)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(userReads).toBe(readsBefore);
  });

  it("denies a still-signed token after its provider session is deleted", async () => {
    const fixture = await sessionFixture();
    await provider().verify(fixture.response.access_token);
    await admin.query("DELETE FROM auth.sessions WHERE id = $1::uuid", [fixture.sessionId]);
    await expect(provider().verify(fixture.response.access_token)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("persists logout revocation across new provider instances", async () => {
    const fixture = await sessionFixture();
    const before = logoutRequests;
    await provider().logout(fixture.response.access_token);
    expect(logoutRequests).toBe(before + 1);
    await expect(provider().verify(fixture.response.access_token)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(await persistence.database.isSessionActive(fixture.userId, fixture.sessionId)).toBe(
      false,
    );
  });

  it("keeps concurrent logins and refreshes isolated between users", async () => {
    const first = await sessionFixture();
    const second = await sessionFixture();
    const shared = provider();
    const [firstLogin, secondLogin] = await Promise.all([
      shared.login({ email: first.email, password: "synthetic-auth-password" }),
      shared.login({ email: second.email, password: "synthetic-auth-password" }),
    ]);
    const [firstRefresh, secondRefresh] = await Promise.all([
      shared.refresh(firstLogin.refreshToken),
      shared.refresh(secondLogin.refreshToken),
    ]);
    expect(firstRefresh.identity.userId).toBe(first.userId);
    expect(secondRefresh.identity.userId).toBe(second.userId);
    expect((await shared.verify(firstRefresh.accessToken)).sessionId).toBe(first.sessionId);
    expect((await shared.verify(secondRefresh.accessToken)).sessionId).toBe(second.sessionId);
  });

  it("returns safe failures when the provider user endpoint fails", async () => {
    const fixture = await sessionFixture();
    failUserEndpoint = true;
    try {
      await expect(provider().verify(fixture.response.access_token)).rejects.toMatchObject({
        code: "AUTH_UNAVAILABLE",
      });
      await expect(provider().verify(fixture.response.access_token)).rejects.not.toThrow(
        "provider-private",
      );
    } finally {
      failUserEndpoint = false;
    }
  });

  it("distinguishes invalid credentials from upstream login and refresh failures", async () => {
    const fixture = await sessionFixture();
    const shared = provider();
    await expect(
      shared.login({ email: fixture.email, password: "wrong-synthetic-password" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(shared.refresh("missing-synthetic-refresh-token")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    failedTokenStatus = 500;
    try {
      await expect(
        shared.login({ email: fixture.email, password: "synthetic-auth-password" }),
      ).rejects.toMatchObject({ code: "AUTH_UNAVAILABLE" });
      const requestsBefore = tokenRequests;
      await expect(shared.refresh(fixture.response.refresh_token)).rejects.toMatchObject({
        code: "AUTH_UNAVAILABLE",
      });
      expect(tokenRequests).toBe(requestsBefore + 1);
    } finally {
      failedTokenStatus = undefined;
    }
  });

  it("aborts a stalled refresh at the shared operation deadline without SDK backoff", async () => {
    const fixture = await sessionFixture();
    const requestsBefore = tokenRequests;
    const disconnectionsBefore = tokenDisconnections;
    stallTokenEndpoint = true;
    const startedAt = performance.now();
    try {
      await expect(provider(75).refresh(fixture.response.refresh_token)).rejects.toMatchObject({
        code: "AUTH_UNAVAILABLE",
      });
      expect(performance.now() - startedAt).toBeLessThan(1_000);
      await vi.waitFor(() => expect(tokenDisconnections).toBe(disconnectionsBefore + 1), {
        timeout: 1_000,
        interval: 10,
      });
      expect(tokenRequests).toBe(requestsBefore + 1);
    } finally {
      stallTokenEndpoint = false;
    }
  });

  it("maps a disconnected provider transport to a safe availability error", async () => {
    const fixture = await sessionFixture();
    disconnectUserEndpoint = true;
    try {
      await expect(provider().verify(fixture.response.access_token)).rejects.toMatchObject({
        code: "AUTH_UNAVAILABLE",
      });
    } finally {
      disconnectUserEndpoint = false;
    }
  });

  it("keeps local logout effective when provider sign-out fails", async () => {
    const fixture = await sessionFixture();
    failLogoutEndpoint = true;
    try {
      await expect(provider().logout(fixture.response.access_token)).rejects.toMatchObject({
        code: "AUTH_LOGOUT_INCOMPLETE",
      });
    } finally {
      failLogoutEndpoint = false;
    }
    await expect(provider().verify(fixture.response.access_token)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
