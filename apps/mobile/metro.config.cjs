const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

module.exports = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: "./src/design-system/theme/global.css",
  dtsFile: "./.expo/uniwind-types.d.ts",
});
