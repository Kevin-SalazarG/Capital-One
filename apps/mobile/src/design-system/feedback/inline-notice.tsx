import type { ReactElement } from "react";
import { View } from "react-native";
import { AppText } from "../primitives/app-text";

export function InlineNotice({
  message,
  danger = false,
}: {
  readonly message: string;
  readonly danger?: boolean;
}): ReactElement {
  return (
    <View
      accessibilityRole={danger ? "alert" : "text"}
      accessibilityLiveRegion="polite"
      className={
        danger
          ? "rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3"
          : "rounded-2xl bg-auth-canvas px-4 py-3"
      }
    >
      <AppText variant="caption" tone={danger ? "danger" : "muted"}>
        {message}
      </AppText>
    </View>
  );
}
