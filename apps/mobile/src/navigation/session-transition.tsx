import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Keyboard, View } from "react-native";
import { hide } from "expo-splash-screen";
import { BrandTransition } from "../design-system/feedback/brand-transition";
import { useSession } from "../platform/session/session-provider";
import type { SessionState } from "../platform/session/session-controller";

function destinationFor(session: SessionState): string | null {
  if (session.status === "restoring" || session.status === "signing-in") return null;
  return session.status === "authenticated" ? session.scopeKey : "sign-in";
}

export function SessionTransition({ children }: { readonly children: ReactNode }): ReactElement {
  const { controller, session } = useSession();
  const [nativeReady, setNativeReady] = useState(false);
  const [revealedDestination, setRevealedDestination] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const signingIn = session.status === "signing-in";
  const destination = destinationFor(session);
  const ready = nativeReady && destination !== null;
  const covered = !ready || destination !== revealedDestination;
  const reveal = useCallback(
    (completedDestination: string) => {
      if (destinationFor(controller.getSnapshot()) === completedDestination) {
        setRevealedDestination(completedDestination);
        setOpened(true);
      }
    },
    [controller],
  );
  useEffect(() => {
    if (signingIn) Keyboard.dismiss();
  }, [signingIn]);
  return (
    <View
      className="flex-1 bg-auth-canvas"
      onLayout={() => {
        if (!nativeReady) {
          hide();
          setNativeReady(true);
        }
      }}
    >
      <View
        className="flex-1"
        pointerEvents={covered ? "none" : "auto"}
        accessibilityElementsHidden={covered}
        importantForAccessibility={covered ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {covered ? (
        <BrandTransition
          destination={destination}
          ready={ready}
          signingIn={signingIn}
          minimumDuration={opened ? 650 : 1600}
          onRevealed={reveal}
        />
      ) : null}
    </View>
  );
}
