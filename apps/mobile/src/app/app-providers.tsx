import type { ReactElement, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClientProvider } from "@tanstack/react-query";
import { DesignSystemProvider } from "../design-system/design-system-provider";
import { RuntimeProvider, type MobileRuntime } from "../platform/api/mirror-client";
import { SessionProvider } from "../platform/session/session-provider";
import { useAppLifecycle } from "../platform/query/app-lifecycle";

export function AppProviders({
  runtime,
  children,
}: {
  readonly runtime: MobileRuntime;
  readonly children: ReactNode;
}): ReactElement {
  useAppLifecycle();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <DesignSystemProvider>
            <QueryClientProvider client={runtime.queries}>
              <RuntimeProvider runtime={runtime}>
                <SessionProvider controller={runtime.session}>{children}</SessionProvider>
              </RuntimeProvider>
            </QueryClientProvider>
          </DesignSystemProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
