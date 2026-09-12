export type Fetch = (url: URL, init: RequestInit) => Promise<Response>;

export interface NessieOptions {
  readonly apiKey: string;
  /** Defaults to https://prod-api.nessieisreal.com. */
  readonly baseUrl?: string;
  /** Total deadline including retries and reading the body. Default: 10,000 ms. */
  readonly timeoutMs?: number;
  /** Additional attempts for GET requests only. Default: 2. */
  readonly maxRetries?: number;
  readonly fetch?: Fetch;
}

export interface RequestOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
}
export type Query = Readonly<Record<string, string | number | boolean | undefined>>;
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
