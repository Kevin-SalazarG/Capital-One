import Decimal from "decimal.js";
import {
  ENGINE_VERSION,
  treasuryInputSchema,
  type Projection,
  type Treasury,
  type TreasuryAction,
  type TreasuryInput,
  type TreasuryPlan,
} from "./treasury-contract";
import { addDays } from "./treasury-date";

function isProtected(event: TreasuryInput["events"][number]): boolean {
  return (
    event.critical || event.category === "payroll" || event.category === "tax"
  );
}

/** Pure cash ledger: a moved event replaces its original, never duplicates it. */
export function project(
  input: TreasuryInput,
  actions: readonly TreasuryAction[] = [],
): Projection {
  const seen = new Set<string>();
  const end = addDays(input.asOf, input.horizonDays - 1);
  for (const action of actions) {
    const event = input.events.find((item) => item.id === action.eventId);
    if (
      !event ||
      seen.has(event.id) ||
      isProtected(event) ||
      action.from !== event.date ||
      action.to < input.asOf ||
      action.to > end ||
      !new Decimal(action.amount).eq(
        new Decimal(event.amount).abs().toDecimalPlaces(2),
      ) ||
      !new Decimal(action.cost).eq(
        new Decimal(event.negotiationCost).toDecimalPlaces(2),
      ) ||
      (action.kind === "collect"
        ? new Decimal(event.amount).lte(0) ||
          !event.earliestDate ||
          action.to < event.earliestDate ||
          action.to >= event.date
        : new Decimal(event.amount).gte(0) ||
          !event.latestDate ||
          action.to > event.latestDate ||
          action.to <= event.date)
    ) {
      throw new Error("Invalid or infeasible treasury action");
    }
    seen.add(event.id);
  }
  let balance = new Decimal(input.currentBalance).toDecimalPlaces(2);
  const reserve = new Decimal(input.reserve).toDecimalPlaces(2);
  const points: Projection["points"] = [];
  for (let offset = 0; offset < input.horizonDays; offset++) {
    const date = addDays(input.asOf, offset);
    const events = input.events.filter(
      (event) =>
        (actions.find((a) => a.eventId === event.id)?.to ?? event.date) ===
        date,
    );
    let inflows = new Decimal(0);
    let outflows = new Decimal(input.dailyOperatingExpense).toDecimalPlaces(2);
    let criticalAmount = new Decimal(0);
    for (const event of events) {
      const amount = new Decimal(event.amount).toDecimalPlaces(2);
      if (amount.gt(0)) inflows = inflows.plus(amount);
      else outflows = outflows.minus(amount);
      if (isProtected(event) && amount.lt(0))
        criticalAmount = criticalAmount.minus(amount);
      const action = actions.find((a) => a.eventId === event.id);
      if (action)
        outflows = outflows.plus(new Decimal(action.cost).toDecimalPlaces(2));
    }
    const closing = balance.plus(inflows).minus(outflows).toDecimalPlaces(2);
    points.push({
      date,
      opening: balance.toFixed(2),
      inflows: inflows.toFixed(2),
      outflows: outflows.toFixed(2),
      closing: closing.toFixed(2),
      criticalAmount: criticalAmount.toFixed(2),
      events: events.map((e) => e.id),
    });
    balance = closing;
  }
  const worst = points.reduce((a, b) =>
    new Decimal(b.closing).lt(a.closing) ? b : a,
  );
  return {
    points,
    summary: {
      minimumBalance: worst.closing,
      worstDate: worst.date,
      reserveShortfall: Decimal.max(reserve.minus(worst.closing), 0).toFixed(2),
      cashShortfall: Decimal.max(
        new Decimal(worst.closing).negated(),
        0,
      ).toFixed(2),
      daysBelowReserve: points.filter((p) => new Decimal(p.closing).lt(reserve))
        .length,
      criticalAtRisk: points.filter(
        (p) =>
          new Decimal(p.criticalAmount).gt(0) && new Decimal(p.closing).lt(0),
      ).length,
      firstRiskDate:
        points.find((p) => new Decimal(p.closing).lt(reserve))?.date ?? null,
    },
  };
}

