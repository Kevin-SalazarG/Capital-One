import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import { AppError } from "../errors/app-error";
import type { AuthenticatedUser } from "./authenticated-user";
import type { AuthenticatedRequest } from "./request-context";

export const CurrentUser = createParamDecorator(
  (_data: string | undefined, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new AppError("An authenticated user is required", {
        code: "UNAUTHENTICATED",
        status: 401,
      });
    }

    return request.user;
  },
);

export const AccessToken = createParamDecorator(
  (_data: string | undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.accessToken) {
      throw new AppError("An access token is required", {
        code: "UNAUTHENTICATED",
        status: 401,
      });
    }

    return request.accessToken;
  },
);
