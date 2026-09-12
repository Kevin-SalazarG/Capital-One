import { z } from "zod";
import { ApiError } from "@/lib/api/errors";

const errorSchema = z.object({
  error: z.object({ code: z.string() }),
  meta: z.object({ requestId: z.string().nullable() }).optional(),
});
const API_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1"
).replace(/\/$/, "");
let refreshInFlight: Promise<void> | null = null;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const timeout = AbortSignal.timeout(
    options.method && options.method !== "GET" ? 120_000 : 20_000,
  );
  try {
    return await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      signal: options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError("NETWORK_ERROR", 0);
  }
}

async function renewSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await send("/auth/refresh", { method: "POST" });
      if (!response.ok)
        throw new ApiError("AUTH_SESSION_INVALID", response.status);
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function waitForSessionRefresh(): Promise<void> {
  await refreshInFlight?.catch(() => undefined);
}

export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options);
  if (response.status === 401 && !path.startsWith("/auth/")) {
    try {
      await renewSession();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        typeof window !== "undefined"
      )
        window.dispatchEvent(new Event("colchon:session-expired"));
      throw error;
    }
    options.signal?.throwIfAborted();
    response = await send(path, options);
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = errorSchema.safeParse(payload);
    throw new ApiError(
      parsed.success ? parsed.data.error.code : "HTTP_ERROR",
      response.status,
      parsed.success ? (parsed.data.meta?.requestId ?? null) : null,
    );
  }
  const parsed = z
    .object({
      data: schema,
      meta: z.object({ requestId: z.string().nullable() }),
    })
    .safeParse(payload);
  if (!parsed.success) throw new ApiError("RESPONSE_INVALID", 502);
  return parsed.data.data;
}
