import type { ReactElement } from "react";
import { useState } from "react";
import type { GetDashboardResult } from "@mirror/api-client";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ReduceMotion } from "react-native-reanimated";
import Check from "lucide-react-native/icons/check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import LogOut from "lucide-react-native/icons/log-out";
import Info from "lucide-react-native/icons/info";
import { MissingDemoBusinessError, useDashboard } from "./hooks/use-dashboard";
import { ForecastTrend } from "./forecast-trend";
import { LiquidityDetails } from "./liquidity-details";
import { useSession } from "../../platform/session/session-provider";
import { Screen } from "../../design-system/layout/screen";
import { PageHeader } from "../../design-system/layout/page-header";
import { AppText } from "../../design-system/primitives/app-text";
import { Button } from "../../design-system/primitives/button";
import { InlineNotice } from "../../design-system/feedback/inline-notice";
import { LoadingSkeleton } from "../../design-system/feedback/loading-skeleton";
import { useThemeColors } from "../../design-system/theme/use-theme-colors";
import { apiErrorMessage } from "../../platform/api/api-error";
import { formatMoney, formatMoneyAmount } from "../../shared/utils/format-money";
import { formatCalendarDate } from "../../shared/utils/format-calendar-date";

type ReadyForecast = Extract<
  GetDashboardResult["liquidity"]["forecast"],
  { readonly availability: "ready" }
>;
const overviewEntrance = FadeInDown.duration(300).reduceMotion(ReduceMotion.System);
const scenarioEntrance = FadeIn.duration(180).reduceMotion(ReduceMotion.System);
const financialLabels: Record<ReadyForecast["financialStatus"], string> = {
  protected: "Pagos y colchón cubiertos",
  cushion_shortfall: "Falta completar el colchón",
  operational_shortfall: "Falta para cubrir pagos",
};

function OverviewMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | undefined;
}): ReactElement {
  return (
    <View
      className="min-w-32 flex-1 gap-1.5"
      accessible
      accessibilityLabel={`${label}: ${value === undefined ? "sin calcular" : formatMoney(value)}`}
    >
      <Text className="text-[13px] leading-5 text-auth-muted">{label}</Text>
      <Text className="text-[21px] leading-7 font-semibold tracking-tight tabular-nums text-auth-foreground">
        {value === undefined ? "—" : formatMoneyAmount(value)}
      </Text>
    </View>
  );
}

