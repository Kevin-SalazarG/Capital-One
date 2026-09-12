import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { pino } from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  redact: {
    paths: ["password", "token", "authorization", "apiKey", "databaseUrl"],
    censor: "[REDACTED]",
  },
});

export function requestLogging(request: Request, response: Response, next: NextFunction): void {
  const requestId = randomUUID();
  request.headers["x-request-id"] = requestId;
  response.setHeader("x-request-id", requestId);
  const started = performance.now();
  response.on("finish", () => {
    // Paths and payloads can contain credentials; operation metadata is sufficient for correlation.
    logger.info(
      {
        requestId,
        method: request.method,
        status: response.statusCode,
        durationMs: performance.now() - started,
      },
      "request.completed",
    );
  });
  next();
}
