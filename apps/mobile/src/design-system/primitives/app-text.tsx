import type { ReactElement, ReactNode } from "react";
import { Text } from "react-native";

interface AppTextProps {
  readonly children: ReactNode;
  readonly variant?: "title" | "heading" | "body" | "caption" | "money";
  readonly tone?: "normal" | "muted" | "danger" | "warning";
}
const roles = {
  title: "text-title font-semibold tracking-tight",
  heading: "text-xl font-semibold",
  body: "text-base leading-6",
  caption: "text-sm leading-5",
  money: "text-money font-semibold tracking-tight tabular-nums",
};
const tones = {
  normal: "text-foreground",
  muted: "text-muted",
  danger: "text-danger",
  warning: "text-warning",
};

export function AppText({
  children,
  variant = "body",
  tone = "normal",
}: AppTextProps): ReactElement {
  return (
    <Text
      accessibilityRole={variant === "title" || variant === "heading" ? "header" : "text"}
      className={`${roles[variant]} ${tones[tone]}`}
    >
      {children}
    </Text>
  );
}
