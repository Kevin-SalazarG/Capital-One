import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".pnpm-store",
  ".branches",
  ".temp",
  ".next",
  "test-results",
  "playwright-report",
]);
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".d.ts",
  ".editorconfig",
  ".html",
  ".json",
  ".js",
  ".md",
  ".mjs",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const textNames = new Set([
  ".env.example",
  ".gitattributes",
  ".gitignore",
  ".prettierignore",
]);

async function* walk(directory) {
  const entries = await (
    await import("node:fs/promises")
  ).readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }

    const extension = entry.name.includes(".")
      ? `.${entry.name.split(".").pop()}`
      : "";
    if (textExtensions.has(extension) || textNames.has(entry.name)) {
      yield fullPath;
    }
  }
}

const decoder = new TextDecoder("utf-8", { fatal: true });
const failures = [];

for await (const filePath of walk(root)) {
  const bytes = await readFile(filePath);
  try {
    decoder.decode(bytes);
  } catch {
    failures.push(`${relative(root, filePath)} is not valid UTF-8`);
    continue;
  }

  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    failures.push(`${relative(root, filePath)} contains a UTF-8 BOM`);
  }

  if (bytes.includes(13)) {
    failures.push(`${relative(root, filePath)} contains CR line endings`);
  }

  if (bytes.length > 0 && bytes.at(-1) !== 10) {
    failures.push(`${relative(root, filePath)} does not end with a newline`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
