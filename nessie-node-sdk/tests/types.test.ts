import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import ts from "typescript";

test("source contains no explicit loose types, type assertions, suppression directives or index.ts", () => {
  const root = new URL("../src/", import.meta.url);
  function visitDirectory(directory: URL) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
      if (entry.isDirectory()) {
        visitDirectory(file);
        continue;
      }
      if (!entry.name.endsWith(".ts")) continue;
      assert.notEqual(entry.name, "index.ts");
      const source = readFileSync(file, "utf8");
      assert(!/@ts-(?:ignore|nocheck)/.test(source));
      const tree = ts.createSourceFile(
        join(directory.pathname, entry.name),
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      function visit(node: ts.Node) {
        assert.notEqual(node.kind, ts.SyntaxKind.AnyKeyword, `Loose type in ${entry.name}`);
        assert(
          !ts.isTypeAssertionExpression(node) && !ts.isAsExpression(node),
          `Type assertion in ${entry.name}`,
        );
        assert(!ts.isNonNullExpression(node), `Unchecked non-null assertion in ${entry.name}`);
        ts.forEachChild(node, visit);
      }
      visit(tree);
    }
  }
  visitDirectory(root);
});
