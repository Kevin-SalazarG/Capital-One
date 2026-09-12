import { afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MirrorClient } from "@mirror/api-client";
import type { GetDashboardResult, LoginResult } from "@mirror/api-client";
import { Uniwind } from "uniwind";
import { DesignSystemProvider } from "../../design-system/design-system-provider";
import { RuntimeProvider } from "../../platform/api/mirror-client";
import { createQueryClient } from "../../platform/query/query-client";
import type { RefreshCredentialStore } from "../../platform/session/refresh-credential";
import {
  createSessionController,
  type SessionController,
} from "../../platform/session/session-controller";
import { SessionProvider } from "../../platform/session/session-provider";
import { LiquidityScreen } from "./liquidity-screen";

jest.mock("../../platform/session/secure-session-store", () => ({
  createSecureSessionStore: (): never => {
    throw new Error("Liquidity tests provide an isolated session store.");
  },
}));

// Keep queries, controls, the chart, and Modal real; native keyboard/tab
// geometry is a separate device check.
jest.mock("../../design-system/layout/screen", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    Screen: ({ children }: { readonly children: ReactNode }): ReactElement => (
      <View>{children}</View>
    ),
  };
});

type Forecast = GetDashboardResult["liquidity"]["forecast"];
type ReadyForecast = Extract<Forecast, { readonly availability: "ready" }>;
type ForecastScenario = ReadyForecast["scenarios"][number];

interface DashboardFixtureOptions {
  readonly capacity?: string;
  readonly incomplete?: boolean;
  readonly freshness?: Forecast["freshness"];
  readonly lastSyncFailed?: boolean;
}

interface SyntheticStore extends RefreshCredentialStore {
  value: string | null;
}

interface RecordedRequest {
  readonly method: string;
  readonly path: string;
}

interface LiquidityHarness {
  readonly controller: SessionController;
  readonly store: SyntheticStore;
  readonly requests: RecordedRequest[];
  readonly responses: {
    dashboard: GetDashboardResult;
    dashboardFailures: number;
  };
  readonly tree: ReactElement;
}

const queryClients: QueryClient[] = [];
const now = 1_800_000_000_000;
const dashboardPath = "/v1/businesses/synthetic-business/dashboard";

function scenario(id: ForecastScenario["id"]): ForecastScenario {
  const delayed = id === "collection_delay";
  return {
    id,
    delayDays: delayed ? 7 : 0,
    daily: Array.from({ length: 31 }, (_, index) => ({
      date: `2026-10-${String(index + 1).padStart(2, "0")}`,
      openingBalance: "68000.17",
      inflows: "0.00",
      outflows: "0.00",
      minimumBalance: delayed ? "6000.00" : "12000.00",
      closingBalance: index === 0 ? "68000.17" : delayed ? "29000.22" : "52000.31",
      eventIds: [],
    })),
    metrics: {
      minimumBalance: delayed ? "6000.00" : "12000.00",
      minimumDate: "2026-10-02",
      closingBalance: delayed ? "29000.22" : "52000.31",
      operationalShortfall: "0.00",
      protectionGap: delayed ? "4000.00" : "0.00",
      firstCriticalDate: delayed ? "2026-10-02" : null,
      reserveTarget: "17250.35",
      reserveCoverageGap: "0.00",
      availableCapacity: "14000.53",
      unconditionalCapacity: "8100.42",
    },
    criticalObligations: [],
  };
}