/** Bounded, explainable search: singles and pairs of up to 12 eligible movements. */
export function buildTreasury(
  raw: TreasuryInput,
  inputHash = "demo",
): Treasury {
  const input = treasuryInputSchema.parse(raw);
  const ids = new Set(input.events.map((event) => event.id));
  if (ids.size !== input.events.length) throw new Error("Duplicate cash event");
  const baseline = project(input);
  const gap = baseline.summary.firstRiskDate;
  const end = addDays(input.asOf, input.horizonDays - 1);
  const actions: TreasuryAction[] = [];
  if (gap)
    for (const event of input.events) {
      if (isProtected(event)) continue;
      const amount = new Decimal(event.amount);
      const collect = amount.gt(0);
      const to = collect ? event.earliestDate : event.latestDate;
      if (!to || to < input.asOf || to > end || event.date < input.asOf)
        continue;
      if (
        collect
          ? event.date <= gap || to >= gap || to >= event.date
          : event.date > gap || to <= gap || to <= event.date
      )
        continue;
      actions.push({
        id: `${event.id}:${to}`,
        eventId: event.id,
        label: event.label,
        kind: collect ? "collect" : "defer",
        from: event.date,
        to,
        amount: amount.abs().toFixed(2),
        cost: new Decimal(event.negotiationCost).toFixed(2),
      });
    }
  const pool = actions
    .sort(
      (a, b) =>
        new Decimal(b.amount).comparedTo(a.amount) || a.id.localeCompare(b.id),
    )
    .slice(0, 12);
  const combinations: TreasuryAction[][] = pool.map((a) => [a]);
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) {
      const first = pool[i];
      const second = pool[j];
      if (first && second) combinations.push([first, second]);
    }
  const plans: TreasuryPlan[] = combinations
    .map((moves) => {
      const first = moves[0];
      if (!first) throw new Error("A plan must contain an action");
      const projection = project(input, moves);
      return {
        id: moves
          .map((a) => a.id)
          .sort()
          .join("|"),
        title:
          moves.length > 1
            ? "Combinar cobros y acuerdos"
            : first.kind === "collect"
              ? "Adelantar un cobro"
              : "Negociar un pago",
        actions: moves,
        cost: moves
          .reduce((sum, a) => sum.plus(a.cost), new Decimal(0))
          .toFixed(2),
        improvement: Decimal.max(
          new Decimal(baseline.summary.reserveShortfall).minus(
            projection.summary.reserveShortfall,
          ),
          0,
        ).toFixed(2),
        projection,
      };
    })
    .filter(
      (p) =>
        p.projection.summary.criticalAtRisk < baseline.summary.criticalAtRisk ||
        new Decimal(p.improvement).gt(0) ||
        p.projection.summary.daysBelowReserve <
          baseline.summary.daysBelowReserve,
    )
    .sort(
      (a, b) =>
        a.projection.summary.criticalAtRisk -
          b.projection.summary.criticalAtRisk ||
        new Decimal(a.projection.summary.reserveShortfall).comparedTo(
          b.projection.summary.reserveShortfall,
        ) ||
        new Decimal(a.cost).comparedTo(b.cost) ||
        a.actions.length - b.actions.length ||
        a.id.localeCompare(b.id),
    );
  return {
    version: ENGINE_VERSION,
    inputHash,
    input,
    baseline,
    plans: plans.slice(0, 3),
    criticalEvents: input.events
      .filter(
        (event) =>
          isProtected(event) &&
          new Decimal(event.amount).lt(0) &&
          event.date >= input.asOf &&
          event.date <= end,
      )
      .sort((a, b) => a.date.localeCompare(b.date)),
    decision: null,
  };
}

/** This is a stress test chosen by the user, not an estimated probability. */
export function delayReceipt(
  input: TreasuryInput,
  eventId: string,
  days = 7,
): TreasuryInput {
  return {
    ...input,
    events: input.events.map((event) =>
      event.id === eventId && new Decimal(event.amount).gt(0)
        ? { ...event, date: addDays(event.date, days), earliestDate: null }
        : event,
    ),
  };
}
