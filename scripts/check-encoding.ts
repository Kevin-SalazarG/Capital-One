import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { isMaintainedText, maintainedFiles } from "./workspace-files.js";

const root = process.cwd();
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const failures: string[] = [];
let checked = 0;

for (const path of maintainedFiles(root).filter(isMaintainedText)) {
  const label = relative(root, path);
  try {
    const bytes = readFileSync(path);
    const content = decoder.decode(bytes);
    const issues: string[] = [];
    if (content.startsWith("\uFEFF")) issues.push("UTF-8 BOM");
    if (content.includes("\r")) issues.push("CR line ending");
    if (!content.endsWith("\n")) issues.push("missing final newline");
    if (content.includes("\u0000") || /[\uFFFD\u202A-\u202E\u2066-\u2069]/u.test(content))
      issues.push("invalid or misleading control character");
    if (issues.length > 0) failures.push(`${label}: ${issues.join(", ")}`);
    checked += 1;
  } catch {
    failures.push(`${label}: unreadable file or invalid UTF-8`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Encoding policy passed for ${checked} maintained text files.`);
}
