import type { ReactElement } from "react";
import { useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useCSSVariable } from "uniwind";

function resolvedColor(value: unknown): string {
  if (typeof value !== "string" || value.length === 0)
    throw new Error("Missing resolved login illustration color");
  return value;
}

export function MirrorLoginArt(): ReactElement {
  const values = useCSSVariable([
    "--auth-action",
    "--auth-red",
    "--auth-art-base",
    "--auth-art-edge",
  ]);
  const navy = resolvedColor(values[0]);
  const red = resolvedColor(values[1]);
  const base = resolvedColor(values[2]);
  const edge = resolvedColor(values[3]);
  const instanceId = useId();
  const shadowId = `${instanceId}-shadow`;
  const paperId = `${instanceId}-paper`;
  const reflectionId = `${instanceId}-reflection`;
  const rimId = `${instanceId}-rim`;
  const rearProgress = useSharedValue(0);
  const frontProgress = useSharedValue(0);

  useEffect(() => {
    rearProgress.set(
      withSpring(1, {
        damping: 24,
        stiffness: 190,
        mass: 0.9,
        reduceMotion: ReduceMotion.System,
      }),
    );
    frontProgress.set(
      withDelay(
        70,
        withSpring(1, {
          damping: 24,
          stiffness: 175,
          mass: 0.9,
          reduceMotion: ReduceMotion.System,
        }),
        ReduceMotion.System,
      ),
    );
    return () => {
      cancelAnimation(rearProgress);
      cancelAnimation(frontProgress);
    };
  }, [frontProgress, rearProgress]);

  const rearStyle = useAnimatedStyle(() => {
    const progress = rearProgress.get();
    return {
      opacity: Math.min(1, Math.max(0, progress)),
      transform: [
        { translateY: (1 - progress) * 15 },
        { rotate: `${(1 - progress) * -4}deg` },
        { scale: 0.96 + progress * 0.04 },
      ],
    };
  });
  const frontStyle = useAnimatedStyle(() => {
    const progress = frontProgress.get();
    return {
      opacity: Math.min(1, Math.max(0, progress)),
      transform: [
        { translateY: (1 - progress) * 22 },
        { rotate: `${(1 - progress) * 5}deg` },
        { scale: 0.94 + progress * 0.06 },
      ],
    };
  });

  return (
    <View
      style={styles.canvas}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 180" style={styles.layer}>
        <Defs>
          <RadialGradient id={shadowId}>
            <Stop offset="0" stopColor={navy} stopOpacity={0.15} />
            <Stop offset="0.5" stopColor={navy} stopOpacity={0.05} />
            <Stop offset="1" stopColor={navy} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="166" cy="161" rx="124" ry="15" fill={`url(#${shadowId})`} />
      </Svg>

      <Animated.View style={[styles.layer, rearStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 320 180">
          <Defs>
            <LinearGradient id={paperId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0" stopColor="white" />
              <Stop offset="1" stopColor={base} />
            </LinearGradient>
          </Defs>
          <Path
            d="M38 120C76 155 238 177 281 88"
            fill="none"
            stroke={red}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <G rotation="-12" origin="129,82">
            <Rect x="58" y="33" width="144" height="111" rx="25" fill={navy} opacity={0.035} />
            <Rect x="57" y="27" width="144" height="113" rx="24" fill={edge} />
            <Rect
              x="57"
              y="24"
              width="144"
              height="113"
              rx="24"
              fill={`url(#${paperId})`}
              stroke={edge}
              strokeWidth="0.8"
            />
            <Rect x="75" y="42" width="108" height="77" rx="17" fill="white" opacity={0.64} />
            <Path
              d="M76 102C94 61 140 52 181 58V100C141 89 110 92 76 116Z"
              fill={base}
              opacity={0.72}
            />
            <Path
              d="M71 58V49C71 41 77 36 85 36H173"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path d="M80 125H173" stroke={edge} strokeWidth="0.8" opacity={0.8} />
          </G>
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.layer, frontStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 320 180">
          <Defs>
            <LinearGradient id={reflectionId} x1="0%" y1="0%" x2="85%" y2="100%">
              <Stop offset="0" stopColor="white" stopOpacity={0.22} />
              <Stop offset="0.5" stopColor="white" stopOpacity={0.03} />
              <Stop offset="1" stopColor="white" stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0" stopColor="white" stopOpacity={0.76} />
              <Stop offset="0.6" stopColor={edge} stopOpacity={0.16} />
              <Stop offset="1" stopColor="white" stopOpacity={0.38} />
            </LinearGradient>
          </Defs>
          <G rotation="10" origin="194,103">
            <Rect x="129" y="53" width="132" height="110" rx="25" fill={navy} opacity={0.07} />
            <Rect x="128" y="48" width="132" height="110" rx="24" fill={navy} opacity={0.3} />
            <Rect x="128" y="45" width="132" height="110" rx="24" fill={navy} />
            <Rect
              x="128"
              y="45"
              width="132"
              height="110"
              rx="24"
              fill={`url(#${reflectionId})`}
              stroke={`url(#${rimId})`}
              strokeWidth="1"
            />
            <Path
              d="M142 91V73C142 66 147 61 154 61H228"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              opacity={0.36}
            />
            <Path d="M146 132L223 59H243L166 132Z" fill="white" opacity={0.045} />
            <Path d="M177 132L245 68V89L198 132Z" fill="white" opacity={0.025} />
            <Path
              d="M237 117V130C237 136 233 139 227 139H188"
              fill="none"
              stroke={edge}
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity={0.25}
            />
          </G>
          <Path d="M111 153C177 165 257 145 281 88C264 153 181 174 111 153Z" fill={red} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: "100%", maxWidth: 320, height: 180, alignSelf: "center" },
  layer: { ...StyleSheet.absoluteFill },
});
