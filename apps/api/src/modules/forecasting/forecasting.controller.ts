import {
  Body,
  Controller,
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
import { CreateForecastRunDto } from "./dto/create-forecast-run.dto";
import { UpdateLiquidityGapDto } from "./dto/update-liquidity-gap.dto";
import { UpdateRecommendationDto } from "./dto/update-recommendation.dto";
import { ForecastingService } from "./forecasting.service";

@Controller("organizations/:organizationId")
export class ForecastingController {
  public constructor(
    @Inject(ForecastingService)
    private readonly forecastingService: ForecastingService,
  ) {}

  @Post("forecasts/runs")
  @RequirePermissions("forecast:run")
  public run(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: CreateForecastRunDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.forecastingService.run(
      organizationId,
      user,
      accessToken,
      body.horizonDays,
    );
  }

  @Get("forecasts/latest")
  @RequirePermissions("forecast:read")
  public latest(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.forecastingService.latest(organizationId, accessToken);
  }

  @Get("forecasts/:forecastId/points")
  @RequirePermissions("forecast:read")
  public points(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("forecastId", new ParseUUIDPipe()) forecastId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.forecastingService.points(
      organizationId,
      forecastId,
      accessToken,
    );
  }

  @Get("liquidity-gaps")
  @RequirePermissions("liquidity-gap:read")
  public gaps(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.forecastingService.gaps(organizationId, accessToken);
  }

  @Patch("liquidity-gaps/:gapId")
  @RequirePermissions("liquidity-gap:update")
  public updateGap(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("gapId", new ParseUUIDPipe()) gapId: string,
    @Body() body: UpdateLiquidityGapDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.forecastingService.updateGap(
      organizationId,
      gapId,
      user,
      accessToken,
      body.status,
    );
  }

  @Get("recommendations")
  @RequirePermissions("recommendation:read")
  public recommendations(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.forecastingService.recommendations(organizationId, accessToken);
  }

  @Patch("recommendations/:recommendationId")
  @RequirePermissions("recommendation:update")
  public updateRecommendation(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("recommendationId", new ParseUUIDPipe()) recommendationId: string,
    @Body() body: UpdateRecommendationDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.forecastingService.updateRecommendation(
      organizationId,
      recommendationId,
      user,
      accessToken,
      body.status,
    );
  }
}
