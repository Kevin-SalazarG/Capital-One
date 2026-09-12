import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";
import { Injectable, type NestMiddleware } from "@nestjs/common";

import type { AuthenticatedRequest } from "../auth/request-context";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(request: Request, response: Response, next: NextFunction): void {
    const requestId = request.header("x-request-id") ?? randomUUID();
    const contextRequest = request as AuthenticatedRequest;
    contextRequest.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    next();
  }
}
