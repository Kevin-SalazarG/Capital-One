import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { AppError } from "./app-error";
import type { AuthenticatedRequest } from "../auth/request-context";

interface ErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<AuthenticatedRequest & Request>();
    const response = context.getResponse<Response>();
    const requestId =
      request.requestId ?? request.header("x-request-id") ?? null;

    const body = this.toErrorBody(exception);
    const status =
      exception instanceof AppError
        ? exception.status
        : exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      error: body,
      meta: { requestId },
    });
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof AppError) {
      return {
        code: exception.code,
        message: exception.message,
        ...(exception.details !== undefined
          ? { details: exception.details }
          : {}),
      };
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : this.readHttpMessage(exceptionResponse);
      return {
        code:
          exception.getStatus() === 400 ? "VALIDATION_FAILED" : "HTTP_ERROR",
        message,
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    };
  }

  private readHttpMessage(value: object): string {
    if ("message" in value) {
      const message = value.message;
      if (Array.isArray(message)) {
        return message.map(String).join(", ");
      }
      if (typeof message === "string") {
        return message;
      }
    }

    return "The request could not be processed";
  }
}
