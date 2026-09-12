import { MirrorApiError, MirrorClient, type ConfirmDecisionResult } from "@mirror/api-client";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpAppFixture, type HttpAppFixture } from "../fixtures/http-app-fixture.js";
import { TEST_PASSWORD } from "../fixtures/test-auth-provider.js";

const referenceJob = {
  id: "reference-job",
  label: "Synthetic office-cleaning contract",
  totalCollection: "60000.00",
  collectionDate: "2026-10-10",
  costs: [
    {
      id: "supplier",
      label: "Synthetic materials",
      amount: "40000.00",
      date: "2026-09-22",
      category: "supplies",
      negotiable: true,
    },
  ],
  advance: { maximumAmount: "60000.00", allowedDates: ["2026-09-29"] },
  supplierOptions: [
    {
      id: "supplier-split",
      costId: "supplier",
      initialAmount: "10000.00",
      deferredDate: "2026-10-11",
      feeAmount: "0.00",
      deliveryMaintained: true,
    },
  ],
} satisfies Parameters<MirrorClient["evaluateJob"]>[1]["job"];

interface Consumer {
  readonly client: MirrorClient;
  readonly updateToken: (token: string) => void;
}

function consumer(baseUrl: string): Consumer {
  let accessToken: string | undefined;
  return {
    client: new MirrorClient({ baseUrl, accessToken: () => accessToken }),
    updateToken: (token: string): void => {
      accessToken = token;
    },
  };
}

let currentFixture: HttpAppFixture | undefined;

function fixture(): HttpAppFixture {
  if (!currentFixture) throw new Error("HTTP test fixture has not started.");
  return currentFixture;
}

type ConfirmationOutcome =
  | { readonly status: "confirmed"; readonly result: ConfirmDecisionResult }
  | { readonly status: "rejected"; readonly httpStatus: number; readonly code: string };

async function confirmationOutcome(
  request: Promise<ConfirmDecisionResult>,
): Promise<ConfirmationOutcome> {
  try {
    return { status: "confirmed", result: await request };
  } catch (error: unknown) {
    if (!(error instanceof MirrorApiError)) throw error;
    return { status: "rejected", httpStatus: error.status, code: error.code };
  }
}

