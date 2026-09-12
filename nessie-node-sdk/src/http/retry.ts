import { NessieAbortError } from "../errors/nessie-errors.js";

const retryStatuses = new Set([408, 429, 500, 502, 503, 504]);
const maxDelayMs = 30_000;

export function isRetryableStatus(status: number): boolean {
  return retryStatuses.has(status);
}

/** Honor Retry-After without shortening the server's requested delay. */
export function retryDelay(
  attempt: number,
  retryAfter: string | null,
  now = Date.now(),
): number | null {
  if (retryAfter !== null) {
    const seconds = Number(retryAfter);
    const date = Date.parse(retryAfter);
    const requested =
      Number.isFinite(seconds) && seconds >= 0
        ? seconds * 1000
        : Number.isFinite(date)
          ? Math.max(0, date - now)
          : undefined;
    if (requested !== undefined) return requested > maxDelayMs ? null : requested;
  }
  // Full jitter; capped so large retry counts cannot overflow the timer.
  return Math.floor(Math.random() * Math.min(maxDelayMs, 250 * 2 ** Math.min(attempt, 10)));
}

export function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new NessieAbortError("Request aborted."));
    signal.addEventListener("abort", abort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    if (signal.aborted) {
      signal.removeEventListener("abort", abort);
      abort();
    }
  });
}

export function pause(delayMs: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new NessieAbortError("Request aborted."));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, delayMs);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}
