import type { ReactElement, ReactNode } from "react";
import { Surface as HeroSurface } from "heroui-native/surface";

export function Surface({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <HeroSurface className="gap-4 rounded-[28px] border border-white bg-surface p-6 shadow-sm shadow-auth-action/5">
      {children}
    </HeroSurface>
  );
}
