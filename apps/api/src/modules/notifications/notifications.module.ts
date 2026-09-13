import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuditModule } from "../../common/audit/audit.module";
import { EMAIL_CONFIG_PORT, EMAIL_DELIVERY_PORT } from "./email-delivery.port";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { ResendEmailProvider } from "./resend-email.provider";

@Module({
  imports: [AuditModule, ConfigModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ResendEmailProvider,
    {
      provide: EMAIL_DELIVERY_PORT,
      useExisting: ResendEmailProvider,
    },
    {
      provide: EMAIL_CONFIG_PORT,
      useExisting: ConfigService,
    },
  ],
})
export class NotificationsModule {}
