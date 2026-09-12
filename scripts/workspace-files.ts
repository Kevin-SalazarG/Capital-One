import { readdirSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const excludedDirectories = new Set([
  ".git",
  ".local",
  "node_modules",
  "dist",
  "coverage",
  "nessie-node-sdk",
]);

// Native projects and Expo build state are regenerated from the maintained app
// configuration under Continuous Native Generation.
const generatedDirectories = new Set([
  "apps/mobile/.expo",
  "apps/mobile/ios",
  "apps/mobile/android",
  "apps/mobile/build",
]);

export function maintainedFiles(root: string): readonly string[] {
  const files: string[] = [];
  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const relativePath = relative(root, path).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        if (!excludedDirectories.has(entry.name) && !generatedDirectories.has(relativePath)) {
          visit(path);
        }
      } else if (
        entry.isFile() &&
        (!entry.name.startsWith(".env") || entry.name.endsWith(".example"))
      ) {
        files.push(path);
      }
    }
  }
  visit(resolve(root));
  return files.sort();
}

export function isMaintainedText(path: string): boolean {
  const name = basename(path);
  return (
    /\.(?:[cm]?[jt]sx?|css|json|ya?ml|md|sql|toml|sh|txt|graphql|patch|example)$/.test(name) ||
    [
      "Dockerfile",
      ".gitignore",
      ".dockerignore",
      ".editorconfig",
      ".npmrc",
      ".prettierignore",
    ].includes(name)
  );
}
