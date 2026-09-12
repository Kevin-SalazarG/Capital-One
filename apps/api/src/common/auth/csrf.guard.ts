import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

import type { TypedConfigService } from "../../config/app-config";
import { AppError } from "../errors/app-error";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface RequestCookies {
  readonly [name: string]: string | undefined;
}

function hasCookieSession(
  request: Request,
  config: TypedConfigService,
): boolean {
  const cookies = request.cookies as RequestCookies | undefined;
  return Boolean(
    cookies?.[config.getOrThrow<string>("AUTH_ACCESS_COOKIE")] ??
    cookies?.[config.getOrThrow<string>("AUTH_REFRESH_COOKIE")],
  );
}

function isAllowedOrigin(
  value: string | undefined,
  expectedOrigin: string,
): boolean {
  if (!value) {
    return false;
  }
  try {
    return new URL(value).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

@Injectable()
export class CsrfGuard implements CanActivate {
  public constructor(
    @Inject(ConfigService) private readonly config: TypedConfigService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (
      !MUTATING_METHODS.has(request.method) ||
      request.headers.authorization?.toLowerCase().startsWith("bearer ") ||
      !hasCookieSession(request, this.config)
    ) {
      return true;
    }

    const origin = request.headers.origin ?? request.headers.referer;
    if (
      !isAllowedOrigin(origin, this.config.getOrThrow<string>("APP_ORIGIN"))
    ) {
      throw new AppError("The request origin is not allowed", {
        code: "FORBIDDEN",
        status: 403,
      });
    }
    return true;
  }
}
