import { useEffect, useRef, type ReactElement } from "react";
import Animated, {
  cancelAnimation,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { BrandLoading } from "./brand-loading";

export interface BrandTransitionProps {
  readonly destination: string | null;
  readonly ready: boolean;
  readonly signingIn: boolean;
  readonly minimumDuration: number;
  readonly onRevealed: (destination: string) => void;
}

const interruptedExit = FadeOut.duration(180).reduceMotion(ReduceMotion.System);

export function BrandTransition({
  destination,
  ready,
  signingIn,
  minimumDuration,
  onRevealed,
}: BrandTransitionProps): ReactElement {
  const openedAt = useRef(Date.now());
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  useEffect(() => {
    if (!ready || destination === null) {
      opacity.set(1);
      return () => cancelAnimation(opacity);
    }
    const remaining = Math.max(0, minimumDuration - (Date.now() - openedAt.current));
    opacity.set(
      withDelay(
        remaining,
        withTiming(0, { duration: 360, reduceMotion: ReduceMotion.System }, (finished) => {
          if (finished === true) scheduleOnRN(onRevealed, destination);
        }),
        ReduceMotion.System,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [destination, minimumDuration, onRevealed, opacity, ready]);
  return (
    <Animated.View className="absolute inset-0 z-10" style={style} exiting={interruptedExit}>
      <BrandLoading label={signingIn ? "Iniciando sesión" : "Abriendo Mirror"} loading={!ready} />
    </Animated.View>
  );
}
