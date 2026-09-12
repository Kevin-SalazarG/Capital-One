const { withXcodeProject } = require("expo/config-plugins");

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @type {import("expo/config-plugins").ConfigPlugin} */
function withIosBundlePath(config) {
  return withXcodeProject(config, (mod) => {
    /** @type {unknown} */
    const hash = mod.modResults.hash;
    if (!isRecord(hash) || !isRecord(hash.project) || !isRecord(hash.project.objects))
      throw new Error("The iOS Xcode project structure is missing.");
    const phases = hash.project.objects.PBXShellScriptBuildPhase;
    if (!isRecord(phases)) throw new Error("The iOS shell script phases are missing.");

    const command =
      "\"$NODE_BINARY\" --print \"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\"";
    const unquotedCommand = `\`${command}\``;
    const quotedCommand = `"$(${command})"`;
    let found = false;

    for (const phase of Object.values(phases)) {
      if (
        !isRecord(phase) ||
        (phase.name !== '"Bundle React Native code and images"' &&
          phase.name !== "Bundle React Native code and images")
      ) {
        continue;
      }
      if (typeof phase.shellScript !== "string")
        throw new Error("The React Native bundle phase does not contain a script.");
      /** @type {unknown} */
      const script = JSON.parse(phase.shellScript);
      if (typeof script !== "string")
        throw new Error("The React Native bundle script is not a serialized string.");
      if (!script.includes(unquotedCommand) && !script.includes(quotedCommand))
        throw new Error("The Expo bundle command changed; review the iOS path quoting plugin.");

      // Quote the resolved executable path before the shell splits names containing spaces.
      phase.shellScript = JSON.stringify(script.replace(unquotedCommand, quotedCommand));
      found = true;
    }
    if (!found) throw new Error("The React Native bundle phase is missing.");
    return mod;
  });
}

module.exports = withIosBundlePath;
