import type { ReactElement } from "react";
import { ActivityIndicator, View } from "react-native";
import ArrowRight from "lucide-react-native/icons/arrow-right";
import { ReduceMotion } from "react-native-reanimated";
import { Button as HeroButton } from "heroui-native/button";
import { useAuthColors } from "../theme/use-theme-colors";

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly busy?: boolean;
  readonly disabled?: boolean;
  readonly variant?: "primary" | "outline" | "ghost";
  readonly appearance?: "default" | "brand";
  readonly busyLabel?: string;
}

export function Button({
  label,
  onPress,
  busy = false,
  disabled = false,
  variant = "primary",
  appearance = "default",
  busyLabel = "Un momento…",
}: ButtonProps): ReactElement {
  const colors = useAuthColors();
  return (
    <HeroButton
      variant={variant}
      size="lg"
      feedbackVariant="scale-highlight"
      animation={
        appearance === "brand"
          ? {
              scale: {
                value: 0.985,
                ignoreScaleCoefficient: true,
                timingConfig: { duration: 140, reduceMotion: ReduceMotion.System },
              },
              highlight: {
                backgroundColor: { value: colors.actionPressed },
                opacity: {
                  value: [0, 1],
                  timingConfig: { duration: 100, reduceMotion: ReduceMotion.System },
                },
              },
            }
          : {}
      }
      className={
        appearance === "brand" ? "min-h-14 rounded-2xl bg-auth-action" : "min-h-14 rounded-2xl"
      }
      isDisabled={disabled || busy}
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      onPress={onPress}
    >
      <HeroButton.Label
        className={
          appearance === "brand" ? "text-[17px] font-semibold text-auth-action-foreground" : ""
        }
      >
        {busy ? busyLabel : label}
      </HeroButton.Label>
      {appearance === "brand" ? (
        <View
          pointerEvents="none"
          className="absolute right-5"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.actionForeground} />
          ) : (
            <ArrowRight size={20} strokeWidth={1.8} color={colors.actionForeground} />
          )}
        </View>
      ) : null}
    </HeroButton>
  );
}
