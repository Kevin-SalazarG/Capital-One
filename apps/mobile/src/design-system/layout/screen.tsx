import { useContext, type ReactElement, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { BottomTabBarHeightContext } from "react-native-bottom-tabs";

interface ScreenProps {
  readonly children: ReactNode;
  readonly keyboard?: boolean;
}

export function Screen({ children, keyboard = false }: ScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const content = (
    <View
      className="mx-auto w-full max-w-[560px] flex-1 gap-6 px-5"
      style={{ paddingTop: 16, paddingBottom: Math.max(insets.bottom, tabBarHeight) + 24 }}
    >
      {children}
    </View>
  );
  return (
    <View className="flex-1 bg-auth-canvas" style={{ paddingTop: insets.top }}>
      {keyboard ? (
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          contentInsetAdjustmentBehavior="never"
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
        >
          {content}
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          contentInsetAdjustmentBehavior="never"
        >
          {content}
        </ScrollView>
      )}
    </View>
  );
}
