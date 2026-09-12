import { useCSSVariable } from "uniwind";

export interface ThemeColors {
  readonly background: string;
  readonly foreground: string;
  readonly surface: string;
  readonly muted: string;
  readonly accent: string;
  readonly border: string;
  readonly danger: string;
}

function color(value: unknown): string {
  if (typeof value !== "string" || value.length === 0)
    throw new Error("Missing resolved theme color");
  return value;
}

export function useThemeColors(): ThemeColors {
  const values = useCSSVariable([
    "--background",
    "--foreground",
    "--surface",
    "--muted",
    "--accent",
    "--border",
    "--danger",
  ]);
  return {
    background: color(values[0]),
    foreground: color(values[1]),
    surface: color(values[2]),
    muted: color(values[3]),
    accent: color(values[4]),
    border: color(values[5]),
    danger: color(values[6]),
  };
}

export function useAuthColors(): {
  readonly muted: string;
  readonly actionForeground: string;
  readonly actionPressed: string;
} {
  const values = useCSSVariable([
    "--auth-muted",
    "--auth-action-foreground",
    "--auth-action-pressed",
  ]);
  return {
    muted: color(values[0]),
    actionForeground: color(values[1]),
    actionPressed: color(values[2]),
  };
}
