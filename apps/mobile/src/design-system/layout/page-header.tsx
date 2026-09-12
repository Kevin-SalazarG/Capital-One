import type { ReactElement, ReactNode } from "react";
import { Text, View } from "react-native";
import { CapitalOneLogo } from "../brand/capital-one-logo";

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps): ReactElement {
  return (
    <View className="gap-3">
      <View className="min-h-12 flex-row items-center justify-between gap-4">
        <View className="flex-row items-center gap-3">
          <CapitalOneLogo width={104} />
          <Text className="text-[10px] font-semibold tracking-[2px] text-auth-muted">MIRROR</Text>
        </View>
        {action ?? null}
      </View>
      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="text-[30px] leading-[37px] font-semibold tracking-tight text-auth-foreground"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[16px] leading-6 text-auth-muted">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
