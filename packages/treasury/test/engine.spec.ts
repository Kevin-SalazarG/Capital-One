import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Decimal from "decimal.js";
import { z } from "zod";
import { buildTreasury, delayReceipt, project } from "../src/treasury-engine";
import { createDemoInput } from "../src/treasury-demo";
import {
  treasurySchema,
  treasuryInputSchema,
  type TreasuryInput,
} from "../src/treasury-contract";

function present<T>(value: T | undefined): T {
  assert.notEqual(value, undefined);
  if (value === undefined) throw new Error("Missing test fixture");
  return value;
}
function event(input: TreasuryInput, id: string) {
  return present(input.events.find((item) => item.id === id));
}

test("demo is a reproducible ledger, not hand-drawn balances", () => {
  const model = buildTreasury(createDemoInput());
  assert.equal(model.baseline.summary.minimumBalance, "-14000.00");
  assert.equal(model.baseline.summary.reserveShortfall, "54000.00");
  assert.equal(model.baseline.summary.criticalAtRisk, 1);
  const best = present(model.plans[0]);
  assert.equal(present(best.actions[0]).label, "Hotel Alameda");
  assert.equal(best.projection.summary.minimumBalance, "41700.00");
  assert.equal(best.projection.summary.criticalAtRisk, 0);
  assert.ok(treasurySchema.safeParse(model).success);
});

test("offline frontend snapshots exactly reproduce the server engine", () => {
  const snapshots = z
    .record(z.string(), treasurySchema)
    .parse(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "../../apps/web/src/demo/treasury-snapshots.json",
          ),
          "utf8",
        ),
      ),
    );
  const input = createDemoInput();
  for (const [key, snapshot] of Object.entries(snapshots)) {
    const id = new URL(key, "http://fixture.local").searchParams.get(
      "delayedReceiptId",
    );
    assert.deepEqual(
      snapshot,
      buildTreasury(id ? delayReceipt(input, id) : input, snapshot.inputHash),
    );
  }
});

test("a receipt replaces its original date and final cash changes only by cost", () => {
  const model = buildTreasury(createDemoInput());
  const plan = present(
    model.plans.find(
      (p) => p.actions.length === 1 && p.actions[0]?.eventId === "roble",
    ),
  );
  const action = present(plan.actions[0]);
  assert.equal(
    present(plan.projection.points.find((p) => p.date === action.from)).inflows,
    "0.00",
  );
  assert.equal(
    present(plan.projection.points.find((p) => p.date === action.to)).inflows,
    "65000.00",
  );
  assert.equal(
    new Decimal(present(model.baseline.points.at(-1)).closing)
      .minus(present(plan.projection.points.at(-1)).closing)
      .toFixed(2),
    "1300.00",
  );
});

test("payments cannot be pushed beyond the horizon to hide a gap", () => {
  const input = createDemoInput();
  event(input, "materials").latestDate = "2027-01-01";
  assert.ok(
    buildTreasury(input).plans.every((p) =>
      p.actions.every((a) => a.eventId !== "materials"),
    ),
  );
});

test("already-counted receipts and critical payments are not candidates", () => {
  const input = createDemoInput();
  event(input, "senda").earliestDate = "2026-09-13";
  event(input, "payroll").latestDate = "2026-10-01";
  const model = buildTreasury(input);
  assert.ok(
    model.plans.every((p) =>
      p.actions.every((a) => !["payroll", "senda"].includes(a.eventId)),
    ),
  );
  for (const plan of model.plans)
    assert.equal(
      present(plan.projection.points.find((p) => p.date === "2026-09-25"))
        .criticalAmount,
      "118000.00",
    );
});

test("payroll and tax categories remain protected even if an input flag is false", () => {
  const input = createDemoInput();
  for (const id of ["tax", "payroll"]) {
    event(input, id).critical = false;
    event(input, id).latestDate = "2026-10-01";
  }
  const model = buildTreasury(input);
  assert.equal(model.baseline.summary.criticalAtRisk, 1);
  assert.ok(model.criticalEvents.some((item) => item.id === "payroll"));
  assert.ok(
    model.plans.every((p) =>
      p.actions.every((a) => !["payroll", "tax"].includes(a.eventId)),
    ),
  );
});

test("no declared flexibility means no invented agreement", () => {
  const input = createDemoInput();
  input.events = input.events.map((e) => ({
    ...e,
    earliestDate: null,
    latestDate: null,
  }));
  assert.deepEqual(buildTreasury(input).plans, []);
});

test("stress is immutable and cannot accelerate the delayed receipt", () => {
  const input = createDemoInput();
  const delayed = delayReceipt(input, "alameda");
  assert.equal(event(input, "alameda").date, "2026-10-04");
  assert.equal(event(delayed, "alameda").date, "2026-10-11");
  assert.ok(
    buildTreasury(delayed).plans.every((p) =>
      p.actions.every((a) => a.eventId !== "alameda"),
    ),
  );
});

test("funding uses the worst day, not just the first crossing", () => {
  const input = treasuryInputSchema.parse({
    asOf: "2026-09-12",
    horizonDays: 3,
    currency: "MXN",
    currentBalance: "100",
    reserve: "90",
    dailyOperatingExpense: "20",
    events: [],
  });
  const result = project(input);
  assert.equal(result.summary.firstRiskDate, "2026-09-12");
  assert.equal(result.summary.reserveShortfall, "50.00");
  assert.equal(result.summary.cashShortfall, "0.00");
});

test("decimal money is exact and no-risk inputs have no unnecessary plans", () => {
  const input = treasuryInputSchema.parse({
    asOf: "2026-09-12",
    horizonDays: 3,
    currency: "MXN",
    currentBalance: "0.30",
    reserve: "0",
    dailyOperatingExpense: "0.10",
    events: [],
  });
  const result = buildTreasury(input);
  assert.equal(present(result.baseline.points.at(-1)).closing, "0.00");
  assert.deepEqual(result.plans, []);
});

test("forged amounts, double movements and impossible dates are rejected", () => {
  const input = createDemoInput();
  const action = present(present(buildTreasury(input).plans[0]).actions[0]);
  assert.throws(() => project(input, [action, action]));
  assert.throws(() => project(input, [{ ...action, amount: "999999" }]));
  assert.throws(() => project(input, [{ ...action, cost: "-100" }]));
  assert.throws(() => project(input, [{ ...action, to: "2026-08-01" }]));
  assert.throws(() => buildTreasury({ ...input, asOf: "2026-02-30" }));
  assert.throws(() =>
    buildTreasury({
      ...input,
      events: [...input.events, present(input.events[0])],
    }),
  );
});

test("ranked plans maintain every daily ledger identity, including fractional inputs", () => {
  for (const currentBalance of ["185000.00", "185000.0050"]) {
    const input = { ...createDemoInput(), currentBalance };
    const model = buildTreasury(input);
    for (const projection of [
      model.baseline,
      ...model.plans.map((p) => p.projection),
    ]) {
      projection.points.forEach((point, index) => {
        assert.equal(
          new Decimal(point.opening)
            .plus(point.inflows)
            .minus(point.outflows)
            .toFixed(2),
          point.closing,
        );
        if (index)
          assert.equal(
            point.opening,
            present(projection.points[index - 1]).closing,
          );
      });
    }
  }
});
