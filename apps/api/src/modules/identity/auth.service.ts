import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";

import {
  readPublicSupabaseKey,
  type TypedConfigService,
} from "../../config/app-config";
import { AppError } from "../../common/errors/app-error";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { SupabaseService } from "../../common/database/supabase.service";
import type { SignInDto } from "./dto/sign-in.dto";
import type { SignUpDto } from "./dto/sign-up.dto";

export interface AuthSessionView {
  readonly user: AuthenticatedUser;
  readonly expiresAt: number | null;
  readonly requiresEmailConfirmation: boolean;
}

@Injectable()
export class IdentityAuthService {
  private readonly accessCookieName: string;
  private readonly refreshCookieName: string;
  private readonly cookieOptions: {
    readonly httpOnly: true;
    readonly secure: boolean;
    readonly sameSite: "lax" | "strict" | "none";
    readonly path: "/";
    readonly domain?: string;
  };
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
    @Inject(ConfigService) config: TypedConfigService,
  ) {
    this.accessCookieName = config.getOrThrow<string>("AUTH_ACCESS_COOKIE");
    this.refreshCookieName = config.getOrThrow<string>("AUTH_REFRESH_COOKIE");
    const domain = config.getOrThrow<string>("AUTH_COOKIE_DOMAIN");
    const secure = config.getOrThrow<boolean>("AUTH_COOKIE_SECURE");
    const sameSite = config.getOrThrow<"lax" | "strict" | "none">(
      "AUTH_COOKIE_SAME_SITE",
    );
    if (
      (config.getOrThrow<string>("NODE_ENV") === "production" && !secure) ||
      (sameSite === "none" && !secure)
    ) {
      throw new Error(
        "AUTH_COOKIE_SECURE must be true in production and when SameSite is none",
      );
    }
    this.cookieOptions = {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
      ...(domain ? { domain } : {}),
    };
    this.accessTtlSeconds = config.getOrThrow<number>(
      "AUTH_ACCESS_TTL_SECONDS",
    );
    this.refreshTtlSeconds = config.getOrThrow<number>(
      "AUTH_REFRESH_TTL_SECONDS",
    );
    readPublicSupabaseKey(config);
  }

  public async signUp(
    input: SignUpDto,
    response: Response,
  ): Promise<AuthSessionView> {
    const { data, error } = await this.supabase.publicClient.auth.signUp({
      email: input.email,
      password: input.password,
    });
    if (error) {
      throw this.toAuthError(error.message, "AUTH_INVALID_CREDENTIALS", error);
    }
    if (!data.user) {
      throw new AppError("Supabase did not return a user", {
        code: "AUTH_SESSION_INVALID",
        status: 502,
      });
    }

    if (data.session) {
      this.setSessionCookies(
        response,
        data.session.access_token,
        data.session.refresh_token,
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
      },
      expiresAt: data.session?.expires_at ?? null,
      requiresEmailConfirmation: !data.session,
    };
  }

  public async signIn(
    input: SignInDto,
    response: Response,
  ): Promise<AuthSessionView> {
    const { data, error } =
      await this.supabase.publicClient.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
    if (error || !data.user || !data.session) {
      throw this.toAuthError(
        error?.message ?? "Invalid credentials",
        "AUTH_INVALID_CREDENTIALS",
        error,
      );
    }

    this.setSessionCookies(
      response,
      data.session.access_token,
      data.session.refresh_token,
    );
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
      },
      expiresAt: data.session.expires_at ?? null,
      requiresEmailConfirmation: false,
    };
  }

  public async refresh(
    refreshToken: string | undefined,
    response: Response,
  ): Promise<AuthSessionView> {
    if (!refreshToken) {
      throw new AppError("A refresh token is required", {
        code: "AUTH_SESSION_INVALID",
        status: 401,
      });
    }

    const { data, error } =
      await this.supabase.publicClient.auth.refreshSession({
        refresh_token: refreshToken,
      });
    if (error || !data.user || !data.session) {
      throw new AppError("The refresh session is invalid or expired", {
        code: "AUTH_SESSION_INVALID",
        status: 401,
        cause: error,
      });
    }

    this.setSessionCookies(
      response,
      data.session.access_token,
      data.session.refresh_token,
    );
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
      },
      expiresAt: data.session.expires_at ?? null,
      requiresEmailConfirmation: false,
    };
  }

  public readRefreshToken(request: Request): string | undefined {
    const cookies = request.cookies as
      Record<string, string | undefined> | undefined;
    return cookies?.[this.refreshCookieName];
  }

  public signOut(response: Response): void {
    response.clearCookie(this.accessCookieName, this.cookieOptions);
    response.clearCookie(this.refreshCookieName, this.cookieOptions);
  }

  private setSessionCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    response.cookie(this.accessCookieName, accessToken, {
      ...this.cookieOptions,
      maxAge: this.accessTtlSeconds * 1000,
    });
    response.cookie(this.refreshCookieName, refreshToken, {
      ...this.cookieOptions,
      maxAge: this.refreshTtlSeconds * 1000,
    });
  }

  private toAuthError(
    message: string,
    code: "AUTH_INVALID_CREDENTIALS",
    cause: unknown,
  ): AppError {
    return new AppError(message, {
      code,
      status: 401,
      cause,
    });
  }
}