function CapacityOverview({
  data,
  onDetails,
}: {
  readonly data: GetDashboardResult;
  readonly onDetails: () => void;
}): ReactElement {
  const colors = useThemeColors();
  const { forecast, lastSyncFailed } = data.liquidity;
  const ready = forecast.availability === "ready";
  const needsReview = forecast.freshness !== "current" || lastSyncFailed;
  const capacity = ready ? forecast.worstCase.unconditionalCapacity : undefined;
  return (
    <Animated.View
      entering={overviewEntrance}
      className="overflow-hidden rounded-[28px] bg-auth-background shadow-sm shadow-auth-action/5"
    >
      <View className="gap-3 p-5 pb-4">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-auth-red" />
            <Text className="text-[12px] font-medium text-auth-muted">
              {data.business.source === "replay"
                ? "Datos demo"
                : data.business.source === "nessie_live"
                  ? "Nessie sandbox"
                  : "Fuente no disponible"}
            </Text>
          </View>
          <Text className="text-[12px] text-auth-muted">Importes en MXN</Text>
        </View>
        <View className="gap-1.5">
          <Text className="text-[16px] leading-6 font-medium text-auth-foreground">
            Capacidad para nuevos gastos
          </Text>
          <View className="flex-row items-center justify-between gap-2">
            <Text
              accessibilityLabel={
                capacity === undefined ? "Capacidad sin calcular" : formatMoney(capacity)
              }
              className="shrink text-[40px] leading-[48px] font-semibold tracking-[-1.5px] tabular-nums text-auth-foreground"
            >
              {capacity === undefined ? "—" : formatMoneyAmount(capacity)}
            </Text>
          </View>
          <Text className="text-[13px] leading-5 text-auth-muted">
            {ready
              ? `Sin contar cobros futuros · ${formatCalendarDate(forecast.capacityDate)}`
              : "Faltan datos para calcular tu capacidad."}
          </Text>
        </View>
        {needsReview ? (
          <View
            className="flex-row items-start gap-2 rounded-xl bg-auth-canvas px-3 py-2"
            accessible
            accessibilityLabel={
              lastSyncFailed
                ? "Falló la actualización. Estos importes requieren revisión."
                : "Datos pendientes de actualizar. Estos importes requieren revisión."
            }
          >
            <Info size={16} color={colors.muted} style={{ marginTop: 2 }} />
            <Text className="flex-1 text-[12px] leading-[18px] text-auth-muted">
              {lastSyncFailed
                ? "Falló la actualización. Revisa el corte."
                : "Datos sin actualizar. Revisa el corte."}
            </Text>
          </View>
        ) : null}
        <View className="flex-row flex-wrap gap-x-5 gap-y-4 border-t border-auth-border/20 pt-4">
          <OverviewMetric label="Saldo al corte" value={data.business.openingBalance} />
          <OverviewMetric
            label="Reserva objetivo"
            value={ready ? forecast.worstCase.reserveTarget : undefined}
          />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver datos y supuestos"
        onPress={onDetails}
        className="min-h-12 flex-row items-center justify-between gap-3 border-t border-auth-border/15 px-5 py-3 active:bg-auth-canvas"
      >
        <Text className="text-[12px] text-auth-muted">
          Corte: {formatCalendarDate(data.business.cutoffDate)}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-[13px] font-semibold text-auth-action">Ver detalles</Text>
          <ChevronRight size={15} strokeWidth={1.8} color={colors.accent} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ForecastSummary({ forecast }: { readonly forecast: ReadyForecast }): ReactElement {
  const [selectedId, setSelectedId] = useState<ReadyForecast["scenarios"][number]["id"]>("base");
  const colors = useThemeColors();
  const selected =
    forecast.scenarios.find((scenario) => scenario.id === selectedId) ?? forecast.scenarios[0];
  const protectedStatus = forecast.financialStatus === "protected";
  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="heading">Tus próximos 30 días</AppText>
        <Text className="text-[13px] leading-5 text-auth-muted">
          Proyección hasta el {formatCalendarDate(forecast.horizonEnd)}
        </Text>
      </View>
      <View className="gap-4 rounded-[28px] bg-auth-background p-5">
        <View className="gap-1.5">
          <View className="flex-row items-center gap-2">
            {protectedStatus ? (
              <Check size={17} strokeWidth={2} color={colors.accent} />
            ) : (
              <Info size={17} color={colors.danger} />
            )}
            <Text
              className={`flex-1 text-[14px] leading-5 font-medium ${protectedStatus ? "text-auth-foreground" : "text-danger"}`}
            >
              {financialLabels[forecast.financialStatus]}
            </Text>
          </View>
          {!protectedStatus ? (
            <Text className="text-[13px] leading-5 text-auth-muted">
              Falta {formatMoney(forecast.worstCase.protectionGap)} para cubrir pagos y colchón.
            </Text>
          ) : null}
          {forecast.conditionStatus === "conditional" ? (
            <Text className="text-[12px] leading-[18px] text-auth-muted">
              La proyección incluye cobros o acuerdos pendientes.
            </Text>
          ) : null}
        </View>
        <View accessibilityRole="tablist" className="flex-row gap-1 rounded-2xl bg-auth-canvas p-1">
          {forecast.scenarios.map((scenario) => (
            <Pressable
              key={scenario.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: selected?.id === scenario.id }}
              onPress={() => setSelectedId(scenario.id)}
              className={`min-h-11 flex-1 items-center justify-center rounded-xl px-2 py-2 ${selected?.id === scenario.id ? "bg-auth-background shadow-sm shadow-auth-action/5" : "active:bg-auth-background/60"}`}
            >
              <Text
                className={`text-[13px] leading-5 ${selected?.id === scenario.id ? "font-semibold text-auth-foreground" : "text-auth-muted"}`}
              >
                {scenario.id === "base" ? "Esperado" : "Cobros tarde"}
              </Text>
            </Pressable>
          ))}
        </View>
        {selected ? (
          <Animated.View key={selected.id} entering={scenarioEntrance} className="gap-3">
            {selected.id === "collection_delay" ? (
              <Text className="text-[12px] leading-[18px] text-auth-muted">
                Cobros con {selected.delayDays} días de retraso.
              </Text>
            ) : null}
            <ForecastTrend scenario={selected} />
          </Animated.View>
        ) : (
          <AppText tone="muted">No hay escenarios disponibles.</AppText>
        )}
      </View>
    </View>
  );
}

export function LiquidityScreen(): ReactElement {
  const query = useDashboard();
  const { controller } = useSession();
  const colors = useThemeColors();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const data = query.data;
  return (
    <Screen>
      <PageHeader
        title="Mi liquidez"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => {
              void controller.signOut();
            }}
            className="h-12 w-12 items-center justify-center rounded-full bg-auth-background active:opacity-60"
          >
            <LogOut size={19} strokeWidth={1.7} color={colors.accent} />
          </Pressable>
        }
      />
      {query.isPending ? <LoadingSkeleton /> : null}
      {query.isError ? (
        <InlineNotice
          message={
            query.error instanceof MissingDemoBusinessError
              ? query.error.message
              : apiErrorMessage(query.error)
          }
          danger
        />
      ) : null}
      {query.fetchStatus === "paused" ? (
        <InlineNotice message="Sin conexión. Los datos conservan su fecha original." />
      ) : null}
      {data ? (
        <>
          <CapacityOverview data={data} onDetails={() => setDetailsVisible(true)} />
          {data.liquidity.forecast.availability === "ready" ? (
            <ForecastSummary forecast={data.liquidity.forecast} />
          ) : (
            <View className="gap-2 rounded-[28px] bg-auth-background p-5">
              <AppText variant="heading">Faltan datos para proyectar</AppText>
              <AppText tone="muted">
                Revisa los compromisos y la disponibilidad de la fuente en los detalles.
              </AppText>
            </View>
          )}
          <LiquidityDetails
            data={data}
            visible={detailsVisible}
            onClose={() => setDetailsVisible(false)}
          />
        </>
      ) : null}
      <View className="gap-1">
        <Button
          label="Volver a consultar"
          variant="ghost"
          busy={query.isFetching}
          busyLabel="Consultando…"
          onPress={() => {
            void query.refetch();
          }}
        />
        <Text className="text-center text-[12px] leading-[18px] text-auth-muted">
          Consultar no actualiza la fuente bancaria.
        </Text>
      </View>
    </Screen>
  );
}