describe("public client against the running HTTP API", () => {
  beforeEach(async () => {
    // The replay scenario has an explicit simulated calendar; network timers remain real.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-12T18:00:00.000Z"));
    currentFixture = await createHttpAppFixture();
  });

  afterEach(async () => {
    await currentFixture?.close();
    currentFixture = undefined;
    vi.useRealTimers();
  });

  it("completes the synthetic journey without computing financial results in the consumer", async () => {
    const test = fixture();
    const owner = consumer(test.baseUrl);
    const client = owner.client;
    const businessId = test.first.businessId;
    const session = await client.login({ email: test.first.email, password: TEST_PASSWORD });
    owner.updateToken(session.accessToken);
    const renewed = await client.refreshSession({ refreshToken: session.refreshToken });
    owner.updateToken(renewed.accessToken);
    expect((await client.getSession()).userId).toBe(test.first.userId);
    expect((await client.listBusinesses()).map((business) => business.id)).toEqual([businessId]);
    expect((await client.refreshBanking(businessId, { expectedVersion: 0 })).planningVersion).toBe(
      1,
    );

    await client.setBudget(businessId, {
      expectedVersion: 1,
      category: "overhead",
      periodStart: "2026-09-12",
      periodEnd: "2026-10-12",
      amount: "5000.00",
    });
    const expense = await client.createCommitment(businessId, {
      expectedVersion: 2,
      title: "Synthetic flexible marketing",
      kind: "outflow",
      amount: "1000.00",
      dueDate: "2026-09-17",
      category: "overhead",
      status: "expected",
      negotiable: true,
    });
    expect((await client.getForecast(businessId)).forecast.worstCase?.reserveTarget).toBe(
      "41000.00",
    );
    await client.adjustOverhead(businessId, expense.commitment.id, {
      expectedVersion: 3,
      amount: "500.00",
    });
    const budget = (await client.listBudgets(businessId)).items[0];
    expect(budget?.committedUnpaid).toBe("500.00");
    expect(budget?.remaining).toBe("4500.00");
    expect((await client.getForecast(businessId)).forecast.worstCase?.reserveTarget).toBe(
      "40500.00",
    );
    await client.updateCommitment(businessId, expense.commitment.id, {
      expectedVersion: 4,
      title: "Synthetic flexible marketing",
      kind: "outflow",
      amount: "500.00",
      dueDate: "2026-09-17",
      category: "overhead",
      status: "cancelled",
      negotiable: true,
    });

    const baseline = await client.getForecast(businessId);
    expect(baseline.forecast.worstCase?.reserveTarget).toBe("40000.00");
    expect(baseline.forecast.worstCase?.availableCapacity).toBe("10000.00");
    const dashboard = await client.getDashboard(businessId);
    expect(dashboard.liquidity.forecast.worstCase?.reserveTarget).toBe("40000.00");
    expect(dashboard.business.planningVersion).toBe(dashboard.liquidity.planningVersion);
    expect(dashboard.overhead.planningVersion).toBe(dashboard.business.planningVersion);
    const evaluation = await client.evaluateJob(businessId, {
      job: referenceJob,
      collectionDelayDays: 0,
    });
    expect(evaluation.result.original.forecast.worstCase?.minimumBalance).toBe("-20000.00");
    expect(evaluation.result.original.forecast.worstCase?.protectionGap).toBe("30000.00");
    const advance = evaluation.result.alternatives.find(
      (alternative) => alternative.selection.kind === "advance",
    );
    const supplier = evaluation.result.alternatives.find(
      (alternative) => alternative.selection.kind === "supplier",
    );
    if (advance?.selection.kind !== "advance" || !supplier)
      throw new Error("Both reference alternatives must be available.");
    expect(advance.selection.amount).toBe("30000.00");
    expect(advance.forecast.worstCase?.minimumBalance).toBe("10000.00");
    expect(supplier.forecast.worstCase?.minimumBalance).toBe("10000.00");
    expect(advance.totalJobIncome).toBe("60000.00");
    const confirmation = {
      evaluationId: evaluation.id,
      alternativeId: advance.id,
      expectedVersion: evaluation.planningVersion,
      idempotencyKey: "http_reference_decision",
    };
    const decision = await client.confirmDecision(businessId, confirmation);
    expect(decision.planningVersion).toBe(6);
    expect(await client.confirmDecision(businessId, confirmation)).toEqual(decision);
    await expect(
      client.confirmDecision(businessId, { ...confirmation, alternativeId: supplier.id }),
    ).rejects.toMatchObject({ status: 409, code: "IDEMPOTENCY_CONFLICT" });
    const registered = await client.getDecision(businessId, decision.decisionId);
    expect(registered.conditionStatus).toBe("pending");
    expect((await client.getBankAccount(businessId)).balance).toBe("50000.00");

    vi.setSystemTime(new Date("2026-09-12T18:01:00.000Z"));
    test.banking.receivePartialAdvance();
    const refresh = await client.refreshBanking(businessId, { expectedVersion: 6 });
    const observed = (await client.listBankMovements(businessId)).items[0];
    const obligations = await client.listCommitments(businessId);
    const advanceCommitment = obligations.items.find(
      (item) =>
        item.decisionId === decision.decisionId &&
        item.kind === "inflow" &&
        item.dueDate === "2026-09-29",
    );
    if (!observed || !advanceCommitment)
      throw new Error("Partial receipt and pending advance must be exposed over HTTP.");
    expect((await client.getBankAccount(businessId)).balance).toBe("65000.00");
    const match = {
      expectedVersion: refresh.planningVersion,
      movementId: observed.id,
      commitmentId: advanceCommitment.id,
      amount: "15000.00",
      evidence: "Synthetic partial deposit matched by the user",
    };
    const reconciled = await client.reconcilePayment(businessId, match);
    expect(await client.reconcilePayment(businessId, match)).toEqual(reconciled);
    expect(
      (await client.listCommitments(businessId)).items.find(
        (item) => item.id === advanceCommitment.id,
      )?.remainingAmount,
    ).toBe("15000.00");
    const partialDecision = await client.getDecision(businessId, decision.decisionId);
    const advanceCondition = partialDecision.conditions.find(
      (condition) => condition.kind === "customer_advance",
    );
    if (!advanceCondition) throw new Error("Customer receipt condition must remain visible.");
    await expect(
      client.updateDecisionCondition(businessId, decision.decisionId, advanceCondition.id, {
        expectedVersion: reconciled.planningVersion,
        status: "confirmed",
        evidence: "Partial money must not confirm the full advance",
      }),
    ).rejects.toMatchObject({ status: 409, code: "RECEIPT_EVIDENCE_REQUIRED" });

    const secondEvaluation = await client.evaluateJob(businessId, {
      job: { ...referenceJob, id: "second-job", label: "Second synthetic job" },
    });
    expect(
      secondEvaluation.snapshot.input.events.some(
        (event) => event.id === advanceCommitment.id && event.amount === "15000.00",
      ),
    ).toBe(true);
    const edited = await client.updateCommitment(businessId, test.first.payrollId, {
      expectedVersion: reconciled.planningVersion,
      title: "Synthetic payroll",
      kind: "outflow",
      amount: "30000.00",
      dueDate: "2026-10-01",
      category: "payroll",
      status: "expected",
      negotiable: false,
    });
    expect((await client.getEvaluation(businessId, secondEvaluation.id)).validity).toBe(
      "review_needed",
    );
    await expect(
      client.confirmDecision(businessId, {
        evaluationId: secondEvaluation.id,
        alternativeId: secondEvaluation.result.original.id,
        expectedVersion: secondEvaluation.planningVersion,
        idempotencyKey: "stale_second_decision",
      }),
    ).rejects.toMatchObject({ status: 409, code: "EVALUATION_STALE" });
    const reviewed = await client.reevaluateDecision(businessId, decision.decisionId, {
      expectedVersion: edited.planningVersion,
    });
    expect(reviewed.latestReview?.planningVersion).toBe(edited.planningVersion);
    expect((await client.getDecisionHistory(businessId, decision.decisionId)).totalReviews).toBe(1);
    expect((await client.getDecisionHistory(businessId, decision.decisionId)).evaluation.id).toBe(
      evaluation.id,
    );
    await client.logout();
    await expect(client.getSession()).rejects.toMatchObject({ status: 401 });
  });

  it("allows only one concurrent confirmation against the same planning version", async () => {
    const test = fixture();
    const owner = consumer(test.baseUrl);
    owner.updateToken(
      (await owner.client.login({ email: test.first.email, password: TEST_PASSWORD })).accessToken,
    );
    const businessId = test.first.businessId;
    const [first, second] = await Promise.all([
      owner.client.evaluateJob(businessId, { job: referenceJob }),
      owner.client.evaluateJob(businessId, { job: { ...referenceJob, id: "competing-job" } }),
    ]);
    const firstAlternative = first.result.alternatives.find(
      (item) => item.selection.kind === "advance",
    );
    const secondAlternative = second.result.alternatives.find(
      (item) => item.selection.kind === "advance",
    );
    if (!firstAlternative || !secondAlternative)
      throw new Error("Both candidate evaluations must have an advance alternative.");
    const outcomes = await Promise.all([
      confirmationOutcome(
        owner.client.confirmDecision(businessId, {
          evaluationId: first.id,
          alternativeId: firstAlternative.id,
          expectedVersion: 0,
          idempotencyKey: "concurrent_first",
        }),
      ),
      confirmationOutcome(
        owner.client.confirmDecision(businessId, {
          evaluationId: second.id,
          alternativeId: secondAlternative.id,
          expectedVersion: 0,
          idempotencyKey: "concurrent_second",
        }),
      ),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "confirmed")).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === "rejected" && outcome.httpStatus === 409),
    ).toHaveLength(1);
    expect((await owner.client.listDecisions(businessId)).total).toBe(1);
    expect((await owner.client.getBusiness(businessId)).planningVersion).toBe(1);
  });

  it("recovers an explicitly retried confirmation after losing its committed response", async () => {
    const test = fixture();
    const owner = consumer(test.baseUrl);
    const session = await owner.client.login({ email: test.first.email, password: TEST_PASSWORD });
    owner.updateToken(session.accessToken);
    const businessId = test.first.businessId;
    const evaluation = await owner.client.evaluateJob(businessId, { job: referenceJob });
    const alternative = evaluation.result.alternatives.find(
      (item) => item.selection.kind === "advance",
    );
    if (!alternative) throw new Error("The synthetic job must expose an advance alternative.");
    const intent = {
      evaluationId: evaluation.id,
      alternativeId: alternative.id,
      expectedVersion: evaluation.planningVersion,
      idempotencyKey: "synthetic_lost_confirmation",
    };
    let dispatches = 0;
    const lossyTransport: typeof fetch = async (input, init) => {
      dispatches += 1;
      const response = await fetch(input, init);
      await response.text();
      throw new TypeError("Synthetic response loss after the server finished.");
    };
    const lossyClient = new MirrorClient({
      baseUrl: test.baseUrl,
      accessToken: () => session.accessToken,
      fetch: lossyTransport,
    });
    await expect(lossyClient.confirmDecision(businessId, intent)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(dispatches).toBe(1);
    const registered = await owner.client.listDecisions(businessId);
    expect(registered.total).toBe(1);
    const replay = await owner.client.confirmDecision(businessId, intent);
    expect(replay.decisionId).toBe(registered.items[0]?.id);
    expect(replay.planningVersion).toBe(1);
    expect((await owner.client.listDecisions(businessId)).total).toBe(1);
    expect((await owner.client.getBusiness(businessId)).planningVersion).toBe(1);
  });

  it("isolates concurrent sessions, refresh tokens, business IDs, and evaluation IDs", async () => {
    const test = fixture();
    const first = consumer(test.baseUrl);
    const second = consumer(test.baseUrl);
    const [firstSession, secondSession] = await Promise.all([
      first.client.login({ email: test.first.email, password: TEST_PASSWORD }),
      second.client.login({ email: test.second.email, password: TEST_PASSWORD }),
    ]);
    const [firstRefresh, secondRefresh] = await Promise.all([
      first.client.refreshSession({ refreshToken: firstSession.refreshToken }),
      second.client.refreshSession({ refreshToken: secondSession.refreshToken }),
    ]);
    first.updateToken(firstRefresh.accessToken);
    second.updateToken(secondRefresh.accessToken);
    expect((await first.client.getSession()).userId).toBe(test.first.userId);
    expect((await second.client.getSession()).userId).toBe(test.second.userId);
    await expect(first.client.getBusiness(test.second.businessId)).rejects.toMatchObject({
      status: 403,
    });
    const evaluation = await first.client.evaluateJob(test.first.businessId, { job: referenceJob });
    await expect(
      second.client.getEvaluation(test.second.businessId, evaluation.id),
    ).rejects.toMatchObject({ status: 404 });
    await first.client.logout();
    await expect(
      first.client.refreshSession({ refreshToken: firstRefresh.refreshToken }),
    ).rejects.toMatchObject({ status: 401 });
    expect((await second.client.getSession()).userId).toBe(test.second.userId);
  });

  it("exposes incomplete, infeasible, and unavailable-source states truthfully", async () => {
    const test = fixture();
    const owner = consumer(test.baseUrl);
    owner.updateToken(
      (await owner.client.login({ email: test.first.email, password: TEST_PASSWORD })).accessToken,
    );
    const businessId = test.first.businessId;
    const limited = await owner.client.evaluateJob(businessId, {
      job: {
        ...referenceJob,
        advance: { maximumAmount: "20000.00", allowedDates: ["2026-09-29"] },
        supplierOptions: [],
      },
    });
    expect(limited.result.searchStatus).toBe("no_feasible_alternative");
    await owner.client.updateSettings(businessId, {
      expectedVersion: 0,
      cushion: "10000.00",
      dataComplete: false,
    });
    expect((await owner.client.getForecast(businessId)).forecast.availability).toBe(
      "insufficient_information",
    );
    await owner.client.updateSettings(businessId, {
      expectedVersion: 1,
      cushion: "10000.00",
      dataComplete: true,
    });
    test.banking.failure = "PROVIDER_UNAVAILABLE";
    await expect(
      owner.client.refreshBanking(businessId, { expectedVersion: 2 }),
    ).rejects.toMatchObject({ status: 502, code: "PROVIDER_UNAVAILABLE" });
    expect((await owner.client.getBankAccount(businessId)).balance).toBe("50000.00");
    expect((await owner.client.getForecast(businessId)).forecast.freshness).toBe("stale");
    expect((await owner.client.getLatestBankSyncRun(businessId))?.status).toBe("failed");
  });

  it("enforces HTTP validation, safe errors, and payload limits on the running API", async () => {
    const test = fixture();
    const unauthenticated = new MirrorClient({ baseUrl: test.baseUrl });
    await expect(unauthenticated.listBusinesses()).rejects.toMatchObject({ status: 401 });
    const session = await unauthenticated.login({
      email: test.first.email,
      password: TEST_PASSWORD,
    });
    const invalid = await supertest(test.baseUrl)
      .post(`/v1/businesses/${test.first.businessId}/commitments`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        expectedVersion: 0,
        title: "Invalid monetary JSON",
        kind: "outflow",
        amount: 100,
        dueDate: "2026-09-15",
        category: "overhead",
        status: "expected",
        negotiable: true,
      })
      .expect(400);
    const payload: unknown = invalid.body;
    expect(payload).toMatchObject({ code: "INVALID_INPUT" });
    expect(JSON.stringify(payload)).not.toContain(session.accessToken);
    const nonNegotiableObligation = {
      expectedVersion: 0,
      title: "Invalid negotiable obligation",
      kind: "outflow",
      amount: "100.00",
      dueDate: "2026-09-15",
      status: "expected",
      negotiable: true,
    };
    await supertest(test.baseUrl)
      .post(`/v1/businesses/${test.first.businessId}/commitments`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({ ...nonNegotiableObligation, category: "payroll" })
      .expect(400);
    await supertest(test.baseUrl)
      .post(`/v1/businesses/${test.first.businessId}/commitments/recurring`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        ...nonNegotiableObligation,
        category: "taxes",
        seriesId: "33333333-3333-4333-8333-333333333333",
        dayOfMonth: 15,
        occurrences: 2,
      })
      .expect(400);
    await supertest(test.baseUrl)
      .post("/v1/auth/login")
      .set("content-type", "application/json")
      .send('{"email":')
      .expect(400);
    await supertest(test.baseUrl)
      .post("/v1/auth/login")
      .send({ email: test.first.email, password: "x".repeat(300_000) })
      .expect(413);
  });
});
