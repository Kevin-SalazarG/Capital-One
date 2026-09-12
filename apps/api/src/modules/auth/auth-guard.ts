import { Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { ApiError } from "../../platform/http/api-error.js";
import { AuthProvider } from "./auth-provider.js";
import type { Identity } from "./auth-schemas.js";

export interface AuthenticatedRequest extends Request {
  identity?: Identity;
}

export function bearerToken(request: Request): string {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ") || header.length > 8192)
    throw new ApiError("UNAUTHORIZED", "Se requiere una sesión válida.", 401);
  return header.slice(7);
}

export function requestIdentity(request: AuthenticatedRequest): Identity {
  if (!request.identity) throw new ApiError("UNAUTHORIZED", "Se requiere una sesión válida.", 401);
  return request.identity;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthProvider) private readonly provider: AuthProvider) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.identity = await this.provider.verify(bearerToken(request));
    return true;
  }
}
