import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { ForecastRepository } from "./forecast.repository";
import { GenerateForecastUseCase } from "./generate-forecast.use-case";

@Injectable()
export class ForecastingService {
  public constructor(
    @Inject(GenerateForecastUseCase)
    private readonly generateForecast: GenerateForecastUseCase,
    @Inject(ForecastRepository) private readonly repository: ForecastRepository,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public async run(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    horizonDays: number,
  ) {
    const result = await this.generateForecast.execute(
      organizationId,
      accessToken,
      horizonDays,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "forecast.generated",
      resourceType: "forecast_run",
      resourceId: result.run.id,
      metadata: {
        horizonDays,
        algorithmVersion: "rules-v1",
        hasGap: result.persisted.gap !== null,
      },
    });
    return result;
  }

  public latest(organizationId: string, accessToken: string) {
    return this.repository.getLatest(organizationId, accessToken);
  }

  public points(
    organizationId: string,
    forecastRunId: string,
    accessToken: string,
  ) {
    return this.repository.getPoints(
      organizationId,
      forecastRunId,
      accessToken,
    );
  }

  public gaps(organizationId: string, accessToken: string) {
    return this.repository.listGaps(organizationId, accessToken);
  }

  public recommendations(organizationId: string, accessToken: string) {
    return this.repository.listRecommendations(organizationId, accessToken);
  }

  public async updateRecommendation(
    organizationId: string,
    recommendationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    status: "open" | "accepted" | "dismissed" | "completed",
  ) {
    const recommendation = await this.repository.updateRecommendation(
      organizationId,
      recommendationId,
      accessToken,
      status,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "recommendation.updated",
      resourceType: "recommendation",
      resourceId: recommendation.id,
      metadata: { status },
    });
    return recommendation;
  }

  public async updateGap(
    organizationId: string,
    gapId: string,
    user: AuthenticatedUser,
    accessToken: string,
    status: "open" | "resolved" | "ignored",
  ) {
    const gap = await this.repository.updateGap(
      organizationId,
      gapId,
      accessToken,
      status,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "liquidity_gap.updated",
      resourceType: "liquidity_gap",
      resourceId: gap.id,
      metadata: { status },
    });
    return gap;
  }
}
