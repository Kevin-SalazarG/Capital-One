import assert from "node:assert/strict";
import test from "node:test";

import Decimal from "decimal.js";

import type {
  ForecastRunRow,
  OrganizationRow,
} from "../src/common/database/database.types";
import type { ForecastInputReader } from "../src/modules/forecasting/forecast-input.reader";
import type { ForecastRepository } from "../src/modules/forecasting/forecast.repository";
import { ForecastEngine } from "../src/modules/forecasting/domain/forecast-engine";
import type { ForecastInput } from "../src/modules/forecasting/domain/forecast.types";
import { GenerateForecastUseCase } from "../src/modules/forecasting/generate-forecast.use-case";

const input: ForecastInput = {
  asOf: "2026-09-12",
  horizonDays: 30,
  currentBalance: new Decimal("100000"),
  minimumCashReserve: new Decimal("15000"),
  averageMonthlyOutflow: new Decimal("60000"),
  variableOutflowPerDay: new Decimal("2000"),
  confidence: "high",
  events: [],
};

const run: ForecastRunRow = {
  id: "00000000-0000-0000-0000-000000000001",
  organization_id: "00000000-0000-0000-0000-000000000002",
  status: "running",
  horizon_days: 30,
  as_of: "2026-09-12",
  input_hash: "hash",
  input_snapshot: {},
  engine_version: "rules-v1",
  started_at: "2026-09-12T00:00:00.000Z",
  finished_at: null,
  error_code: null,
  error_message: null,
};

const organization: OrganizationRow = {
  id: run.organization_id,
  name: "Test organization",
  legal_name: null,
  rfc: null,
  currency: "MXN",
  time_zone: "America/Mexico_City",
  minimum_cash_reserve: "15000.00",
  created_by: "00000000-0000-0000-0000-000000000003",
  created_at: "2026-09-12T00:00:00.000Z",
  updated_at: "2026-09-12T00:00:00.000Z",
};

test("GenerateForecastUseCase persists a completed 30-day forecast", async () => {
  let completeCalls = 0;
  let failedCalls = 0;
  const reader = {
    read: async (
      _organizationId: string,
      _accessToken: string,
      _horizonDays: number,
    ) => ({
      organization,
      input,
    }),
  } satisfies Pick<ForecastInputReader, "read">;
  const repository = {
    createRun: async () => run,
    completeRun: async () => {
      completeCalls += 1;
      return { points: [], gap: null, recommendation: null };
    },
    markFailed: async () => {
      failedCalls += 1;
    },
  } satisfies Pick<
    ForecastRepository,
    "createRun" | "completeRun" | "markFailed"
  >;
  const useCase = new GenerateForecastUseCase(
    reader as unknown as ForecastInputReader,
    repository as unknown as ForecastRepository,
    new ForecastEngine(),
  );

  const result = await useCase.execute(run.organization_id, "access-token", 30);

  assert.equal(result.run.id, run.id);
  assert.deepEqual(result.output, {
    algorithmVersion: "treasury-v2",
    confidence: "high",
    firstGap: null,
    recommendation: null,
    safetyThreshold: "15000.00",
  });
  assert.equal(completeCalls, 1);
  assert.equal(failedCalls, 0);
});
