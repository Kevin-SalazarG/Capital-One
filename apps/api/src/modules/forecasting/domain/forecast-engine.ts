import Decimal from "decimal.js";

import { addDays } from "../../../common/utilities/date";
import { toDecimal } from "../../../common/utilities/money";
import type {
  ForecastEvent,
  ForecastInput,
  ForecastOutput,
  ForecastPoint,
  ForecastRecommendation,
  LiquidityGap,
} from "./forecast.types";

const SAFETY_RATE = new Decimal("0.15");

function eventsForDate(
  events: readonly ForecastEvent[],
  pointDate: string,
): ForecastEvent[] {
  return events.filter((event) => event.date === pointDate);
}

function createRecommendation(
  gap: LiquidityGap,
  events: readonly ForecastEvent[],
): ForecastRecommendation {
  const receivable = events
    .filter(
      (event) =>
        event.sourceType === "cfdi_invoice" && event.signedExpectedAmount.gt(0),
    )
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  if (receivable) {
    const estimatedImpact = Decimal.min(
      receivable.signedExpectedAmount,
      gap.amount,
    );
    return {
      type: "collect_receivable",
      title: `Collect ${receivable.label} before ${gap.gapDate}`,
      rationale: `Expected collection can reduce the projected deficit on ${gap.gapDate}.`,
      priority: gap.severity === "critical" ? "critical" : "high",
      estimatedImpact,
      sourceEventId: receivable.sourceId,
      evidence: {
        gapDate: gap.gapDate,
        gapAmount: gap.amount.toFixed(2),
        sourceDate: receivable.date,
        sourceAmount: receivable.signedExpectedAmount.toFixed(2),
      },
    };
  }

  const payable = events
    .filter(
      (event) =>
        event.sourceType === "cfdi_invoice" && event.signedExpectedAmount.lt(0),
    )
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  if (payable) {
    const estimatedImpact = Decimal.min(
      payable.signedExpectedAmount.abs(),
      gap.amount,
    );
    return {
      type: "schedule_payment",
      title: `Schedule ${payable.label} after ${gap.gapDate}`,
      rationale: `Negotiating the payment date can reduce the projected deficit.`,
      priority: gap.severity === "critical" ? "critical" : "medium",
      estimatedImpact,
      sourceEventId: payable.sourceId,
      evidence: {
        gapDate: gap.gapDate,
        gapAmount: gap.amount.toFixed(2),
        sourceDate: payable.date,
        sourceAmount: payable.signedExpectedAmount.abs().toFixed(2),
      },
    };
  }

  return {
    type: "increase_buffer",
    title: `Increase the cash buffer before ${gap.gapDate}`,
    rationale:
      "No eligible receivable or payable was available to reduce the projected gap.",
    priority: gap.severity === "critical" ? "critical" : "high",
    estimatedImpact: gap.amount,
    sourceEventId: null,
    evidence: {
      gapDate: gap.gapDate,
      gapAmount: gap.amount.toFixed(2),
    },
  };
}

export class ForecastEngine {
  public calculate(input: ForecastInput): ForecastOutput {
    const safetyThreshold = Decimal.max(
      toDecimal(input.minimumCashReserve, "minimumCashReserve"),
      toDecimal(input.averageMonthlyOutflow, "averageMonthlyOutflow").mul(
        SAFETY_RATE,
      ),
    );
    const points: ForecastPoint[] = [];
    let openingBalance = toDecimal(input.currentBalance, "currentBalance");
    let firstGap: LiquidityGap | null = null;

    for (let offset = 0; offset < input.horizonDays; offset += 1) {
      const pointDate = addDays(input.asOf, offset);
      const events = eventsForDate(input.events, pointDate);
      const inflows = events
        .filter((event) => event.signedExpectedAmount.gt(0))
        .reduce(
          (total, event) => total.plus(event.signedExpectedAmount),
          new Decimal(0),
        );
      const scheduledOutflows = events
        .filter((event) => event.signedExpectedAmount.lt(0))
        .reduce(
          (total, event) => total.plus(event.signedExpectedAmount.abs()),
          new Decimal(0),
        );
      const outflows = scheduledOutflows.plus(
        toDecimal(input.variableOutflowPerDay, "variableOutflowPerDay"),
      );
      const closingBalance = openingBalance.plus(inflows).minus(outflows);
      const gapAmount = Decimal.max(safetyThreshold.minus(closingBalance), 0);
      const point: ForecastPoint = {
        pointDate,
        openingBalance,
        inflows,
        outflows,
        closingBalance,
        safetyThreshold,
        gapAmount,
      };
      points.push(point);

      if (gapAmount.gt(0) && !firstGap) {
        firstGap = {
          gapDate: pointDate,
          amount: gapAmount,
          severity: gapAmount.gte(safetyThreshold.mul("0.5"))
            ? "critical"
            : "warning",
          explanation: `Projected balance falls below the safety threshold on ${pointDate}.`,
          evidence: {
            pointDate,
            projectedBalance: closingBalance.toFixed(2),
            safetyThreshold: safetyThreshold.toFixed(2),
          },
        };
      }

      openingBalance = closingBalance;
    }

    return {
      algorithmVersion: "rules-v1",
      safetyThreshold,
      points,
      firstGap,
      recommendation: firstGap
        ? createRecommendation(firstGap, input.events)
        : null,
      confidence: input.confidence,
    };
  }
}
