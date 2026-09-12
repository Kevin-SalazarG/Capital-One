import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";

import { AppError } from "../../common/errors/app-error";
import { toIsoDate } from "../../common/utilities/date";
import { toDecimal } from "../../common/utilities/money";
import { BankDataRepository } from "../bank-data/bank-data.repository";
import { ConnectionsRepository } from "../connections/connections.repository";
import { OrganizationsRepository } from "../organizations/organizations.repository";
import { ForecastRepository } from "../forecasting/forecast.repository";

@Injectable()
export class DashboardService {
  public constructor(
    @Inject(OrganizationsRepository)
    private readonly organizations: OrganizationsRepository,
    @Inject(BankDataRepository) private readonly bankData: BankDataRepository,
    @Inject(ConnectionsRepository)
    private readonly connections: ConnectionsRepository,
    @Inject(ForecastRepository) private readonly forecasts: ForecastRepository,
  ) {}

  public async get(organizationId: string, accessToken: string) {
    const [organization, accounts, connections, run] = await Promise.all([
      this.organizations.getById(organizationId, accessToken),
      this.bankData.listAccounts(organizationId, accessToken),
      this.connections.list(organizationId, accessToken),
      this.forecasts.getLatest(organizationId, accessToken),
    ]);
    if (!run) {
      throw new AppError("Run a forecast before opening the dashboard", {
        code: "FORECAST_INPUTS_INCOMPLETE",
        status: 422,
      });
    }

    const [points, gaps, recommendations] = await Promise.all([
      this.forecasts.getPoints(organizationId, run.id, accessToken),
      this.forecasts.listGaps(organizationId, accessToken),
      this.forecasts.listRecommendations(organizationId, accessToken),
    ]);
    const currentBalance = accounts.reduce(
      (total, account) =>
        total.plus(toDecimal(account.balance, "account balance")),
      new Decimal(0),
    );
    const lastSyncedAt =
      connections
        .filter((connection) => connection.kind === "bank")
        .map((connection) => connection.last_synced_at)
        .filter((value): value is string => value !== null)
        .sort()
        .at(-1) ?? null;
    const firstGap =
      gaps.find(
        (gap) => gap.forecast_run_id === run.id && gap.status === "open",
      ) ?? null;
    const runRecommendations = recommendations.filter(
      (candidate) => candidate.forecast_run_id === run.id,
    );
    const recommendation =
      runRecommendations.find(
        (candidate) =>
          candidate.liquidity_gap_id === firstGap?.id &&
          candidate.status === "open",
      ) ??
      runRecommendations[0] ??
      null;

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        currency: organization.currency,
        timeZone: organization.time_zone,
      },
      asOf: toIsoDate(run.as_of, "dashboard date"),
      currentBalance: currentBalance.toFixed(2),
      safetyThreshold: points[0]?.safety_threshold ?? "0.00",
      forecast: points.map((point) => ({
        date: point.point_date,
        openingBalance: point.opening_balance,
        projectedBalance: point.closing_balance,
        inflows: point.inflows,
        outflows: point.outflows,
        isBelowThreshold: toDecimal(point.gap_amount).gt(0),
      })),
      gap: firstGap
        ? {
            date: firstGap.gap_date,
            deficit: firstGap.amount,
            severity: firstGap.severity,
            explanation: firstGap.explanation,
          }
        : null,
      recommendation: recommendation
        ? {
            id: recommendation.id,
            type: recommendation.type,
            title: recommendation.title,
            amount: recommendation.estimated_impact,
            status: recommendation.status,
            evidence: recommendation.evidence,
          }
        : null,
      dataFreshness: {
        bankLastSyncedAt: lastSyncedAt,
        forecastCompletedAt: run.finished_at,
      },
    };
  }
}
