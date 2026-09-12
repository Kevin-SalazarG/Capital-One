import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";

import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { MembersService } from "./members.service";

@Controller("organizations/:organizationId/members")
export class MembersController {
  public constructor(
    @Inject(MembersService) private readonly membersService: MembersService,
  ) {}

  @Get()
  @RequirePermissions("member:read")
  public list(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.membersService.list(organizationId, accessToken);
  }

  @Post()
  @RequirePermissions("member:invite")
  public invite(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: InviteMemberDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.membersService.invite(organizationId, user, accessToken, body);
  }

  @Patch(":userId")
  @RequirePermissions("member:update")
  public updateRole(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("userId", new ParseUUIDPipe()) userId: string,
    @Body() body: UpdateMemberDto,
    @CurrentUser() actor: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.membersService.updateRole(
      organizationId,
      userId,
      actor,
      accessToken,
      body.role,
    );
  }

  @Delete(":userId")
  @RequirePermissions("member:remove")
  public remove(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("userId", new ParseUUIDPipe()) userId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.membersService.remove(
      organizationId,
      userId,
      actor,
      accessToken,
    );
  }
}
