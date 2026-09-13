import type { JsonValue } from "../../common/types/json-value";
import type { ForecastInput, ForecastOutput } from "./domain/forecast.types";

export function forecastInputSnapshot(input: ForecastInput): JsonValue {
  return {
    asOf: input.asOf,
    horizonDays: input.horizonDays,
    currentBalance: input.currentBalance.toFixed(2),
    minimumCashReserve: input.minimumCashReserve.toFixed(2),
    averageMonthlyOutflow: input.averageMonthlyOutflow.toFixed(2),
    variableOutflowPerDay: input.variableOutflowPerDay.toFixed(2),
    confidence: input.confidence,
    engineVersion: "treasury-v2",
    currency: input.currency ?? "MXN",
    warnings: [...(input.warnings ?? [])],
    events: input.events.map((event) => ({
      id: event.id,
      date: event.date,
      signedExpectedAmount: event.signedExpectedAmount.toFixed(2),
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      label: event.label,
      confidence: event.confidence,
      category: event.category ?? "other",
      critical: event.critical ?? false,
      earliestDate: event.earliestDate ?? null,
      latestDate: event.latestDate ?? null,
      negotiationCost: event.negotiationCost ?? "0.00",
    })),
  };
}

export function forecastOutputView(output: ForecastOutput): JsonValue {
  return {
    algorithmVersion: output.algorithmVersion,
    confidence: output.confidence,
    safetyThreshold: output.safetyThreshold.toFixed(2),
    firstGap: output.firstGap
      ? {
          date: output.firstGap.gapDate,
          amount: output.firstGap.amount.toFixed(2),
          severity: output.firstGap.severity,
          explanation: output.firstGap.explanation,
          evidence: output.firstGap.evidence,
        }
      : null,
    recommendation: output.recommendation
      ? {
          type: output.recommendation.type,
          title: output.recommendation.title,
          rationale: output.recommendation.rationale,
          priority: output.recommendation.priority,
          estimatedImpact: output.recommendation.estimatedImpact.toFixed(2),
          sourceEventId: output.recommendation.sourceEventId,
          evidence: output.recommendation.evidence,
        }
      : null,
  };
}
