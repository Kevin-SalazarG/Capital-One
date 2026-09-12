import type { ReactElement } from "react";
import { useState } from "react";
import type { GetDashboardResult } from "@mirror/api-client";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { useCSSVariable } from "uniwind";
import { AppText } from "../../design-system/primitives/app-text";
import { useThemeColors } from "../../design-system/theme/use-theme-colors";
import { formatCalendarDate } from "../../shared/utils/format-calendar-date";
import { formatMoney, formatMoneyAmount } from "../../shared/utils/format-money";

type ForecastScenario = Extract<
  GetDashboardResult["liquidity"]["forecast"],
  { readonly availability: "ready" }
>["scenarios"][number];

function chartGeometry(daily: ForecastScenario["daily"]): {
  readonly line: string;
  readonly area: string;
  readonly lastX: number;
  readonly lastY: number;
  readonly zeroY: number | null;
  readonly highestClosing: string;
  readonly lowestClosing: string;
  readonly flat: boolean;
} | null {
  if (daily.length === 0 || daily.length > 31) return null;
  // API-validated cents preserve small differences between large balances.
  // Conversion to Number is only for pixel offsets, never monetary output.
  const balances = daily.map((day) => ({
    cents: BigInt(day.closingBalance.replace(".", "")),
    amount: day.closingBalance,
  }));
  const firstBalance = balances[0];
  if (firstBalance === undefined) return null;
  const lower = balances.reduce(
    (lowest, value) => (value.cents < lowest.cents ? value : lowest),
    firstBalance,
  );
  const upper = balances.reduce(
    (highest, value) => (value.cents > highest.cents ? value : highest),
    firstBalance,
  );
  const span = upper.cents - lower.cents;
  const y = (value: bigint): number =>
    span === 0n ? 68 : 124 - (Number(value - lower.cents) / Number(span)) * 112;
  const points = balances.map((value, index) => ({
    x: balances.length === 1 ? 160 : 4 + (index / (balances.length - 1)) * 312,
    y: y(value.cents),
  }));
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;
  const line = points
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `H ${point.x} V ${point.y}`))
    .join(" ");
  return {
    line,
    area: `${line} V 132 H ${first.x} Z`,
    lastX: last.x,
    lastY: last.y,
    zeroY: lower.cents <= 0n && upper.cents >= 0n ? y(0n) : null,
    highestClosing: upper.amount,
    lowestClosing: lower.amount,
    flat: span === 0n,
  };
}

export function ForecastTrend({ scenario }: { readonly scenario: ForecastScenario }): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const colors = useThemeColors();
  const canvas = useCSSVariable("--auth-canvas");
  if (typeof canvas !== "string" || canvas.length === 0)
    throw new Error("Missing resolved forecast canvas color");
  const geometry = chartGeometry(scenario.daily);
  const first = scenario.daily[0];
  const last = scenario.daily.at(-1);
  if (!geometry || !first || !last)
    return (
      <AppText tone="muted">El detalle diario no está disponible para este horizonte.</AppText>
    );

  const firstDate = formatCalendarDate(first.date);
  const lastDate = formatCalendarDate(last.date);
  const minimum = formatMoney(scenario.metrics.minimumBalance);
  const minimumDate = formatCalendarDate(scenario.metrics.minimumDate);
  const closing = formatMoney(scenario.metrics.closingBalance);

  return (
    <View className="gap-2">
      <AppText variant="caption" tone="muted">
        Cierres diarios · MXN
      </AppText>
      <Text
        accessibilityLabel={`${geometry.flat ? "Cierre constante" : "Extremo superior de la escala de cierres"}: ${formatMoney(geometry.highestClosing)}`}
        className="text-xs tabular-nums text-auth-muted"
      >
        {geometry.flat ? "Cierre constante · " : ""}
        {formatMoneyAmount(geometry.highestClosing)}
      </Text>
      <Svg
        width="100%"
        height={136}
        viewBox="0 0 320 136"
        accessibilityRole="image"
        accessibilityLabel={`Saldos proyectados al cierre del ${firstDate} al ${lastDate}. Mínimo del escenario ${minimum} el ${minimumDate}, considerando pagos antes de cobros. Cierre del período ${closing}.`}
      >
        <Path d={geometry.area} fill={canvas} />
        {!geometry.flat ? (
          <Path
            d="M 4 12 H 316 M 4 124 H 316"
            stroke={colors.border}
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        ) : null}
        {geometry.zeroY !== null ? (
          <>
            <Line
              testID="forecast-zero-line"
              x1={4}
              x2={316}
              y1={geometry.zeroY}
              y2={geometry.zeroY}
              stroke={colors.border}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <SvgText
              x={314}
              y={Math.max(11, geometry.zeroY - 5)}
              textAnchor="end"
              fill={colors.muted}
              fontSize={11}
            >
              0
            </SvgText>
          </>
        ) : null}
        <Path
          testID="forecast-closing-line"
          d={geometry.line}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Circle cx={geometry.lastX} cy={geometry.lastY} r={3} fill={colors.accent} />
      </Svg>
      {!geometry.flat ? (
        <Text
          accessibilityLabel={`Extremo inferior de la escala de cierres: ${formatMoney(geometry.lowestClosing)}`}
          className="text-xs tabular-nums text-auth-muted"
        >
          {formatMoneyAmount(geometry.lowestClosing)}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap justify-between gap-x-4 gap-y-1">
        <AppText variant="caption" tone="muted">
          {firstDate}
        </AppText>
        <AppText variant="caption" tone="muted">
          {lastDate}
        </AppText>
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-2 pt-1">
        <View className="min-w-32 flex-1 gap-0.5">
          <AppText variant="caption" tone="muted">
            Mínimo antes de cobros
          </AppText>
          <Text className="text-base font-semibold tabular-nums text-auth-foreground">
            {formatMoneyAmount(scenario.metrics.minimumBalance)}
          </Text>
          <AppText variant="caption" tone="muted">
            {minimumDate}
          </AppText>
        </View>
        <View className="min-w-32 flex-1 gap-0.5">
          <AppText variant="caption" tone="muted">
            Cierre del período
          </AppText>
          <Text className="text-base font-semibold tabular-nums text-auth-foreground">
            {formatMoneyAmount(scenario.metrics.closingBalance)}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Contraer saldos diarios" : "Ver saldos diarios"}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        className="min-h-12 justify-center rounded-xl active:bg-auth-canvas"
      >
        <Text className="text-base font-semibold text-auth-action underline">
          {expanded ? "Contraer saldos diarios" : "Ver saldos diarios"}
        </Text>
      </Pressable>
      {expanded ? (
        <View className="gap-1 border-t border-auth-border/30 pt-2">
          {scenario.daily.map((day) => (
            <View
              key={day.date}
              accessible
              accessibilityLabel={`${formatCalendarDate(day.date)}: saldo al cierre ${formatMoney(day.closingBalance)}`}
              className="flex-row flex-wrap justify-between gap-x-4 gap-y-1 py-2"
            >
              <AppText variant="caption" tone="muted">
                {formatCalendarDate(day.date)}
              </AppText>
              <Text className="text-base font-medium tabular-nums text-auth-foreground">
                {formatMoney(day.closingBalance)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
