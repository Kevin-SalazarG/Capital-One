import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Req,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { requestScope } from "../../platform/http/request-scope.js";
import { AuthGuard } from "../auth/auth-guard.js";
import type { AuthenticatedRequest } from "../auth/auth-guard.js";
import { forecastQuerySchema } from "../planning/planning-schemas.js";
import type { ForecastOptions } from "../planning/planning-schemas.js";
import { dashboardSchema } from "./dashboard-schema.js";
import type { DashboardResult } from "./dashboard-schema.js";
import { DashboardService } from "./dashboard.service.js";

@Controller("businesses/:businessId/dashboard")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}
  @Get()
  @ApiOperation({ operationId: "getDashboard" })
  @ApiResponse({ status: 200, standardSchema: dashboardSchema })
  @SerializeOptions({ schema: dashboardSchema })
  get(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Query({ schema: forecastQuerySchema }) options: ForecastOptions,
  ): Promise<DashboardResult> {
    return this.dashboard.get(requestScope(request, businessId), options);
  }
}
