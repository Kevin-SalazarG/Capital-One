import {
  Body,
  Controller,
  Get,
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
import { CreateRecurringObligationDto } from "./dto/create-recurring-obligation.dto";
import { ObligationsService } from "./obligations.service";

@Controller("organizations/:organizationId/obligations")
export class ObligationsController {
  public constructor(
    @Inject(ObligationsService)
    private readonly obligationsService: ObligationsService,
  ) {}

  @Post()
  @RequirePermissions("forecast:configure")
  public create(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: CreateRecurringObligationDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.obligationsService.create(
      organizationId,
      user,
      accessToken,
      body,
    );
  }

  @Get()
  @RequirePermissions("forecast:configure")
  public list(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.obligationsService.listActive(organizationId, accessToken);
  }
}