function dashboardFixture(options: DashboardFixtureOptions = {}): GetDashboardResult {
  const common: Omit<
    ReadyForecast,
    "availability" | "financialStatus" | "scenarios" | "worstCase"
  > = {
    engineVersion: "1.0.0",
    currency: "MXN",
    timezone: "America/Monterrey",
    cutoffDate: "2026-10-01",
    horizonEnd: "2026-10-31",
    capacityDate: "2026-10-10",
    conditionStatus: "conditional",
    freshness: options.freshness ?? "current",
    assumptions: [],
    warnings: [],
    missingInformation: options.incomplete ? ["Missing operating commitments"] : [],
  };
  const forecast: Forecast = options.incomplete
    ? {
        ...common,
        availability: "insufficient_information",
        financialStatus: "not_evaluated",
        scenarios: [],
        worstCase: null,
      }
    : {
        ...common,
        availability: "ready",
        financialStatus: "cushion_shortfall",
        scenarios: [scenario("base"), scenario("collection_delay")],
        // Distinct returned measures detect substituting or recomputing an API field.
        worstCase: {
          ...scenario("collection_delay").metrics,
          unconditionalCapacity: options.capacity ?? "8100.42",
        },
      };
  return {
    business: {
      id: "synthetic-business",
      name: "Synthetic workshop",
      currency: "MXN",
      timezone: "America/Monterrey",
      cushion: "10000.00",
      planningVersion: 4,
      dataComplete: !options.incomplete,
      cutoffDate: "2026-10-01",
      openingBalance: "68000.17",
      source: "replay",
      sourceSyncedAt: "2026-10-01T12:00:00.000Z",
    },
    liquidity: {
      businessId: "synthetic-business",
      planningVersion: 4,
      calculatedAt: "2026-10-01T12:05:00.000Z",
      source: "replay",
      sourceSyncedAt: "2026-10-01T12:00:00.000Z",
      lastSyncFailed: options.lastSyncFailed ?? false,
      forecast,
    },
    overhead: { items: [], planningVersion: 4 },
    decisions: { items: [], total: 0 },
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function liquidityHarness(
  dashboard = dashboardFixture(),
  dashboardFailures = 0,
): Promise<LiquidityHarness> {
  const requests: RecordedRequest[] = [];
  const responses = { dashboard, dashboardFailures };
  const queries = createQueryClient({ allowLocalReads: true });
  // This harness clears caches explicitly; no background garbage-collection timer is needed.
  queries.setQueryDefaults([], { gcTime: Number.POSITIVE_INFINITY });
  queryClients.push(queries);
  const store: SyntheticStore = {
    value: null,
    read: async () => store.value,
    write: async (value) => {
      store.value = value;
    },
    remove: async () => {
      store.value = null;
    },
  };
  const expiresAt = now / 1_000 + 3_600;
  const loginResult: LoginResult = {
    accessToken: "synthetic-access",
    refreshToken: "synthetic-refresh",
    expiresAt,
    identity: { userId: "synthetic-user", sessionId: "synthetic-session", expiresAt },
  };
  const transport = jest.fn<typeof fetch>(async (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
    );
    const method = init?.method ?? "GET";
    requests.push({ method, path: url.pathname });
    if (method === "POST" && url.pathname === "/v1/auth/login") return jsonResponse(loginResult);
    if (method === "POST" && url.pathname === "/v1/auth/logout")
      return jsonResponse({ success: true });
    if (method === "GET" && url.pathname === "/v1/businesses")
      return jsonResponse([responses.dashboard.business]);
    if (method === "GET" && url.pathname === dashboardPath) {
      if (responses.dashboardFailures > 0) {
        responses.dashboardFailures -= 1;
        return jsonResponse(
          { code: "RATE_LIMITED", message: "Synthetic limit", requestId: "synthetic-request" },
          429,
        );
      }
      return jsonResponse(responses.dashboard);
    }
    throw new Error("Unexpected synthetic HTTP operation.");
  });
  const apiUrl = "https://mirror.example.invalid";
  const client: MirrorClient = new MirrorClient({
    baseUrl: apiUrl,
    fetch: transport,
    accessToken: () => controller.getAccessToken(),
  });
  const controller: SessionController = createSessionController({
    client,
    store,
    environmentId: apiUrl,
    now: () => now,
    onIdentityChange: async () => {
      await queries.cancelQueries();
      queries.clear();
    },
  });
  await controller.signIn("ana@example.invalid", "synthetic-password");
  if (controller.getSnapshot().status !== "authenticated")
    throw new Error("Synthetic authentication failed.");
  requests.length = 0;
  return {
    controller,
    store,
    requests,
    responses,
    tree: (
      <RuntimeProvider
        runtime={{
          client,
          session: controller,
          queries,
          config: { apiUrl, localDevelopment: true },
        }}
      >
        <SessionProvider controller={controller}>
          <QueryClientProvider client={queries}>
            <SafeAreaProvider
              initialMetrics={{
                frame: { x: 0, y: 0, width: 390, height: 844 },
                insets: { top: 0, right: 0, bottom: 0, left: 0 },
              }}
            >
              <DesignSystemProvider>
                <LiquidityScreen />
              </DesignSystemProvider>
            </SafeAreaProvider>
          </QueryClientProvider>
        </SessionProvider>
      </RuntimeProvider>
    ),
  };
}

describe("liquidity screen integration", () => {
  beforeAll(() => {
    // Jest does not compile Metro CSS; native review establishes actual colors.
    Uniwind.updateCSSVariables("light", {
      "--theme": "default",
      "--background": "#ffffff",
      "--foreground": "#000000",
      "--surface": "#ffffff",
      "--muted": "#000000",
      "--accent": "#000000",
      "--border": "#000000",
      "--danger": "#000000",
      "--auth-canvas": "#ffffff",
      "--auth-art-base": "#000000",
      "--auth-muted": "#000000",
      "--auth-action-foreground": "#000000",
      "--auth-action-pressed": "#000000",
      "--color-accent-hover": "#000000",
      "--color-default-hover": "#000000",
      "--color-danger-hover": "#000000",
      "--color-danger-soft-hover": "#000000",
    });
  });

  afterEach(async () => {
    await cleanup();
    for (const queries of queryClients) {
      await queries.cancelQueries();
      queries.clear();
    }
    queryClients.length = 0;
  });

  it("presents backend capacity separately from observed cash, reserve, and projected capacity", async () => {
    const harness = await liquidityHarness();
    const view = await render(harness.tree);
    expect(await view.findByLabelText("$8,100.42 MXN")).toHaveTextContent("$8,100.42");
    expect(view.getByLabelText("Saldo al corte: $68,000.17 MXN")).toBeVisible();
    expect(view.getByLabelText("Reserva objetivo: $17,250.35 MXN")).toBeVisible();
    expect(view.queryByLabelText("$14,000.53 MXN")).toBeNull();
    expect(view.queryByLabelText("$50,749.82 MXN")).toBeNull();
  });

  it("shows uncalculated values without inventing zero capacity or a chart when data is missing", async () => {
    const harness = await liquidityHarness(dashboardFixture({ incomplete: true }));
    const view = await render(harness.tree);
    expect(await view.findByLabelText("Capacidad sin calcular")).toHaveTextContent("—");
    expect(view.getByLabelText("Reserva objetivo: sin calcular")).toHaveTextContent(/—/);
    expect(view.getByLabelText("Saldo al corte: $68,000.17 MXN")).toBeVisible();
    expect(view.queryByLabelText("$0.00 MXN")).toBeNull();
    expect(view.queryByTestId("forecast-closing-line")).toBeNull();
    expect(view.queryAllByRole("tab")).toHaveLength(0);
  });

  it.each([false, true])(
    "retains stale-data disclosure when lastSyncFailed is %s",
    async (lastSyncFailed) => {
      const harness = await liquidityHarness(
        dashboardFixture({ freshness: "stale", lastSyncFailed }),
      );
      const view = await render(harness.tree);
      await view.findByLabelText("$8,100.42 MXN");
      const warning = lastSyncFailed
        ? "Falló la actualización. Estos importes requieren revisión."
        : "Datos pendientes de actualizar. Estos importes requieren revisión.";
      expect(view.getByLabelText(warning)).toBeVisible();
      await fireEvent.press(view.getByRole("button", { name: "Ver datos y supuestos" }));
      expect(
        view.getByText(
          "Los datos requieren revisión por antigüedad. El cálculo conserva el corte original.",
        ),
      ).toBeVisible();
      if (lastSyncFailed) {
        expect(
          view.getByText(
            "Falló la última actualización de la fuente. Se conserva el último conjunto completo de datos.",
          ),
        ).toBeVisible();
      }
      await fireEvent.press(view.getByRole("button", { name: "Cerrar detalles" }));
      expect(view.getByLabelText(warning)).toBeVisible();
    },
  );

  it("switches to the returned delayed collection series without making another request", async () => {
    const harness = await liquidityHarness();
    const view = await render(harness.tree);
    await view.findByLabelText("$8,100.42 MXN");
    await fireEvent.press(view.getByRole("button", { name: /ver saldos diarios/i }));
    expect(view.getByLabelText("2 oct 2026: saldo al cierre $52,000.31 MXN")).toBeVisible();
    await fireEvent.press(view.getByRole("tab", { name: "Cobros tarde" }));
    expect(view.getByRole("tab", { name: "Cobros tarde", selected: true })).toBeVisible();
    await fireEvent.press(view.getByRole("button", { name: /ver saldos diarios/i }));
    expect(view.getByLabelText("2 oct 2026: saldo al cierre $29,000.22 MXN")).toBeVisible();
    expect(view.queryByLabelText("2 oct 2026: saldo al cierre $52,000.31 MXN")).toBeNull();
    expect(harness.requests).toEqual([
      { method: "GET", path: "/v1/businesses" },
      { method: "GET", path: dashboardPath },
    ]);
  });

  it.each(["button", "native dismissal"])(
    "opens source details and closes them through %s",
    async (closeMethod) => {
      const harness = await liquidityHarness();
      const view = await render(harness.tree);
      await view.findByLabelText("$8,100.42 MXN");
      expect(view.queryByRole("header", { name: "Datos y supuestos" })).toBeNull();
      await fireEvent.press(view.getByRole("button", { name: "Ver datos y supuestos" }));
      expect(view.getByRole("header", { name: "Datos y supuestos" })).toBeVisible();
      expect(view.getByText("Synthetic workshop")).toBeVisible();
      expect(view.getByText("Reproducción sintética local")).toBeVisible();
      if (closeMethod === "button") {
        await fireEvent.press(view.getByRole("button", { name: "Cerrar detalles" }));
      } else {
        await fireEvent(view.getByRole("header", { name: "Datos y supuestos" }), "requestClose");
      }
      expect(view.queryByRole("header", { name: "Datos y supuestos" })).toBeNull();
      expect(view.getByRole("button", { name: "Ver datos y supuestos" })).toBeVisible();
    },
  );

  it("retries the query after an API failure without requesting banking synchronization", async () => {
    const harness = await liquidityHarness(dashboardFixture(), 1);
    const view = await render(harness.tree);
    await waitFor(() => expect(view.getByRole("button", { name: /consultar/i })).toBeEnabled());
    expect(view.queryByLabelText("$8,100.42 MXN")).toBeNull();
    harness.responses.dashboard = dashboardFixture({ capacity: "9234.67" });
    await fireEvent.press(view.getByRole("button", { name: /consultar/i }));
    expect(await view.findByLabelText("$9,234.67 MXN")).toBeVisible();
    expect(harness.requests).toEqual([
      { method: "GET", path: "/v1/businesses" },
      { method: "GET", path: dashboardPath },
      { method: "GET", path: "/v1/businesses" },
      { method: "GET", path: dashboardPath },
    ]);
  });

  it("wires logout to the session controller and clears its stored credential", async () => {
    const harness = await liquidityHarness();
    const view = await render(harness.tree);
    await view.findByLabelText("$8,100.42 MXN");
    expect(harness.store.value).not.toBeNull();
    await fireEvent.press(view.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => {
      expect(harness.controller.getSnapshot()).toMatchObject({
        status: "signed-out",
        reason: "explicit",
        credentialCleared: true,
        revocation: "confirmed",
      });
    });
    expect(harness.store.value).toBeNull();
    expect(harness.requests.filter((request) => request.method === "POST")).toEqual([
      { method: "POST", path: "/v1/auth/logout" },
    ]);
    expect(view.queryByLabelText("$8,100.42 MXN")).toBeNull();
  });
});
