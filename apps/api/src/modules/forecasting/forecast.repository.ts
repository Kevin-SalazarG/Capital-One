import { Inject, Injectable } from "@nestjs/common";

import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import type {
  ForecastPointRow,
  ForecastRunRow,
  LiquidityGapRow,
  RecommendationRow,
} from "../../common/database/database.types";
import { forecastInputSnapshot } from "./forecast.mapper";
import type { ForecastInput, ForecastOutput } from "./domain/forecast.types";

@Injectable()
export class ForecastRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async createRun(
    organizationId: string,
    accessToken: string,
    input: ForecastInput,
    inputHash: string,
  ): Promise<ForecastRunRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("forecast_runs")
      .insert({
        organization_id: organizationId,
        status: "running",
        horizon_days: input.horizonDays,
        as_of: input.asOf,
        input_hash: inputHash,
        input_snapshot: forecastInputSnapshot(input),
        engine_version: "treasury-v2",
      })
      .select("*")
      .single();
    return assertDatabaseResult(data, error, "create forecast run");
  }

  public async completeRun(
    organizationId: string,
    accessToken: string,
    runId: string,
    output: ForecastOutput,
  ): Promise<{
    readonly points: ForecastPointRow[];
    readonly gap: LiquidityGapRow | null;
    readonly recommendation: RecommendationRow | null;
  }> {
    const client = this.supabase.createUserClient(accessToken);
    const pointRows = output.points.map((point) => ({
      forecast_run_id: runId,
      organization_id: organizationId,
      point_date: point.pointDate,
      opening_balance: point.openingBalance.toFixed(2),
      inflows: point.inflows.toFixed(2),
      outflows: point.outflows.toFixed(2),
      closing_balance: point.closingBalance.toFixed(2),
      safety_threshold: point.safetyThreshold.toFixed(2),
      gap_amount: point.gapAmount.toFixed(2),
    }));
    const { data: points, error: pointsError } = await client
      .from("forecast_points")
      .insert(pointRows)
      .select("*");
    if (pointsError) {
      throwDatabaseError(pointsError, "persist forecast points");
    }

    let gap: LiquidityGapRow | null = null;
    let recommendation: RecommendationRow | null = null;
    if (output.firstGap) {
      const { data: gapData, error: gapError } = await client
        .from("liquidity_gaps")
        .insert({
          organization_id: organizationId,
          forecast_run_id: runId,
          gap_date: output.firstGap.gapDate,
          amount: output.firstGap.amount.toFixed(2),
          severity: output.firstGap.severity,
          explanation: output.firstGap.explanation,
          evidence: output.firstGap.evidence,
        })
        .select("*")
        .single();
      gap = assertDatabaseResult(gapData, gapError, "persist liquidity gap");

      if (output.recommendation) {
        const { data: recommendationData, error: recommendationError } =
          await client
            .from("recommendations")
            .insert({
              organization_id: organizationId,
              forecast_run_id: runId,
              liquidity_gap_id: gap.id,
              type: output.recommendation.type,
              title: output.recommendation.title,
              rationale: output.recommendation.rationale,
              priority: output.recommendation.priority,
              estimated_impact:
                output.recommendation.estimatedImpact.toFixed(2),
              evidence: output.recommendation.evidence,
            })
            .select("*")
            .single();
        recommendation = assertDatabaseResult(
          recommendationData,
          recommendationError,
          "persist forecast recommendation",
        );
      }
    }

    const { error: updateError } = await client
      .from("forecast_runs")
      .update({ status: "completed", finished_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("organization_id", organizationId);
    if (updateError) {
      throwDatabaseError(updateError, "complete forecast run");
    }

    return { points, gap, recommendation };
  }

  public async markFailed(
    organizationId: string,
    accessToken: string,
    runId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    const client = this.supabase.createUserClient(accessToken);
    const { error } = await client
      .from("forecast_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_code: errorCode,
        error_message: errorMessage.slice(0, 500),
      })
      .eq("id", runId)
      .eq("organization_id", organizationId);
    if (error) {
      throwDatabaseError(error, "mark forecast run as failed");
    }
  }

  public async getLatest(
    organizationId: string,
    accessToken: string,
  ): Promise<ForecastRunRow | null> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("forecast_runs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "get latest forecast run");
    }
    return data;
  }

  public async getPoints(
    organizationId: string,
    forecastRunId: string,
    accessToken: string,
  ): Promise<ForecastPointRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("forecast_points")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("forecast_run_id", forecastRunId)
      .order("point_date", { ascending: true });
    if (error) {
      throwDatabaseError(error, "get forecast points");
    }
    return data;
  }

  public async listGaps(
    organizationId: string,
    accessToken: string,
  ): Promise<LiquidityGapRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("liquidity_gaps")
      .select("*")
      .eq("organization_id", organizationId)
      .order("gap_date", { ascending: true });
    if (error) {
      throwDatabaseError(error, "list liquidity gaps");
    }
    return data;
  }

  public async listRecommendations(
    organizationId: string,
    accessToken: string,
  ): Promise<RecommendationRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("recommendations")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) {
      throwDatabaseError(error, "list recommendations");
    }
    return data;
  }

  public async updateRecommendation(
    organizationId: string,
    recommendationId: string,
    accessToken: string,
    status: RecommendationRow["status"],
  ): Promise<RecommendationRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("recommendations")
      .update({ status })
      .eq("organization_id", organizationId)
      .eq("id", recommendationId)
      .select("*")
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "update recommendation");
    }
    return assertDatabaseResult(data, null, "update recommendation");
  }

  public async updateGap(
    organizationId: string,
    gapId: string,
    accessToken: string,
    status: LiquidityGapRow["status"],
  ): Promise<LiquidityGapRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("liquidity_gaps")
      .update({ status })
      .eq("organization_id", organizationId)
      .eq("id", gapId)
      .select("*")
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "update liquidity gap");
    }
    return assertDatabaseResult(data, null, "update liquidity gap");
  }
}
