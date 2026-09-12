import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const ignoredDirectories = new Set(["node_modules", ".git", "dist", "coverage"]);
const extensions = new Set([
  ".ts",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yaml",
  ".yml",
]);
const namedFiles = new Set([
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".npmrc",
  ".prettierignore",
  ".env.example",
  "LICENSE",
]);
const decoder = new TextDecoder("utf-8", { fatal: true });
const failures = [];
let checked = 0;

function checkDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) checkDirectory(path);
      continue;
    }
    if (!entry.isFile() || (!extensions.has(extname(entry.name)) && !namedFiles.has(entry.name)))
      continue;
    checked++;
    const bytes = readFileSync(path);
    const name = relative(root, path);
    let text;
    try {
      text = decoder.decode(bytes);
    } catch {
      failures.push(`${name}: invalid UTF-8`);
      continue;
    }
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
      failures.push(`${name}: unexpected BOM`);
    if (text.includes("\r")) failures.push(`${name}: use LF line endings`);
    if (text.length > 0 && !text.endsWith("\n")) failures.push(`${name}: missing final newline`);
  }
}

checkDirectory(root);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Checked ${checked} files: UTF-8 without BOM, LF line endings and final newlines.`);
}
