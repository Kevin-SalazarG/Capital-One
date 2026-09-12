import type { ReactElement } from "react";
import { Text, View } from "react-native";
import BriefcaseBusiness from "lucide-react-native/icons/briefcase-business";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import Check from "lucide-react-native/icons/check";
import ClipboardList from "lucide-react-native/icons/clipboard-list";
import Clock3 from "lucide-react-native/icons/clock-3";
import HandCoins from "lucide-react-native/icons/hand-coins";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { PageHeader } from "../design-system/layout/page-header";
import { Screen } from "../design-system/layout/screen";
import { useAuthColors, useThemeColors } from "../design-system/theme/use-theme-colors";

type PendingFeature = "planning" | "decisions";

const contentEntrance = FadeIn.duration(260).reduceMotion(ReduceMotion.System);

function PendingIllustration({ feature }: { readonly feature: PendingFeature }): ReactElement {
  const colors = useThemeColors();
  const authColors = useAuthColors();
  return (
    <View
      className="relative h-56 w-full items-center justify-center"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="absolute h-48 w-48 rounded-full border border-auth-border/25" />
      <View className="absolute h-36 w-36 rounded-full bg-auth-canvas" />
      <View className="h-28 w-24 -rotate-6 items-center justify-center rounded-3xl bg-auth-action shadow-lg shadow-auth-action/15">
        {feature === "planning" ? (
          <BriefcaseBusiness size={38} strokeWidth={1.4} color={authColors.actionForeground} />
        ) : (
          <ClipboardList size={38} strokeWidth={1.4} color={authColors.actionForeground} />
        )}
      </View>
      <View className="absolute left-5 top-8 h-14 w-14 -rotate-6 items-center justify-center rounded-2xl border border-auth-canvas bg-auth-background shadow-sm shadow-auth-action/10">
        {feature === "planning" ? (
          <HandCoins size={25} strokeWidth={1.5} color={colors.accent} />
        ) : (
          <Clock3 size={25} strokeWidth={1.5} color={colors.accent} />
        )}
      </View>
      <View className="absolute bottom-6 right-5 h-14 w-14 rotate-6 items-center justify-center rounded-2xl border border-auth-canvas bg-auth-background shadow-sm shadow-auth-action/10">
        {feature === "planning" ? (
          <CalendarDays size={25} strokeWidth={1.5} color={colors.accent} />
        ) : (
          <Check size={25} strokeWidth={1.5} color={colors.accent} />
        )}
      </View>
      <View className="absolute bottom-9 left-14 h-2 w-2 rounded-full bg-auth-red" />
      <View className="absolute right-14 top-8 h-1.5 w-1.5 rounded-full bg-auth-action/30" />
    </View>
  );
}

function PendingFeatureScreen({
  feature,
  title,
  description,
}: {
  readonly feature: PendingFeature;
  readonly title: string;
  readonly description: string;
}): ReactElement {
  return (
    <Screen>
      <PageHeader title={title} />
      <Animated.View
        entering={contentEntrance}
        className="items-center gap-5 rounded-[28px] border border-white bg-auth-background px-6 pb-10 pt-5 shadow-sm shadow-auth-action/5"
      >
        <PendingIllustration feature={feature} />
        <View className="rounded-full bg-auth-canvas px-4 py-2">
          <Text className="text-[12px] font-semibold tracking-wide text-auth-foreground">
            Próximamente
          </Text>
        </View>
        <Text className="max-w-[280px] text-center text-[17px] leading-[26px] text-auth-muted">
          {description}
        </Text>
      </Animated.View>
    </Screen>
  );
}

export function JobPlanningPendingScreen(): ReactElement {
  return (
    <PendingFeatureScreen
      feature="planning"
      title="Evaluar trabajo"
      description="Podrás comparar anticipos y pagos al proveedor antes de aceptar un trabajo."
    />
  );
}

export function DecisionsPendingScreen(): ReactElement {
  return (
    <PendingFeatureScreen
      feature="decisions"
      title="Mis decisiones"
      description="Podrás revisar tus planes registrados, sus condiciones y cuándo necesitan atención."
    />
  );
}
