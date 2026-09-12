import type { Identity, LoginInput, SessionResult } from "./auth-schemas.js";

export abstract class AuthProvider {
  abstract login(input: LoginInput): Promise<SessionResult>;
  abstract refresh(refreshToken: string): Promise<SessionResult>;
  abstract verify(accessToken: string): Promise<Identity>;
  abstract logout(accessToken: string): Promise<void>;
}
