import {
  Body,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";

import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { SendEmailDto } from "./dto/send-email.dto";
import {
  NotificationsService,
  type SendEmailResponse,
} from "./notifications.service";

@Controller("organizations/:organizationId/notifications")
export class NotificationsController {
  public constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post("email")
  @RequirePermissions("recommendation:update")
  public sendEmail(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: SendEmailDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ): Promise<SendEmailResponse> {
    return this.notificationsService.sendEmail(
      organizationId,
      user,
      accessToken,
      body,
    );
  }
}
