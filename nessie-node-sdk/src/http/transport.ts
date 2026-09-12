import * as v from "valibot";
import {
  NessieAbortError,
  NessieConfigurationError,
  NessieHttpError,
  NessieNetworkError,
  NessieResponseError,
  NessieTimeoutError,
  type RequestContext,
} from "../errors/nessie-errors.js";
import type { ResponseSchema } from "../models/responses.js";
import type { Fetch, HttpMethod, NessieOptions, Query, RequestOptions } from "./options.js";
import { redact } from "./redaction.js";
import { abortable, isRetryableStatus, pause, retryDelay } from "./retry.js";
import { summarizeIssues, validate } from "./validation.js";

export const NESSIE_BASE_URL = "https://prod-api.nessieisreal.com";

function boundedInteger(value: number, name: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new NessieConfigurationError(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

export class HttpTransport {
  readonly #apiKey: string;
  readonly #baseUrl: URL;
  readonly #fetch: Fetch;
  readonly #timeoutMs: number;
  readonly #maxRetries: number;

  constructor(options: NessieOptions) {
    if (typeof options.apiKey !== "string" || options.apiKey.trim().length === 0) {
      throw new NessieConfigurationError("apiKey must be a nonempty string.");
    }
    this.#apiKey = options.apiKey;
    try {
      this.#baseUrl = new URL(options.baseUrl ?? NESSIE_BASE_URL);
    } catch {
      throw new NessieConfigurationError("baseUrl must be an absolute HTTP(S) URL.");
    }
    if (
      !["http:", "https:"].includes(this.#baseUrl.protocol) ||
      this.#baseUrl.username ||
      this.#baseUrl.password ||
      this.#baseUrl.search ||
      this.#baseUrl.hash
    ) {
      throw new NessieConfigurationError(
        "baseUrl must use HTTP(S) without credentials, query, or fragment.",
      );
    }
    this.#baseUrl.pathname = `${this.#baseUrl.pathname.replace(/\/+$/, "")}/`;
    this.#timeoutMs = boundedInteger(options.timeoutMs ?? 10_000, "timeoutMs", 1, 2_147_483_647);
    this.#maxRetries = boundedInteger(options.maxRetries ?? 2, "maxRetries", 0, 10);
    this.#fetch = options.fetch ?? globalThis.fetch;
  }

  read<T>(
    path: string,
    schema: ResponseSchema<T>,
    options?: RequestOptions,
    query?: Query,
  ): Promise<T> {
    return this.#request("GET", path, schema, options, undefined, query);
  }

  write<Input, Output>(
    method: "POST" | "PUT",
    path: string,
    body: Input,
    bodySchema: ResponseSchema<Input>,
    responseSchema: ResponseSchema<Output>,
    options?: RequestOptions,
  ): Promise<Output> {
    const input = validate(bodySchema, body);
    return this.#request(method, path, responseSchema, options, JSON.stringify(input));
  }

  remove<T>(path: string, schema: ResponseSchema<T>, options?: RequestOptions): Promise<T> {
    return this.#request("DELETE", path, schema, options);
  }

  async #request<T>(
    method: HttpMethod,
    path: string,
    schema: ResponseSchema<T>,
    options: RequestOptions = {},
    body?: string,
    query?: Query,
  ): Promise<T> {
    const timeoutMs = boundedInteger(
      options.timeoutMs ?? this.#timeoutMs,
      "timeoutMs",
      1,
      2_147_483_647,
    );
    const maxRetries = boundedInteger(options.maxRetries ?? this.#maxRetries, "maxRetries", 0, 10);
    const context: RequestContext = { method, path: String(redact(path, this.#apiKey)) };
    const timeout = new AbortController();
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeout.signal])
      : timeout.signal;
    const timer = setTimeout(() => timeout.abort(), timeoutMs);
    const url = new URL(path.replace(/^\//, ""), this.#baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    url.searchParams.set("key", this.#apiKey);
    const headers = new Headers({ accept: "application/json" });
    if (body !== undefined) headers.set("content-type", "application/json");
    const init: RequestInit = { method, headers, signal, redirect: "error" };
    if (body !== undefined) init.body = body;

    try {
      for (let attempt = 0; ; attempt++) {
        if (signal.aborted) throw new NessieAbortError("Request aborted.");
        const mayRetry = method === "GET" && attempt < maxRetries;
        let response: Response;
        let text: string;
        try {
          response = await abortable(
            this.#fetch(new URL(url), { ...init, headers: new Headers(headers) }),
            signal,
          );
          text = await abortable(response.text(), signal);
        } catch {
          if (signal.aborted) throw new NessieAbortError("Request aborted.");
          if (!mayRetry)
            throw new NessieNetworkError(`Network request failed for ${method} ${context.path}.`);
          await pause(retryDelay(attempt, null) ?? 0, signal);
          continue;
        }
        if (!response.ok) {
          const delay = retryDelay(attempt, response.headers.get("retry-after"));
          if (mayRetry && isRetryableStatus(response.status) && delay !== null) {
            await pause(delay, signal);
            continue;
          }
          let errorBody: unknown = text;
          try {
            errorBody = JSON.parse(text);
          } catch {
            /* Non-JSON errors are valid HTTP errors. */
          }
          const requestId =
            response.headers.get("x-request-id") ?? response.headers.get("x-amzn-requestid");
          throw new NessieHttpError(
            context,
            response.status,
            redact(errorBody, this.#apiKey),
            requestId === null ? undefined : String(redact(requestId, this.#apiKey)),
          );
        }

        let decoded: unknown;
        if (text.trim().length > 0) {
          try {
            decoded = JSON.parse(text);
          } catch {
            if (/\bjson\b/i.test(response.headers.get("content-type") ?? "")) {
              throw new NessieResponseError(context, response.status);
            }
            decoded = text;
          }
        }
        const result = v.safeParse(schema, decoded);
        if (!result.success) {
          throw new NessieResponseError(context, response.status, summarizeIssues(result.issues));
        }
        return result.output;
      }
    } catch (error: unknown) {
      if (options.signal?.aborted) throw new NessieAbortError("Request cancelled by the caller.");
      if (timeout.signal.aborted) throw new NessieTimeoutError(`Request exceeded ${timeoutMs} ms.`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
