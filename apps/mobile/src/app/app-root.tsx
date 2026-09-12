import "../design-system/theme/global.css";
import { useState, type ReactElement } from "react";
import { Appearance, Text, View } from "react-native";
import { Uniwind } from "uniwind";
import { hide } from "expo-splash-screen";
import { readMobileConfig } from "../platform/config/mobile-config";
import { createMobileRuntime, type MobileRuntime } from "../platform/api/mirror-client";
import { AppProviders } from "./app-providers";
import { RootNavigator } from "../navigation/root-navigator";
import { SessionTransition } from "../navigation/session-transition";

Uniwind.setTheme("light");
Appearance.setColorScheme("light");

function configuredRuntime(): MobileRuntime | null {
  try {
    return createMobileRuntime(
      readMobileConfig(
        process.env.EXPO_PUBLIC_MIRROR_API_URL ?? (__DEV__ ? "http://127.0.0.1:3000" : undefined),
        __DEV__,
      ),
    );
  } catch {
    return null;
  }
}

export function AppRoot(): ReactElement {
  const [runtime] = useState(configuredRuntime);
  if (!runtime)
    return (
      <View onLayout={hide} style={{ flex: 1, justifyContent: "center", padding: 32 }}>
        <Text accessibilityRole="alert">
          Falta una dirección válida para la API de Mirror. Revisa la configuración de esta
          instalación.
        </Text>
      </View>
    );
  return (
    <AppProviders runtime={runtime}>
      <SessionTransition>
        <RootNavigator />
      </SessionTransition>
    </AppProviders>
  );
}
