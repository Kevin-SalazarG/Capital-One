import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

import type { TypedConfigService } from "../../config/app-config";
import { AppError } from "../errors/app-error";
import { PUBLIC_ROUTE_KEY } from "./public.decorator";
import type { AuthenticatedRequest } from "./request-context";
import { SupabaseAuthService } from "./supabase-auth.service";

interface RequestCookies {
  readonly [name: string]: string | undefined;
}

function readBearerToken(request: Request): string | undefined {
  const authorization = request.headers.authorization;
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : undefined;
}

function readCookieToken(
  request: Request,
  cookieName: string,
): string | undefined {
  const cookies = request.cookies as RequestCookies | undefined;
  return cookies?.[cookieName];
}

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  public constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(SupabaseAuthService)
    private readonly authService: SupabaseAuthService,
    @Inject(ConfigService) config: TypedConfigService,
  ) {
    this.accessCookieName = config.getOrThrow<string>("AUTH_ACCESS_COOKIE");
  }

  private readonly accessCookieName: string;

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token =
      readBearerToken(request) ??
      readCookieToken(request, this.accessCookieName);
    if (!token) {
      throw new AppError("Authentication is required", {
        code: "UNAUTHENTICATED",
        status: 401,
      });
    }

    request.accessToken = token;
    request.user = await this.authService.authenticate(token);
    return true;
  }
}
