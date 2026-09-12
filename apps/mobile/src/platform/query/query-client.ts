import { MirrorApiError, MirrorTransportError } from "@mirror/api-client";
import { QueryClient } from "@tanstack/react-query";

const maximumTimerDelayMs = 2_147_483_647;

export function readRetryDelay(_failureCount: number, error: unknown): number {
  const retryAfterMs =
    error instanceof MirrorApiError || error instanceof MirrorTransportError
      ? error.retryAfterMs
      : undefined;
  return retryAfterMs !== undefined && Number.isFinite(retryAfterMs) && retryAfterMs >= 0
    ? retryAfterMs
    : 1_000;
}

export function shouldRetryRead(failureCount: number, error: unknown): boolean {
  // Refuse an automatic retry when the native timer cannot honor the server's
  // requested delay; clamping it would resend before Retry-After permits.
  if (failureCount >= 1 || readRetryDelay(failureCount, error) > maximumTimerDelayMs) return false;
  if (error instanceof MirrorApiError) return [502, 503, 504].includes(error.status);
  return (
    error instanceof MirrorTransportError &&
    ["NETWORK_ERROR", "REQUEST_TIMEOUT"].includes(error.code) &&
    (error.status === undefined ||
      (error.status >= 200 && error.status < 300) ||
      [502, 503, 504].includes(error.status))
  );
}

export interface QueryClientConfig {
  readonly allowLocalReads?: boolean;
}

export function createQueryClient(config: QueryClientConfig = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        retry: shouldRetryRead,
        retryDelay: readRetryDelay,
        networkMode: config.allowLocalReads ? "always" : "online",
      },
      // Future financial writes must reject offline dispatch explicitly; none are queued here.
      mutations: { retry: false, networkMode: "always" },
    },
  });
}
