import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, platform, release } from "node:os";
import { resolve } from "node:path";
import { MirrorApiError, MirrorClient } from "@mirror/api-client";
import { format } from "prettier";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { createHttpAppFixture } from "../fixtures/http-app-fixture.js";
import type { HttpAppFixture } from "../fixtures/http-app-fixture.js";
import { TEST_PASSWORD } from "../fixtures/test-auth-provider.js";

let appFixture: HttpAppFixture | undefined;
let client: MirrorClient | undefined;

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-12T18:00:00Z"));
  appFixture = await createHttpAppFixture();
  let token: string | undefined;
  client = new MirrorClient({ baseUrl: appFixture.baseUrl, accessToken: () => token });
  token = (await client.login({ email: appFixture.first.email, password: TEST_PASSWORD }))
    .accessToken;
});
afterAll(async () => {
  await appFixture?.close();
  vi.useRealTimers();
});

it("measures the bounded synthetic HTTP workload and captures validated response examples", async () => {
  if (!client || !appFixture) throw new Error("The evidence HTTP server must be running");
  const api = client;
  const fixture = appFixture;
  const businessId = fixture.first.businessId;
  const samples = 12;
  const metrics: {
    operation: string;
    samples: number;
    p95Ms: number;
    maxMs: number;
    errors: number;
    budgetMs: number;
  }[] = [];
  async function measure(
    operation: string,
    budgetMs: number,
    action: (sample: number) => Promise<unknown>,
  ): Promise<void> {
    const durations: number[] = [];
    for (let sample = 0; sample < samples; sample += 1) {
      const start = performance.now();
      await action(sample);
      durations.push(performance.now() - start);
    }
    durations.sort((left, right) => left - right);
    const p95 = durations[Math.ceil(samples * 0.95) - 1];
    const maximum = durations.at(-1);
    if (p95 === undefined || maximum === undefined) throw new Error("Timing samples are missing");
    metrics.push({
      operation,
      samples,
      p95Ms: Number(p95.toFixed(2)),
      maxMs: Number(maximum.toFixed(2)),
      errors: 0,
      budgetMs,
    });
    expect(p95).toBeLessThan(budgetMs);
  }
  const job = {
    id: "evidence-job",
    label: "Synthetic measured job",
    totalCollection: "60000.00",
    collectionDate: "2026-10-10",
    costs: [
      {
        id: "supplier",
        label: "Supplies",
        amount: "40000.00",
        date: "2026-09-22",
        category: "supplies",
        negotiable: true,
      },
    ],
    advance: { maximumAmount: "60000.00", allowedDates: ["2026-09-29"] },
    supplierOptions: [
      {
        id: "split",
        costId: "supplier",
        initialAmount: "10000.00",
        deferredDate: "2026-10-11",
        feeAmount: "0.00",
        deliveryMaintained: true,
      },
    ],
  } satisfies Parameters<MirrorClient["evaluateJob"]>[1]["job"];
  const success = await api.getDashboard(businessId);
  const empty = await api.listBankMovements(businessId);
  const conditional = await api.evaluateJob(businessId, { job });
  const infeasible = await api.evaluateJob(businessId, {
    job: {
      ...job,
      advance: { maximumAmount: "20000.00", allowedDates: ["2026-09-29"] },
      supplierOptions: [],
    },
  });
  await measure("dashboard", 500, () => api.getDashboard(businessId));
  let version = 0;
  await measure("replay_refresh", 2000, async () => {
    const result = await api.refreshBanking(businessId, { expectedVersion: version });
    version = result.planningVersion;
  });
  await measure("job_evaluation", 750, (sample) =>
    api.evaluateJob(businessId, { job: { ...job, id: `measurement-${sample}` } }),
  );
  await measure("evaluation_and_confirmation", 500, async (sample) => {
    const evaluation = await api.evaluateJob(businessId, {
      job: {
        ...job,
        id: `small-job-${sample}`,
        totalCollection: "2.00",
        costs: [
          {
            id: "supplies",
            label: "Synthetic small supplies",
            amount: "1.00",
            date: "2026-09-22",
            category: "supplies",
            negotiable: false,
          },
        ],
        advance: null,
        supplierOptions: [],
      },
    });
    const result = await api.confirmDecision(businessId, {
      evaluationId: evaluation.id,
      alternativeId: evaluation.result.original.id,
      expectedVersion: version,
      idempotencyKey: `measured-decision-${sample}`,
    });
    version = result.planningVersion;
  });
  const stale = await api.getEvaluation(businessId, conditional.id);
  const unauthorized = await captureError(
    new MirrorClient({ baseUrl: fixture.baseUrl }).getBusiness(businessId),
  );
  const conflict = await captureError(
    api.updateSettings(businessId, { expectedVersion: 0, cushion: "10000.00", dataComplete: true }),
  );
  const updated = await api.updateSettings(businessId, {
    expectedVersion: version,
    cushion: "10000.00",
    dataComplete: false,
  });
  const incomplete = await api.getForecast(businessId);
  fixture.banking.failure = "PROVIDER_UNAVAILABLE";
  const unavailable = await captureError(
    api.refreshBanking(businessId, { expectedVersion: updated.planningVersion }),
  );
  expect(conditional.result.searchStatus).toBe("feasible_alternative");
  expect(infeasible.result.searchStatus).toBe("no_feasible_alternative");
  expect(incomplete.forecast.availability).toBe("insufficient_information");
  expect(stale.validity).toBe("review_needed");
  const environment = {
    node: process.version,
    os: `${platform()} ${release()}`,
    cpu: cpus()[0]?.model ?? "unknown",
    database: "isolated PostgreSQL 17",
    auth: "synthetic Auth fixture",
    banking: "synthetic replay",
    client: "generated public HTTP client",
    concurrentClients: 1,
  };
  console.log(JSON.stringify({ evidence: "http_latency", environment, metrics }));
  if (process.env.WRITE_EVIDENCE === "true") {
    const directory = resolve("../../docs/verification/examples");
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      resolve(directory, "http-responses.json"),
      await format(
        JSON.stringify({
          provenance: {
            source: "synthetic_local_http",
            simulatedClock: "2026-09-12T18:00:00Z",
            description:
              "Captured through the generated public client. IDs are isolated synthetic fixtures. No live provider or tokens are included.",
          },
          success,
          empty,
          conditional,
          infeasible,
          stale,
          unauthorized,
          conflict,
          incomplete,
          unavailable,
        }),
        { parser: "json", printWidth: 100 },
      ),
    );
    writeFileSync(
      resolve(directory, "http-latency.json"),
      await format(JSON.stringify({ environment, metrics }), { parser: "json", printWidth: 100 }),
    );
  }
}, 30000);

async function captureError(
  request: Promise<unknown>,
): Promise<{ status: number; code: string; message: string; requestId: string }> {
  try {
    await request;
    throw new Error("The example request should have failed");
  } catch (error: unknown) {
    if (!(error instanceof MirrorApiError)) throw error;
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      requestId: error.requestId,
    };
  }
}
