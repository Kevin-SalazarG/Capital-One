import { Inject, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import type {
  EmailDeliveryConfig,
  EmailDeliveryPort,
  EmailDeliveryResult,
  EmailMessage,
} from "./email-delivery.port";
import { EMAIL_CONFIG_PORT } from "./email-delivery.port";

interface ResendResponse {
  readonly id: string;
}

function isResendResponse(value: unknown): value is ResendResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { readonly id?: unknown };
  return typeof candidate.id === "string" && candidate.id.length > 0;
}

@Injectable()
export class ResendEmailProvider implements EmailDeliveryPort {
  public constructor(
    @Inject(EMAIL_CONFIG_PORT)
    private readonly config: EmailDeliveryConfig,
  ) {}

  public async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    if (!apiKey) {
      throw new AppError("Email delivery is not configured", {
        code: "EMAIL_DELIVERY_UNAVAILABLE",
        status: 503,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("The email provider timed out", {
          code: "EMAIL_DELIVERY_UNAVAILABLE",
          status: 503,
          cause: error,
        });
      }
      throw new AppError("The email provider is unavailable", {
        code: "EMAIL_DELIVERY_UNAVAILABLE",
        status: 503,
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 429) {
        throw new AppError("The email provider rate limit was reached", {
          code: "EMAIL_DELIVERY_ERROR",
          status: 429,
        });
      }
      throw new AppError("The email provider rejected the message", {
        code:
          response.status >= 500
            ? "EMAIL_DELIVERY_UNAVAILABLE"
            : "EMAIL_DELIVERY_ERROR",
        status: response.status >= 500 ? 503 : 502,
      });
    }

    if (!isResendResponse(payload)) {
      throw new AppError("The email provider returned an invalid response", {
        code: "EMAIL_DELIVERY_ERROR",
        status: 502,
      });
    }

    return { id: payload.id };
  }

  private get fromEmail(): string {
    return this.config.getOrThrow<string>("RESEND_FROM_EMAIL");
  }

  private get timeoutMs(): number {
    return this.config.getOrThrow<number>("RESEND_TIMEOUT_MS");
  }
}
