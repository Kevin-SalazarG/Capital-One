import { randomUUID } from "node:crypto";
import { AuthProvider } from "../../src/modules/auth/auth-provider.js";
import type { Identity, LoginInput, SessionResult } from "../../src/modules/auth/auth-schemas.js";
import { ApiError } from "../../src/platform/http/api-error.js";

export interface TestIdentity {
  readonly email: string;
  readonly userId: string;
}

interface SyntheticSession {
  readonly userId: string;
  readonly sessionId: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
}

export const TEST_PASSWORD = "synthetic-test-password";

export class TestAuthProvider extends AuthProvider {
  private readonly accounts: ReadonlyMap<string, string>;
  private readonly password: string;
  private readonly sessions = new Map<string, SyntheticSession>();
  private readonly access = new Map<string, string>();
  private readonly refreshTokens = new Map<string, string>();

  constructor(identities: readonly TestIdentity[], password: string = TEST_PASSWORD) {
    super();
    this.accounts = new Map(identities.map((identity) => [identity.email, identity.userId]));
    this.password = password;
  }

  override async login(input: LoginInput): Promise<SessionResult> {
    const userId = this.accounts.get(input.email);
    if (userId === undefined || input.password !== this.password) throw unauthorized();
    return this.issue(userId, randomUUID());
  }

  override async refresh(refreshToken: string): Promise<SessionResult> {
    const sessionId = this.refreshTokens.get(refreshToken);
    const session = sessionId === undefined ? undefined : this.sessions.get(sessionId);
    if (!session) throw unauthorized();
    this.remove(session);
    return this.issue(session.userId, session.sessionId);
  }

  override async verify(accessToken: string): Promise<Identity> {
    const sessionId = this.access.get(accessToken);
    const session = sessionId === undefined ? undefined : this.sessions.get(sessionId);
    if (!session || session.expiresAt <= Math.floor(Date.now() / 1_000)) throw unauthorized();
    return { userId: session.userId, sessionId: session.sessionId, expiresAt: session.expiresAt };
  }

  override async logout(accessToken: string): Promise<void> {
    const identity = await this.verify(accessToken);
    const session = this.sessions.get(identity.sessionId);
    if (!session) throw unauthorized();
    this.remove(session);
  }

  private issue(userId: string, sessionId: string): SessionResult {
    const accessToken = `synthetic-access-${randomUUID()}`;
    const refreshToken = `synthetic-refresh-${randomUUID()}`;
    const expiresAt = Math.floor(Date.now() / 1_000) + 3_600;
    const session = { userId, sessionId, accessToken, refreshToken, expiresAt };
    this.sessions.set(sessionId, session);
    this.access.set(accessToken, sessionId);
    this.refreshTokens.set(refreshToken, sessionId);
    return { accessToken, refreshToken, expiresAt, identity: { userId, sessionId, expiresAt } };
  }

  private remove(session: SyntheticSession): void {
    this.sessions.delete(session.sessionId);
    this.access.delete(session.accessToken);
    this.refreshTokens.delete(session.refreshToken);
  }
}

function unauthorized(): ApiError {
  return new ApiError("UNAUTHORIZED", "Synthetic session is invalid or revoked.", 401);
}
