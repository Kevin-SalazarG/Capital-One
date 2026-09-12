import type { ReactElement, ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeInDown, ReduceMotion } from "react-native-reanimated";
import { CapitalOneLogo } from "../brand/capital-one-logo";
import { MirrorLoginArt } from "../brand/mirror-login-art";

const headerEntrance = FadeIn.duration(380).reduceMotion(ReduceMotion.System);
const formEntrance = FadeInDown.springify()
  .damping(24)
  .stiffness(180)
  .mass(0.8)
  .reduceMotion(ReduceMotion.System);

interface AuthScreenProps {
  readonly children: ReactNode;
  readonly localDevelopment: boolean;
}

export function AuthScreen({ children, localDevelopment }: AuthScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-auth-canvas" style={{ paddingTop: insets.top }}>
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={148}
        contentInsetAdjustmentBehavior="never"
      >
        <View className="mx-auto w-full max-w-[480px] flex-1">
          <Animated.View
            entering={headerEntrance}
            className="flex-row items-center justify-between px-8 pt-4"
          >
            <CapitalOneLogo />
            <Text className="text-[11px] font-semibold tracking-[2px] text-auth-foreground">
              MIRROR
            </Text>
          </Animated.View>
          <View className="items-center pt-3 pb-6">
            <MirrorLoginArt />
          </View>
          <Animated.View
            entering={formEntrance}
            className="mx-5 -mt-6 rounded-[28px] border border-white bg-auth-background px-6 py-7 shadow-lg shadow-auth-action/8"
          >
            {children}
          </Animated.View>
          <View className="min-h-16 flex-1 justify-end pt-6">
            {localDevelopment ? (
              <Text className="text-center text-[12px] leading-5 text-auth-muted">Demo local</Text>
            ) : null}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
