import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";

import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  public constructor(
    @Inject(OrganizationsService)
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post()
  public create(
    @Body() body: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.organizationsService.create(body, user, accessToken);
  }

  @Get()
  public list(
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.organizationsService.list(user, accessToken);
  }

  @Get(":organizationId")
  @RequirePermissions("organization:read")
  public getById(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.organizationsService.getById(organizationId, accessToken);
  }

  @Patch(":organizationId")
  @RequirePermissions("organization:update")
  public update(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.organizationsService.update(
      organizationId,
      user,
      accessToken,
      body,
    );
  }
}
