import type { ReactElement } from "react";
import { View } from "react-native";
import { Skeleton } from "heroui-native/skeleton";
import { AppText } from "../primitives/app-text";

export function LoadingSkeleton(): ReactElement {
  return (
    <View
      accessibilityLabel="Cargando información"
      accessibilityState={{ busy: true }}
      className="gap-4"
    >
      <AppText tone="muted">Consultando tu negocio…</AppText>
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-20 rounded-2xl" />
    </View>
  );
}
