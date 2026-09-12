import { registerRootComponent } from "expo";
import { preventAutoHideAsync } from "expo-splash-screen";
import { AppRoot } from "./app/app-root";

// React replaces the native logo only after its branded loading view is laid out.
void preventAutoHideAsync().catch(() => undefined);

registerRootComponent(AppRoot);
