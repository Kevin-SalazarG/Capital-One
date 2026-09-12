import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { GetDashboardResult } from "@mirror/api-client";
import { Pressable, Text, View } from "react-native";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import Animated, {
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useCSSVariable } from "uniwind";
import { AppText } from "../../design-system/primitives/app-text";
import { useThemeColors } from "../../design-system/theme/use-theme-colors";
import { formatCalendarDate } from "../../shared/utils/format-calendar-date";
import { formatMoney, formatMoneyAmount } from "../../shared/utils/format-money";

type ForecastScenario = Extract<
  GetDashboardResult["liquidity"]["forecast"],
  { readonly availability: "ready" }
>["scenarios"][number];

const chartEntrance = FadeIn.duration(220).reduceMotion(ReduceMotion.System);

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
    x: balances.length === 1 ? 160 : 8 + (index / (balances.length - 1)) * 304,
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
  const gradientId = useId();
  const colors = useThemeColors();
  const paints = useCSSVariable(["--auth-canvas", "--auth-art-base"]);
  const canvas = paints[0];
  const blue = paints[1];
  const chevronStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: withTiming(expanded ? "180deg" : "0deg", {
            duration: 180,
            reduceMotion: ReduceMotion.System,
          }),
        },
      ],
    }),
    [expanded],
  );
  if (
    typeof canvas !== "string" ||
    canvas.length === 0 ||
    typeof blue !== "string" ||
    blue.length === 0
  )
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
    <Animated.View entering={chartEntrance} className="gap-4">
      <View className="gap-1">
        <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <AppText variant="caption" tone="muted">
            Cierre proyectado
          </AppText>
          <AppText variant="caption" tone="muted">
            {lastDate}
          </AppText>
        </View>
        <Text
          accessibilityLabel={`Cierre proyectado: ${closing} al ${lastDate}`}
          className="text-[32px] leading-10 font-semibold tracking-tight tabular-nums text-auth-foreground"
        >
          {formatMoneyAmount(scenario.metrics.closingBalance)}
          <Text className="text-sm font-medium tracking-normal text-auth-muted"> MXN</Text>
        </Text>
      </View>
      <View className="gap-1">
        <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <AppText variant="caption" tone="muted">
            Cierres diarios
          </AppText>
          <Text
            accessibilityLabel={`${geometry.flat ? "Cierre constante" : "Extremo superior de la escala de cierres"}: ${formatMoney(geometry.highestClosing)}`}
            className="text-xs tabular-nums text-auth-muted"
          >
            {geometry.flat ? "Constante · " : ""}
            {formatMoneyAmount(geometry.highestClosing)}
          </Text>
        </View>
        <Svg
          width="100%"
          height={136}
          viewBox="0 0 320 136"
          accessibilityRole="image"
          accessibilityLabel={`Saldos proyectados al cierre del ${firstDate} al ${lastDate}. Mínimo del escenario ${minimum} el ${minimumDate}, considerando pagos antes de cobros. Cierre del período ${closing}.`}
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={blue} stopOpacity={0.95} />
              <Stop offset="65%" stopColor={canvas} stopOpacity={0.7} />
              <Stop offset="100%" stopColor={canvas} stopOpacity={0.08} />
            </LinearGradient>
          </Defs>
          <Path d={geometry.area} fill={`url(#${gradientId})`} />
          {!geometry.flat ? (
            <Path
              d="M 8 12 H 312 M 8 124 H 312"
              stroke={colors.border}
              strokeOpacity={0.45}
              strokeDasharray="3 5"
              strokeWidth={1}
            />
          ) : null}
          {geometry.zeroY !== null ? (
            <>
              <Line
                testID="forecast-zero-line"
                x1={8}
                x2={312}
                y1={geometry.zeroY}
                y2={geometry.zeroY}
                stroke={colors.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <SvgText
                x={310}
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
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx={geometry.lastX}
            cy={geometry.lastY}
            r={8}
            fill={colors.accent}
            fillOpacity={0.08}
          />
          <Circle
            cx={geometry.lastX}
            cy={geometry.lastY}
            r={4}
            fill={colors.accent}
            stroke={colors.surface}
            strokeWidth={2}
          />
        </Svg>
        {!geometry.flat ? (
          <Text
            accessibilityLabel={`Extremo inferior de la escala de cierres: ${formatMoney(geometry.lowestClosing)}`}
            className="text-right text-xs tabular-nums text-auth-muted"
          >
            {formatMoneyAmount(geometry.lowestClosing)}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap justify-between gap-x-4 gap-y-1 pt-1">
          <AppText variant="caption" tone="muted">
            {firstDate}
          </AppText>
          <AppText variant="caption" tone="muted">
            {lastDate}
          </AppText>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-auth-border/20 pt-3">
        <View className="min-w-32 flex-1 gap-0.5">
          <AppText variant="caption" tone="muted">
            Mínimo antes de cobros
          </AppText>
          <AppText variant="caption" tone="muted">
            {minimumDate}
          </AppText>
        </View>
        <Text className="shrink text-xl font-semibold tabular-nums text-auth-foreground">
          {formatMoneyAmount(scenario.metrics.minimumBalance)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Contraer saldos diarios" : "Ver saldos diarios"}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        className="min-h-14 flex-row items-center gap-3 rounded-xl border-t border-auth-border/20 px-1 py-2 active:bg-auth-canvas"
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-8 w-8 items-center justify-center rounded-full bg-auth-canvas"
        >
          <CalendarDays size={18} strokeWidth={1.7} color={colors.accent} />
        </View>
        <Text className="flex-1 text-sm font-semibold text-auth-action">
          {expanded ? "Contraer saldos diarios" : "Ver saldos diarios"}
        </Text>
        <Animated.View
          style={chevronStyle}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ChevronDown size={18} strokeWidth={1.8} color={colors.muted} />
        </Animated.View>
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
    </Animated.View>
  );
}
