import { useEffect, type ReactElement } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { CapitalOneLogo } from "../brand/capital-one-logo";
import { MirrorLoginArt } from "../brand/mirror-login-art";
import { useMotionPreference } from "../design-system-provider";

export function BrandLoading({
  label,
  loading,
}: {
  readonly label: string;
  readonly loading: boolean;
}): ReactElement {
  const { height } = useWindowDimensions();
  const reducedMotion = useMotionPreference();
  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * 120 }],
  }));
  useEffect(() => {
    if (reducedMotion || !loading) {
      progress.set(0);
    } else {
      progress.set(-1);
      progress.set(
        withRepeat(
          withTiming(1, {
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            reduceMotion: ReduceMotion.System,
          }),
          -1,
          true,
          undefined,
          ReduceMotion.System,
        ),
      );
    }
    return () => cancelAnimation(progress);
  }, [loading, progress, reducedMotion]);
  return (
    <View
      className="flex-1 items-center bg-auth-canvas"
      accessible
      accessibilityRole={loading ? "progressbar" : "image"}
      accessibilityLabel={label}
      accessibilityState={{ busy: loading }}
    >
      <View
        className="absolute w-full items-center"
        style={{ top: height / 2 - 224 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <MirrorLoginArt />
      </View>
      <View
        className="absolute items-center"
        style={{ top: height / 2 - (176 * 150) / 418 / 2 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <CapitalOneLogo width={176} />
        {loading ? (
          <View className="mt-10 h-[3px] w-32 items-center overflow-hidden rounded-full bg-auth-action/10">
            <Animated.View className="h-full w-12 rounded-full bg-auth-red" style={progressStyle} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
