export interface RequestContext {
  readonly method: string;
  /** Path only; never contains authentication or query parameters. */
  readonly path: string;
}

export class NessieError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class NessieConfigurationError extends NessieError {}
export class NessieValidationError extends NessieError {
  readonly issues: readonly ValidationIssue[];
  constructor(issues: readonly ValidationIssue[]) {
    super("Request validation failed.");
    this.issues = issues;
  }
}
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export class NessieHttpError extends NessieError {
  readonly status: number;
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
  readonly requestId: string | undefined;

  constructor(context: RequestContext, status: number, body: unknown, requestId?: string) {
    super(`Nessie returned HTTP ${status} for ${context.method} ${context.path}.`);
    this.status = status;
    this.method = context.method;
    this.path = context.path;
    this.body = body;
    this.requestId = requestId;
  }
}

export class NessieNetworkError extends NessieError {}
export class NessieTimeoutError extends NessieError {}
export class NessieAbortError extends NessieError {}

export class NessieResponseError extends NessieError {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly issues: readonly ValidationIssue[];

  constructor(context: RequestContext, status: number, issues: readonly ValidationIssue[] = []) {
    super(`Invalid response from ${context.method} ${context.path} (HTTP ${status}).`);
    this.method = context.method;
    this.path = context.path;
    this.status = status;
    this.issues = issues;
  }
}
