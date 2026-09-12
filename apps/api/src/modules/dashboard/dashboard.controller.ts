import { Controller, Get, Inject, Param, ParseUUIDPipe } from "@nestjs/common";

import { AccessToken } from "../../common/auth/current-user.decorator";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { DashboardService } from "./dashboard.service";

@Controller("organizations/:organizationId/dashboard")
export class DashboardController {
  public constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  @RequirePermissions("dashboard:read")
  public get(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.dashboardService.get(organizationId, accessToken);
  }
}
