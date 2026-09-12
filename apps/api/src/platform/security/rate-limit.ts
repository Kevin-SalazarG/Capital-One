import type { NextFunction, Request, Response } from "express";

interface WindowCounter {
  count: number;
  expiresAt: number;
}

export function createRateLimiter(): (
  request: Request,
  response: Response,
  next: NextFunction,
) => void {
  const windows = new Map<string, WindowCounter>();
  return (request, response, next): void => {
    const now = Date.now();
    for (const [key, value] of windows) if (value.expiresAt <= now) windows.delete(key);
    const sensitive = request.path.includes("/auth/");
    const limit = sensitive ? 20 : 120;
    const key = `${request.ip ?? "unknown"}:${sensitive ? "auth" : "api"}`;
    const existing = windows.get(key);
    if ((!existing && windows.size >= 10000) || (existing && existing.count >= limit)) {
      response.setHeader("retry-after", "60");
      response.status(429).json({
        code: "RATE_LIMITED",
        message: "Intenta de nuevo más tarde.",
        requestId: request.headers["x-request-id"],
      });
      return;
    }
    windows.set(key, {
      count: (existing?.count ?? 0) + 1,
      expiresAt: existing?.expiresAt ?? now + 60000,
    });
    next();
  };
}
