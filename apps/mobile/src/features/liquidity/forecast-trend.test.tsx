import { beforeAll, describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Uniwind } from "uniwind";
import { ForecastTrend } from "./forecast-trend";

type ForecastScenario = Parameters<typeof ForecastTrend>[0]["scenario"];

function scenario(balances: readonly string[]): ForecastScenario {
  return {
    id: "base",
    delayDays: 0,
    daily: balances.map((balance, index) => ({
      date: `2026-10-${String(index + 1).padStart(2, "0")}`,
      openingBalance: balance,
      inflows: "0.00",
      outflows: "0.00",
      minimumBalance: "-250.00",
      closingBalance: balance,
      eventIds: [],
    })),
    metrics: {
      minimumBalance: "-250.00",
      minimumDate: "2026-10-02",
      closingBalance: balances.at(-1) ?? "0.00",
      operationalShortfall: "250.00",
      protectionGap: "350.00",
      firstCriticalDate: "2026-10-02",
      reserveTarget: "350.00",
      reserveCoverageGap: "350.00",
      availableCapacity: "0.00",
      unconditionalCapacity: "0.00",
    },
    criticalObligations: [],
  };
}

describe("forecast daily balance presentation", () => {
  beforeAll(() => {
    // The native build compiles the application palette; Jest needs inert tokens.
    Uniwind.updateCSSVariables("light", {
      "--background": "#ffffff",
      "--foreground": "#000000",
      "--surface": "#ffffff",
      "--muted": "#000000",
      "--accent": "#000000",
      "--border": "#000000",
      "--danger": "#000000",
      "--auth-canvas": "#ffffff",
      "--auth-art-base": "#ffffff",
    });
  });

  it("draws daily closing steps and keeps the backend intraday minimum separate", async () => {
    const view = await render(<ForecastTrend scenario={scenario(["100.00", "-100.00", "0.00"])} />);
    expect(view.getByTestId("forecast-closing-line")).toHaveProp(
      "d",
      "M 8 12 H 160 V 124 H 312 V 68",
    );
    expect(view.getByTestId("forecast-zero-line")).toHaveProp("y1", 68);
    expect(view.getByText("-$250.00")).toBeDefined();
    expect(view.getByLabelText("Cierre proyectado: $0.00 MXN al 3 oct 2026")).toBeDefined();
    expect(view.queryByText("Cierre del período")).toBeNull();
    expect(view.getByLabelText(/Mínimo del escenario -\$250\.00 MXN el 2 oct 2026/)).toBeDefined();
    expect(
      view.getByLabelText("Extremo superior de la escala de cierres: $100.00 MXN"),
    ).toBeDefined();
    expect(
      view.getByLabelText("Extremo inferior de la escala de cierres: -$100.00 MXN"),
    ).toBeDefined();
  });

  it.each([
    { balance: "5.00", zeroVisible: false },
    { balance: "-5.00", zeroVisible: false },
    { balance: "0.00", zeroVisible: true },
  ])("renders an honest flat series for $balance", async ({ balance, zeroVisible }) => {
    const view = await render(<ForecastTrend scenario={scenario([balance, balance])} />);
    expect(view.getByTestId("forecast-closing-line")).toHaveProp("d", "M 8 68 H 312 V 68");
    expect(view.queryByTestId("forecast-zero-line") !== null).toBe(zeroVisible);
    expect(view.getByLabelText(/^Cierre constante:/)).toBeDefined();
    expect(view.queryByLabelText(/^Extremo inferior/)).toBeNull();
  });

  it("preserves cent differences between the largest canonical balances", async () => {
    const view = await render(
      <ForecastTrend scenario={scenario(["9999999999999999.98", "9999999999999999.99"])} />,
    );
    expect(view.getByTestId("forecast-closing-line")).toHaveProp("d", "M 8 124 H 312 V 12");
    expect(
      view.getByLabelText(
        "Extremo superior de la escala de cierres: $9,999,999,999,999,999.99 MXN",
      ),
    ).toBeDefined();
    expect(
      view.getByLabelText(
        "Extremo inferior de la escala de cierres: $9,999,999,999,999,999.98 MXN",
      ),
    ).toBeDefined();
  });

  it("renders finite coordinates across the full negative and positive amount range", async () => {
    const view = await render(
      <ForecastTrend scenario={scenario(["-9999999999999999.99", "9999999999999999.99"])} />,
    );
    expect(view.getByTestId("forecast-closing-line")).toHaveProp("d", "M 8 124 H 312 V 12");
    expect(view.getByTestId("forecast-zero-line")).toHaveProp("y1", 68);
    expect(
      view.getByLabelText(
        "Extremo inferior de la escala de cierres: -$9,999,999,999,999,999.99 MXN",
      ),
    ).toBeDefined();
  });

  it("expands all 31 canonical daily values and collapses them again", async () => {
    const view = await render(
      <ForecastTrend scenario={scenario(Array.from({ length: 31 }, () => "5.00"))} />,
    );
    expect(view.queryAllByLabelText(/: saldo al cierre/)).toHaveLength(0);
    await fireEvent.press(view.getByRole("button", { name: "Ver saldos diarios" }));
    expect(view.getAllByLabelText(/: saldo al cierre/)).toHaveLength(31);
    expect(view.getByLabelText("31 oct 2026: saldo al cierre $5.00 MXN")).toBeDefined();
    expect(view.getByRole("button", { expanded: true })).toBeDefined();
    await fireEvent.press(view.getByRole("button", { name: "Contraer saldos diarios" }));
    expect(view.queryAllByLabelText(/: saldo al cierre/)).toHaveLength(0);
  });

  it("updates directly to the selected scenario without retaining previous balances", async () => {
    const view = await render(<ForecastTrend scenario={scenario(["100.00", "0.00"])} />);
    await fireEvent.press(view.getByRole("button", { name: "Ver saldos diarios" }));
    await view.rerender(
      <ForecastTrend
        scenario={{ ...scenario(["-10.00", "20.00"]), id: "collection_delay", delayDays: 7 }}
      />,
    );
    expect(view.getByLabelText("1 oct 2026: saldo al cierre -$10.00 MXN")).toBeDefined();
    expect(view.queryByLabelText("1 oct 2026: saldo al cierre $100.00 MXN")).toBeNull();
    expect(view.getByTestId("forecast-closing-line")).toHaveProp("d", "M 8 124 H 312 V 12");
  });

  it.each([0, 32])("does not invent or silently truncate a %i-day series", async (length) => {
    const view = await render(
      <ForecastTrend scenario={scenario(Array.from({ length }, () => "5.00"))} />,
    );
    expect(
      view.getByText("El detalle diario no está disponible para este horizonte."),
    ).toBeDefined();
    expect(view.queryByTestId("forecast-closing-line")).toBeNull();
    expect(view.queryByRole("button")).toBeNull();
  });
});
