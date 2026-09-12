module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  clearMocks: true,
  resolver: "react-native-worklets/jest/resolver.js",
  // Jest merges this extension with Expo's source and asset transforms.
  // Resolve public Babel packages from their declaring framework dependencies.
  transform: {
    "\\.mjs$": [
      require.resolve("babel-jest", { paths: [require.resolve("jest-expo")] }),
      {
        root: __dirname,
        babelrcRoots: __dirname,
        babelrc: true,
        configFile: true,
        presets: [require.resolve("babel-preset-expo", { paths: [require.resolve("expo")] })],
        caller: { name: "metro", bundler: "metro", platform: "ios" },
      },
    ],
  },
  // Preserve the pinned Expo preset's pnpm/native allowances and transformer
  // exclusions while adding the UI packages that publish untranspiled ESM.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|heroui-native|uniwind|tailwind-variants|tailwind-merge|lucide-react-native))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],
  moduleNameMapper: {
    "^@mirror/api-client$": "<rootDir>/../../packages/api-client/src/client.ts",
  },
};
