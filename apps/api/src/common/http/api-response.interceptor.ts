import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

import type { AuthenticatedRequest } from "../auth/request-context";
import { camelize } from "../utilities/camel-case";

export interface ApiEnvelope<T> {
  readonly data: T;
  readonly meta: {
    readonly requestId: string | null;
  };
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "data" in value && "meta" in value;
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiEnvelope<T> | T
> {
  public intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T> | T> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return next.handle().pipe(
      map((data: T) => {
        if (isApiEnvelope(data)) {
          return data;
        }

        return {
          data: camelize(data),
          meta: {
            requestId: request.requestId ?? null,
          },
        };
      }),
    );
  }
}
