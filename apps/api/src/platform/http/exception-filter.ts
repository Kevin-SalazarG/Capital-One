import { Catch, HttpException } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Request, Response } from "express";
import * as v from "valibot";
import { ApiError } from "./api-error.js";

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    let status = 500;
    let code = "INTERNAL_ERROR";
    let message = "La solicitud no pudo completarse.";
    if (
      typeof exception === "object" &&
      exception !== null &&
      "type" in exception &&
      exception.type === "entity.too.large" &&
      "status" in exception &&
      exception.status === 413
    ) {
      status = 413;
      code = "PAYLOAD_TOO_LARGE";
      message = "La solicitud supera el tamaño permitido.";
    } else if (exception instanceof ApiError) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
    } else if (v.isValiError(exception)) {
      status = 400;
      code = "INVALID_INPUT";
      message = "Revisa los campos y límites de la solicitud.";
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code =
        status === 401
          ? "UNAUTHORIZED"
          : status === 403
            ? "FORBIDDEN"
            : status === 404
              ? "NOT_FOUND"
              : status === 429
                ? "RATE_LIMITED"
                : status < 500
                  ? "INVALID_INPUT"
                  : "INTERNAL_ERROR";
      message =
        status < 500 ? "La solicitud no está permitida o contiene datos inválidos." : message;
    }
    response
      .status(status)
      .json({ code, message, requestId: request.headers["x-request-id"] ?? "unknown" });
  }
}
