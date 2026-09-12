import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Delete,
} from "@nestjs/common";

import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { CreateConnectionDto } from "./dto/create-connection.dto";
import { UpdateConnectionDto } from "./dto/update-connection.dto";
import { ConnectionsService } from "./connections.service";

@Controller("organizations/:organizationId/connections")
export class ConnectionsController {
  public constructor(
    @Inject(ConnectionsService)
    private readonly connectionsService: ConnectionsService,
  ) {}

  @Post()
  @RequirePermissions("connection:create")
  public create(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: CreateConnectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.connectionsService.create(
      organizationId,
      user,
      accessToken,
      body,
    );
  }

  @Get()
  @RequirePermissions("connection:read")
  public list(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.connectionsService.list(organizationId, accessToken);
  }

  @Patch(":connectionId")
  @RequirePermissions("connection:update")
  public update(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("connectionId", new ParseUUIDPipe()) connectionId: string,
    @Body() body: UpdateConnectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.connectionsService.update(
      organizationId,
      connectionId,
      user,
      accessToken,
      body,
    );
  }

  @Delete(":connectionId")
  @RequirePermissions("connection:revoke")
  public revoke(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("connectionId", new ParseUUIDPipe()) connectionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.connectionsService.revoke(
      organizationId,
      connectionId,
      user,
      accessToken,
    );
  }
}
