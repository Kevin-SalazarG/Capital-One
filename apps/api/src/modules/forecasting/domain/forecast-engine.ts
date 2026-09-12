import Decimal from "decimal.js";
import { buildTreasury } from "@colchon/treasury/treasury-engine";
import { treasuryInput } from "./treasury-input.mapper";
import type {
  ForecastInput,
  ForecastOutput,
  ForecastRecommendation,
} from "./forecast.types";

/** The persisted legacy endpoint uses the same ledger and feasible plans as the cockpit. */
export class ForecastEngine {
  public calculate(input: ForecastInput): ForecastOutput {
    const safetyThreshold = Decimal.max(
      input.minimumCashReserve,
      input.averageMonthlyOutflow.mul("0.15"),
    );
    const model = buildTreasury(
      treasuryInput({ ...input, minimumCashReserve: safetyThreshold }),
    );
    const points = model.baseline.points.map((point) => ({
      pointDate: point.date,
      openingBalance: new Decimal(point.opening),
      inflows: new Decimal(point.inflows),
      outflows: new Decimal(point.outflows),
      closingBalance: new Decimal(point.closing),
      safetyThreshold,
      gapAmount: Decimal.max(safetyThreshold.minus(point.closing), 0),
    }));
    const gap = points.find((point) => point.gapAmount.gt(0));
    const firstGap = gap
      ? {
          gapDate: gap.pointDate,
          amount: gap.gapAmount,
          severity: gap.closingBalance.lt(0)
            ? ("critical" as const)
            : ("warning" as const),
          explanation:
            "El saldo al cierre queda debajo de la reserva configurada. Un saldo positivo no implica impago.",
          evidence: {
            pointDate: gap.pointDate,
            projectedBalance: gap.closingBalance.toFixed(2),
            safetyThreshold: safetyThreshold.toFixed(2),
          },
        }
      : null;
    const best = model.plans[0];
    const action = best?.actions[0];
    let recommendation: ForecastRecommendation | null = null;
    if (firstGap)
      recommendation =
        action && best
          ? {
              type:
                action.kind === "collect"
                  ? "collect_receivable"
                  : "schedule_payment",
              title: best.title,
              rationale:
                "Plan condicionado a acuerdos. Compara todos los movimientos en Plan de caja antes de actuar.",
              priority: "high",
              estimatedImpact: new Decimal(best.improvement),
              sourceEventId: action.eventId,
              evidence: {
                gapDate: firstGap.gapDate,
                gapAmount: model.baseline.summary.reserveShortfall,
                sourceDate: action.from,
                targetDate: action.to,
                sourceAmount: action.amount,
                cost: best.cost,
                residual: best.projection.summary.reserveShortfall,
              },
            }
          : {
              type: "increase_buffer",
              title: "Revisar la liquidez adicional necesaria",
              rationale:
                "No hay acuerdos elegibles. Una reserva objetivo no crea dinero; este monto cubre el peor día del horizonte.",
              priority: "high",
              estimatedImpact: new Decimal(
                model.baseline.summary.reserveShortfall,
              ),
              sourceEventId: null,
              evidence: {
                gapDate: firstGap.gapDate,
                gapAmount: model.baseline.summary.reserveShortfall,
              },
            };
    return {
      algorithmVersion: "treasury-v2",
      safetyThreshold,
      points,
      firstGap,
      recommendation,
      confidence: input.confidence,
    };
  }
}
