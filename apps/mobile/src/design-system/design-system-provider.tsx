import type { ReactNode, ReactElement } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { HeroUINativeProvider } from "heroui-native/provider";

const MotionPreferenceContext = createContext(true);

export function useMotionPreference(): boolean {
  return useContext(MotionPreferenceContext);
}

export function DesignSystemProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReducedMotion(value);
      })
      .catch(() => {
        /* Keep motion disabled when the device preference is unavailable. */
      });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <MotionPreferenceContext value={reducedMotion}>
      <HeroUINativeProvider
        config={{
          ...(reducedMotion ? { animation: "disable-all" } : {}),
          devInfo: { stylingPrinciples: false },
        }}
      >
        {children}
      </HeroUINativeProvider>
    </MotionPreferenceContext>
  );
}
