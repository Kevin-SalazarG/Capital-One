import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Mirror",
  slug: "mirror-local",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "mirror-local",
  ios: {
    bundleIdentifier: "dev.mirror.local",
    supportsTablet: false,
    infoPlist: { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } },
  },
  android: { package: "dev.mirror.local" },
  plugins: [
    "expo-secure-store",
    "react-native-bottom-tabs",
    "./plugins/with-ios-bundle-path.cjs",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#f1f6f8",
        image: "./assets/brand/capital-one-splash.png",
        imageWidth: 176,
        resizeMode: "contain",
      },
    ],
  ],
};

// Expo's dynamic configuration requires a default export. No directory barrel is used.
export default config;
