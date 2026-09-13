import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import type { SendEmailDto } from "./dto/send-email.dto";
import {
  EMAIL_DELIVERY_PORT,
  type EmailDeliveryPort,
} from "./email-delivery.port";

export interface SendEmailResponse {
  readonly status: "sent";
}

@Injectable()
export class NotificationsService {
  public constructor(
    @Inject(EMAIL_DELIVERY_PORT)
    private readonly emailDelivery: EmailDeliveryPort,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public async sendEmail(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    input: SendEmailDto,
  ): Promise<SendEmailResponse> {
    const result = await this.emailDelivery.send({
      to: input.to,
      subject: input.subject.trim(),
      text: input.text.trim(),
    });

    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "notification.email_sent",
      resourceType: "email",
      resourceId: result.id,
      metadata: {
        provider: "resend",
        recipientDomain: input.to.split("@").pop() ?? "unknown",
        subject: input.subject.trim(),
      },
    });

    return { status: "sent" };
  }
}
