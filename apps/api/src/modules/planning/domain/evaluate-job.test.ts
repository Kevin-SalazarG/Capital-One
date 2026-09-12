import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { referenceForecast, referenceJob } from "../../../../test/fixtures/financial-reference.js";
import { evaluateJob } from "./evaluate-job.js";
import { calculateForecast } from "./forecast-engine.js";
import { deriveJobEvents } from "./job-events.js";
import { jobEvaluationResultSchema, jobInputSchema } from "./job-schema.js";
import { money } from "./money.js";

describe("evaluateJob", () => {
  it("finds the reference minimum advance and supplier schedule without creating income", () => {
    const result = evaluateJob(referenceForecast(), referenceJob());
    expect(result.original.forecast.worstCase?.minimumBalance).toBe("-20000.00");
    expect(result.alternatives[0]).toMatchObject({
      id: "advance:2026-09-17",
      selection: { kind: "advance", amount: "30000.00", date: "2026-09-17" },
      feasibility: "feasible",
      totalJobIncome: "60000.00",
      totalJobCost: "40000.00",
    });
    expect(result.alternatives[0]?.forecast.worstCase).toMatchObject({
      minimumBalance: "10000.00",
      unconditionalCapacity: "0.00",
    });
    expect(result.alternatives[1]).toMatchObject({
      feasibility: "feasible",
      totalJobCost: "40000.00",
      knownFees: "0.00",
    });
    expect(result.alternatives[1]?.forecast.worstCase?.minimumBalance).toBe("10000.00");
    expect(result.alternatives[1]?.pendingConditions.map((condition) => condition.kind)).toEqual([
      "supplier_agreement",
      "delivery",
    ]);
    expect(result.searchStatus).toBe("feasible_alternative");
    expect(v.safeParse(jobEvaluationResultSchema, result).success).toBe(true);
  });

  it("returns no sufficient alternative when the advance is capped at 20,000", () => {
    const result = evaluateJob(referenceForecast(), {
      ...referenceJob(),
      advance: { maximumAmount: "20000.00", allowedDates: ["2026-09-17"] },
      supplierOptions: [],
    });
    expect(result.alternatives[0]).toMatchObject({
      feasibility: "infeasible",
      selection: { amount: "20000.00" },
    });
    expect(result.alternatives[0]?.forecast.worstCase).toMatchObject({
      minimumBalance: "0.00",
      protectionGap: "10000.00",
    });
    expect(result.searchStatus).toBe("no_feasible_alternative");
  });

  it("does not use a payroll-day advance to fund payroll", () => {
    const result = evaluateJob(referenceForecast(), {
      ...referenceJob(),
      advance: { maximumAmount: "60000.00", allowedDates: ["2026-09-18"] },
      supplierOptions: [],
    });
    expect(result.alternatives[0]?.feasibility).toBe("infeasible");
    expect(result.alternatives[0]?.forecast.worstCase?.minimumBalance).toBe("-20000.00");
  });

  it("checks collection delay against every permitted advance date", () => {
    const result = evaluateJob(
      { ...referenceForecast(), collectionDelayDays: 1 },
      {
        ...referenceJob(),
        advance: { maximumAmount: "60000.00", allowedDates: ["2026-09-16", "2026-09-17"] },
        supplierOptions: [],
      },
    );
    expect(result.alternatives.map((alternative) => alternative.feasibility)).toEqual([
      "feasible",
      "infeasible",
    ]);
  });

  it("preserves known fees and rejects a schedule that loses required delivery", () => {
    const job = referenceJob();
    const options = job.supplierOptions.map((option) => ({ ...option, feeAmount: "50.00" }));
    const result = evaluateJob(referenceForecast(), {
      ...job,
      advance: null,
      supplierOptions: options,
    });
    expect(result.alternatives[0]).toMatchObject({
      totalJobCost: "40050.00",
      knownFees: "50.00",
      feasibility: "infeasible",
    });
    const delivery = evaluateJob(referenceForecast(), {
      ...job,
      advance: null,
      supplierOptions: job.supplierOptions.map((option) => ({
        ...option,
        deliveryMaintained: false,
      })),
    });
    expect(delivery.alternatives[0]?.reasons).toContain("delivery_not_maintained");
  });

  it("does not claim feasibility by moving the supplier past day 30", () => {
    const job = referenceJob();
    const result = evaluateJob(referenceForecast(), {
      ...job,
      advance: null,
      supplierOptions: job.supplierOptions.map((option) => ({
        ...option,
        deferredDate: "2026-10-01",
      })),
    });
    expect(result.alternatives[0]).toMatchObject({
      feasibility: "horizon_limited",
      reasons: ["outside_horizon"],
    });
    expect(result.searchStatus).toBe("no_feasible_alternative");
  });

  it("blocks moving non-negotiable payroll and invalid amount constraints", () => {
    const job = referenceJob();
    expect(
      v.safeParse(jobInputSchema, {
        ...job,
        costs: job.costs.map((cost) => ({ ...cost, category: "payroll", negotiable: true })),
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(jobInputSchema, {
        ...job,
        costs: job.costs.map((cost) => ({ ...cost, negotiable: false })),
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(jobInputSchema, {
        ...job,
        advance: { maximumAmount: "60000.01", allowedDates: ["2026-09-17"] },
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(jobInputSchema, {
        ...job,
        supplierOptions: job.supplierOptions.map((option) => ({
          ...option,
          initialAmount: "40000.01",
        })),
      }).success,
    ).toBe(false);
  });

  it("finds dynamic cent-exact minima for independently changed costs", () => {
    for (const costAmount of ["39999.99", "37500.13", "32000.45"]) {
      const input = referenceForecast();
      const job = {
        ...referenceJob(),
        costs: referenceJob().costs.map((cost) => ({ ...cost, amount: costAmount })),
        supplierOptions: [],
      };
      const result = evaluateJob(input, job);
      const alternative = result.alternatives[0];
      if (alternative?.selection.kind !== "advance") throw new Error("Expected an advance");
      expect(alternative.selection.amount).toBe(money(costAmount).minus("10000").toFixed(2));
      const previousCent = money(alternative.selection.amount).minus("0.01").toFixed(2);
      const insufficient = calculateForecast({
        ...input,
        events: [
          ...input.events,
          ...deriveJobEvents(job, { ...alternative.selection, amount: previousCent }),
        ],
      });
      expect(insufficient.financialStatus).toBe("cushion_shortfall");
    }
  });

  it("preserves every non-target obligation and the original input", () => {
    const input = referenceForecast();
    const job = referenceJob();
    const before = JSON.stringify({ input, job });
    const result = evaluateJob(input, job);
    expect(JSON.stringify({ input, job })).toBe(before);
    expect(
      result.alternatives[1]?.forecast.scenarios[0]?.daily.find((day) => day.date === "2026-09-18")
        ?.outflows,
    ).toBe("30000.00");
    expect(evaluateJob(input, job)).toEqual(result);
  });

  it("retains independent insufficient-information and pending-condition states", () => {
    const result = evaluateJob(
      { ...referenceForecast(), missingInformation: ["Confirm payroll"] },
      referenceJob(),
    );
    expect(result.searchStatus).toBe("insufficient_information");
    expect(result.alternatives[0]?.feasibility).toBe("insufficient_information");
    expect(result.alternatives[0]?.pendingConditions).toHaveLength(1);
  });
});
