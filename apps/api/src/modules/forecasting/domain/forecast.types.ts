import type Decimal from "decimal.js";

export type ForecastConfidence = "low" | "medium" | "high";

export interface ForecastEvent {
  readonly id: string;
  readonly date: string;
  readonly signedExpectedAmount: Decimal;
  readonly sourceType: "cfdi_invoice" | "recurring_obligation";
  readonly sourceId: string;
  readonly label: string;
  readonly confidence: ForecastConfidence;
}

export interface ForecastInput {
  readonly asOf: string;
  readonly horizonDays: number;
  readonly currentBalance: Decimal;
  readonly minimumCashReserve: Decimal;
  readonly averageMonthlyOutflow: Decimal;
  readonly variableOutflowPerDay: Decimal;
  readonly events: readonly ForecastEvent[];
  readonly confidence: ForecastConfidence;
}

export interface ForecastPoint {
  readonly pointDate: string;
  readonly openingBalance: Decimal;
  readonly inflows: Decimal;
  readonly outflows: Decimal;
  readonly closingBalance: Decimal;
  readonly safetyThreshold: Decimal;
  readonly gapAmount: Decimal;
}

export interface LiquidityGap {
  readonly gapDate: string;
  readonly amount: Decimal;
  readonly severity: "warning" | "critical";
  readonly explanation: string;
  readonly evidence: Readonly<Record<string, string>>;
}

export interface ForecastRecommendation {
  readonly type:
    | "collect_receivable"
    | "schedule_payment"
    | "reduce_outflow"
    | "increase_buffer";
  readonly title: string;
  readonly rationale: string;
  readonly priority: "low" | "medium" | "high" | "critical";
  readonly estimatedImpact: Decimal;
  readonly sourceEventId: string | null;
  readonly evidence: Readonly<Record<string, string>>;
}

export interface ForecastOutput {
  readonly algorithmVersion: "rules-v1";
  readonly safetyThreshold: Decimal;
  readonly points: readonly ForecastPoint[];
  readonly firstGap: LiquidityGap | null;
  readonly recommendation: ForecastRecommendation | null;
  readonly confidence: ForecastConfidence;
}
