import type { ReactElement, ReactNode } from "react";
import type { GetDashboardResult } from "@mirror/api-client";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import X from "lucide-react-native/icons/x";
import { useMotionPreference } from "../../design-system/design-system-provider";
import { InlineNotice } from "../../design-system/feedback/inline-notice";
import { useThemeColors } from "../../design-system/theme/use-theme-colors";
import { formatCalendarDate, formatInstant } from "../../shared/utils/format-calendar-date";
import { formatMoney } from "../../shared/utils/format-money";

interface LiquidityDetailsProps {
  readonly data: GetDashboardResult;
  readonly visible: boolean;
  readonly onClose: () => void;
}

type ReadyForecast = Extract<
  GetDashboardResult["liquidity"]["forecast"],
  { readonly availability: "ready" }
>;

const financialDescriptions: Record<ReadyForecast["financialStatus"], string> = {
  protected: "La proyección cubre pagos y colchón en los escenarios evaluados.",
  cushion_shortfall: "La proyección cubre los pagos, pero no conserva todo el colchón.",
  operational_shortfall: "La proyección muestra un faltante para cubrir los pagos.",
};

function DetailSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <View className="gap-5 rounded-3xl bg-auth-background p-5">
      <Text
        accessibilityRole="header"
        className="text-[18px] leading-6 font-semibold text-auth-foreground"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function DetailValue({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): ReactElement {
  return (
    <View className="gap-1">
      <Text className="text-[13px] leading-5 text-auth-muted">{label}</Text>
      <Text className="text-[16px] leading-6 font-medium tabular-nums text-auth-foreground">
        {value}
      </Text>
    </View>
  );
}

export function LiquidityDetails({ data, visible, onClose }: LiquidityDetailsProps): ReactElement {
  const reducedMotion = useMotionPreference();
  const colors = useThemeColors();
  const { business, liquidity } = data;
  const { forecast } = liquidity;
  const sourceLabel =
    business.source === "replay"
      ? "Reproducción sintética local"
      : business.source === "nessie_live"
        ? "Nessie sandbox"
        : "Fuente no disponible";

  return (
    <Modal
      visible={visible}
      transparent={false}
      presentationStyle="pageSheet"
      animationType={reducedMotion ? "none" : "slide"}
      allowSwipeDismissal
      onRequestClose={onClose}
    >
      {/* The sheet has separate native bounds, so it measures its own safe areas. */}
      <SafeAreaProvider>
        <SafeAreaView
          edges={["top", "bottom"]}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View className="flex-1 bg-auth-canvas" onAccessibilityEscape={onClose}>
            <View className="flex-row items-center gap-3 border-b border-auth-border/20 bg-auth-background px-6 py-4">
              <Text
                accessibilityRole="header"
                className="flex-1 text-[23px] leading-8 font-semibold tracking-tight text-auth-foreground"
              >
                Datos y supuestos
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar detalles"
                onPress={onClose}
                className="h-11 w-11 items-center justify-center rounded-full bg-auth-canvas active:opacity-60"
              >
                <X size={21} strokeWidth={1.8} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="never">
              <View className="gap-5 px-6 py-6">
                <DetailSection title="Origen de los datos">
                  <DetailValue label="Negocio" value={business.name} />
                  <DetailValue label="Fuente" value={sourceLabel} />
                  <DetailValue
                    label="Fecha de corte"
                    value={formatCalendarDate(business.cutoffDate)}
                  />
                  <DetailValue
                    label="Última actualización de la fuente"
                    value={
                      business.sourceSyncedAt
                        ? formatInstant(business.sourceSyncedAt, business.timezone)
                        : "Sin actualización confirmada"
                    }
                  />
                </DetailSection>

                {liquidity.lastSyncFailed ? (
                  <InlineNotice
                    message="Falló la última actualización de la fuente. Se conserva el último conjunto completo de datos."
                    danger
                  />
                ) : null}
                {forecast.freshness === "stale" ? (
                  <InlineNotice message="Los datos requieren revisión por antigüedad. El cálculo conserva el corte original." />
                ) : forecast.freshness === "unavailable" ? (
                  <InlineNotice message="No hay una fuente completa disponible para esta proyección." />
                ) : null}
                <Text className="text-[13px] leading-5 text-auth-muted">
                  Consultar esta pantalla no actualiza la fuente.
                </Text>

                <DetailSection title="Resultado de la proyección">
                  {forecast.availability === "ready" ? (
                    <>
                      <Text className="text-[16px] leading-6 text-auth-foreground">
                        {financialDescriptions[forecast.financialStatus]}
                      </Text>
                      <DetailValue
                        label="Reserva objetivo"
                        value={formatMoney(forecast.worstCase.reserveTarget)}
                      />
                      <DetailValue
                        label="Colchón del negocio"
                        value={formatMoney(business.cushion)}
                      />
                      <DetailValue
                        label="Brecha de protección"
                        value={formatMoney(forecast.worstCase.protectionGap)}
                      />
                      <Text className="text-[13px] leading-5 text-auth-muted">
                        La brecha es el monto que falta para cubrir pagos y colchón en el punto de
                        menor saldo.
                      </Text>
                    </>
                  ) : (
                    <Text className="text-[16px] leading-6 text-auth-foreground">
                      No hay información suficiente para evaluar pagos y colchón. Revisa los
                      compromisos y la disponibilidad de la fuente.
                    </Text>
                  )}
                  {forecast.conditionStatus === "conditional" ? (
                    <InlineNotice message="La proyección incluye cobros o acuerdos pendientes. El dinero esperado todavía no es efectivo observado." />
                  ) : null}
                </DetailSection>

                <DetailSection title="Alcance del cálculo">
                  <DetailValue
                    label="Horizonte evaluado hasta"
                    value={formatCalendarDate(forecast.horizonEnd)}
                  />
                  <Text className="text-[14px] leading-6 text-auth-muted">
                    La capacidad sin cobros futuros se calcula para el{" "}
                    {formatCalendarDate(forecast.capacityDate)}. Conserva las fechas originales de
                    pago cuando un acuerdo con el proveedor sigue pendiente.
                  </Text>
                  <Text className="text-[14px] leading-6 text-auth-muted">
                    La reserva es una referencia de planeación, no dinero apartado en el banco. El
                    cálculo no evalúa toda la operación posterior al horizonte indicado.
                  </Text>
                </DetailSection>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
