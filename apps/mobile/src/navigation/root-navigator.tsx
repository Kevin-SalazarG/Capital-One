import type { ReactElement } from "react";
import { Platform, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { SignInScreen } from "../features/auth/sign-in-screen";
import { LiquidityScreen } from "../features/liquidity/liquidity-screen";
import { useSession } from "../platform/session/session-provider";
import { useThemeColors } from "../design-system/theme/use-theme-colors";
import { DecisionsPendingScreen, JobPlanningPendingScreen } from "./feature-pending-screen";

type RootRoutes = { SignIn: undefined; Main: undefined };
type MainRoutes = { Liquidity: undefined; JobPlanning: undefined; Decisions: undefined };
const Stack = createNativeStackNavigator<RootRoutes>();
const Tabs = createNativeBottomTabNavigator<MainRoutes>();

function MainTabs(): ReactElement {
  const colors = useThemeColors();
  return (
    <Tabs.Navigator screenOptions={{ tabBarActiveTintColor: colors.accent }}>
      <Tabs.Screen
        name="Liquidity"
        component={LiquidityScreen}
        options={{
          title: "Mi liquidez",
          ...(Platform.OS === "ios"
            ? { tabBarIcon: () => ({ sfSymbol: "chart.xyaxis.line" as const }) }
            : {}),
        }}
      />
      <Tabs.Screen
        name="JobPlanning"
        component={JobPlanningPendingScreen}
        options={{
          title: "Evaluar trabajo",
          ...(Platform.OS === "ios"
            ? { tabBarIcon: () => ({ sfSymbol: "plus.circle" as const }) }
            : {}),
        }}
      />
      <Tabs.Screen
        name="Decisions"
        component={DecisionsPendingScreen}
        options={{
          title: "Mis decisiones",
          ...(Platform.OS === "ios"
            ? { tabBarIcon: () => ({ sfSymbol: "checklist" as const }) }
            : {}),
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator(): ReactElement {
  const { session } = useSession();
  const colors = useThemeColors();
  if (session.status === "restoring") return <View className="flex-1 bg-auth-canvas" />;
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.foreground,
          border: colors.border,
          notification: colors.danger,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
        {session.status === "authenticated" ? (
          <Stack.Screen navigationKey={session.scopeKey} name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
