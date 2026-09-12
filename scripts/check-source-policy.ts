import { existsSync, readFileSync } from "node:fs";
import { isBuiltin } from "node:module";
import { basename, dirname, relative, resolve } from "node:path";
import ts from "typescript";
import { maintainedFiles } from "./workspace-files.js";

interface PolicyIssue {
  readonly file: string;
  readonly line: number;
  readonly rule: string;
}

const root = process.cwd();

function privateSdkImport(specifier: string): boolean {
  return (
    specifier.includes("nessie-node-sdk") &&
    !/^nessie-node-sdk(?:\/(?:errors|models\/[^/]+|package\.json))?$/.test(specifier)
  );
}

function mobileFile(path: string): boolean {
  return /(?:^|\/)apps\/mobile\//.test(path.replaceAll("\\", "/"));
}

function mobileSourceFile(path: string): boolean {
  return /(?:^|\/)apps\/mobile\/src\//.test(path.replaceAll("\\", "/"));
}

function serverDependency(specifier: string): boolean {
  return /^(?:@nestjs\/|@supabase\/|nessie-node-sdk(?:$|\/)|@mirror\/api(?:$|\/)|(?:pg|pg-native|express|helmet|pino|pino-http|server-only)(?:$|\/))/.test(
    specifier,
  );
}

function serverImplementation(path: string): boolean {
  return /(?:^|\/)(?:apps\/api|nessie-node-sdk)(?:$|\/)/.test(path.replaceAll("\\", "/"));
}

function unsafeType(type: ts.Type, checker: ts.TypeChecker, seen = new Set<ts.Type>()): boolean {
  if (type.flags & ts.TypeFlags.Any) return true;
  if (seen.has(type)) return false;
  seen.add(type);
  if (type.isUnionOrIntersection())
    return type.types.some((item) => unsafeType(item, checker, seen));
  if (!(type.flags & ts.TypeFlags.Object)) return false;
  const symbol = type.getSymbol();
  const name = symbol?.getName();
  if (
    checker.isArrayType(type) ||
    checker.isTupleType(type) ||
    name === "Promise" ||
    name === "PromiseLike" ||
    name === "Map" ||
    name === "Set"
  ) {
    if (isTypeReference(type))
      return checker.getTypeArguments(type).some((item) => unsafeType(item, checker, seen));
  }
  // Traverse inferred application objects, but do not mistake a vendor class's
  // private internals for values that crossed our validated adapter boundary.
  if (name === "__object" || name === "__type") {
    return checker.getPropertiesOfType(type).some((property) => {
      const declaration = property.valueDeclaration ?? property.declarations?.[0];
      return declaration
        ? unsafeType(checker.getTypeOfSymbolAtLocation(property, declaration), checker, seen)
        : false;
    });
  }
  return false;
}

function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return (
    Boolean(type.flags & ts.TypeFlags.Object) &&
    "objectFlags" in type &&
    typeof type.objectFlags === "number" &&
    Boolean(type.objectFlags & ts.ObjectFlags.Reference)
  );
}

function unknownType(type: ts.Type): boolean {
  return Boolean(type.flags & ts.TypeFlags.Unknown);
}

function inspect(
  program: ts.Program,
  sourceFiles: readonly ts.SourceFile[],
): readonly PolicyIssue[] {
  const checker = program.getTypeChecker();
  const issues: PolicyIssue[] = [];
  for (const source of sourceFiles) {
    const reported = new Set<string>();
    function report(node: ts.Node, rule: string): void {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const key = `${line}:${rule}`;
      if (!reported.has(key)) {
        issues.push({ file: source.fileName, line, rule });
        reported.add(key);
      }
    }
    if (/^index(?:\.d)?\.[cm]?[jt]sx?$/i.test(basename(source.fileName)))
      report(source, "forbidden index file");
    const scanner = ts.createScanner(
      ts.ScriptTarget.Latest,
      false,
      ts.LanguageVariant.Standard,
      source.text,
    );
    for (
      let token = scanner.scan();
      token !== ts.SyntaxKind.EndOfFileToken;
      token = scanner.scan()
    ) {
      if (
        token === ts.SyntaxKind.SingleLineCommentTrivia ||
        token === ts.SyntaxKind.MultiLineCommentTrivia
      ) {
        const comment = scanner.getTokenText();
        if (/@ts-(?:ignore|nocheck)\b|(?:biome|eslint)-(?:ignore|disable)/.test(comment))
          report(source, "prohibited suppression");
        if (
          /@ts-expect-error/.test(comment) &&
          (!source.fileName.endsWith(".type-test.ts") ||
            !/@ts-expect-error\s+\S.{10,}/.test(comment))
        )
          report(source, "undocumented or misplaced negative type test");
      }
    }
    const meaningful = source.statements.filter(
      (statement) => !ts.isImportDeclaration(statement) && !ts.isEmptyStatement(statement),
    );
    if (meaningful.length > 0 && meaningful.every((statement) => ts.isExportDeclaration(statement)))
      report(source, "directory barrel without an implementation owner");

    function inspectImport(node: ts.Node, specifier: string): void {
      if (privateSdkImport(specifier)) report(node, "private SDK import");
      const publicClient = /(?:^|\/)packages\/api-client\//.test(
        source.fileName.replaceAll("\\", "/"),
      );
      if (!publicClient && !mobileFile(source.fileName)) return;
      const resolved = ts.resolveModuleName(
        specifier,
        source.fileName,
        program.getCompilerOptions(),
        ts.sys,
      ).resolvedModule?.resolvedFileName;
      const relativeTarget = specifier.startsWith(".")
        ? resolve(dirname(source.fileName), specifier)
        : specifier;
      // Native tooling runs on Node outside src; bundled app code and the
      // public client may never depend on a Node runtime or server internals.
      const nodeDependency =
        (publicClient || mobileSourceFile(source.fileName)) &&
        (specifier.startsWith("node:") || isBuiltin(specifier));
      if (
        nodeDependency ||
        serverDependency(specifier) ||
        serverImplementation(relativeTarget) ||
        (resolved !== undefined && serverImplementation(resolved))
      ) {
        report(
          node,
          publicClient ? "server dependency in public client" : "server dependency in mobile",
        );
      }
    }

    function visit(node: ts.Node): void {
      if (node.kind === ts.SyntaxKind.AnyKeyword) report(node, "explicit any");
      if (
        ts.isTypeReferenceNode(node) &&
        ts.isIdentifier(node.typeName) &&
        ["Object", "Function"].includes(node.typeName.text)
      )
        report(node, "unrestricted object or function type");
      if (ts.isTypeLiteralNode(node) && node.members.length === 0)
        report(node, "unrestricted empty object type");
      if (ts.isNonNullExpression(node)) report(node, "non-null assertion");
      if (ts.isExportDeclaration(node) && !node.exportClause)
        report(node, "wildcard barrel export");
      if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
        const target = checker.getTypeFromTypeNode(node.type);
        const sourceType = checker.getTypeAtLocation(node.expression);
        const isConst =
          ts.isTypeReferenceNode(node.type) &&
          ts.isIdentifier(node.type.typeName) &&
          node.type.typeName.text === "const";
        if (
          !isConst &&
          (ts.isAsExpression(node.expression) || ts.isTypeAssertionExpression(node.expression))
        )
          report(node, "double type assertion");
        if (
          !isConst &&
          !unknownType(target) &&
          (unknownType(sourceType) ||
            unsafeType(sourceType, checker) ||
            !checker.isTypeAssignableTo(sourceType, target))
        )
          report(node, "unsafe type assertion");
      }
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        inspectImport(node, node.moduleSpecifier.text);
      }
      if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression &&
        ts.isStringLiteralLike(node.moduleReference.expression)
      ) {
        inspectImport(node, node.moduleReference.expression.text);
      }
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteralLike(node.argument.literal)
      ) {
        inspectImport(node, node.argument.literal.text);
      }
      if (
        ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isBindingElement(node) ||
        ts.isPropertyDeclaration(node)
      ) {
        if (ts.isIdentifier(node.name) && unsafeType(checker.getTypeAtLocation(node.name), checker))
          report(node, "unsafe inferred value");
      }
      if (
        (ts.isJsxExpression(node) || ts.isJsxSpreadAttribute(node)) &&
        node.expression &&
        unsafeType(checker.getTypeAtLocation(node.expression), checker)
      ) {
        report(node, "unsafe JSX value");
      }
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const signature = checker.getResolvedSignature(node);
        const parameters = signature?.getParameters() ?? [];
        for (const [position, argument] of (node.arguments ?? []).entries()) {
          if (!unsafeType(checker.getTypeAtLocation(argument), checker)) continue;
          const parameter = parameters[position] ?? parameters.at(-1);
          const declaration = parameter?.valueDeclaration;
          const parameterType =
            parameter && declaration
              ? checker.getTypeOfSymbolAtLocation(parameter, declaration)
              : undefined;
          if (!parameterType || !unknownType(parameterType))
            report(argument, "unsafe call argument");
        }
        if (
          node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === "require") ||
          (ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === "module" &&
            node.expression.name.text === "require")
        ) {
          const argument = node.arguments?.[0];
          if (argument && ts.isStringLiteralLike(argument)) inspectImport(argument, argument.text);
          else if (mobileSourceFile(source.fileName))
            report(node, "non-literal module import in mobile source");
        }
      }
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        unsafeType(checker.getTypeAtLocation(node.right), checker) &&
        !unknownType(checker.getTypeAtLocation(node.left))
      )
        report(node, "unsafe assignment boundary");
      if (
        ts.isReturnStatement(node) &&
        node.expression &&
        unsafeType(checker.getTypeAtLocation(node.expression), checker)
      ) {
        let parent: ts.Node | undefined = node.parent;
        while (parent && !ts.isFunctionLike(parent)) parent = parent.parent;
        const signature =
          parent && ts.isFunctionLike(parent) && "body" in parent
            ? checker.getSignatureFromDeclaration(parent)
            : undefined;
        if (!signature || !unknownType(checker.getReturnTypeOfSignature(signature)))
          report(node, "unsafe return boundary");
      }
      if (
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node)
      ) {
        const signature = checker.getSignatureFromDeclaration(node);
        if (signature && unsafeType(checker.getReturnTypeOfSignature(signature), checker))
          report(node, "unsafe function return type");
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return issues;
}

function virtualProgram(
  name: string,
  text: string,
): { readonly program: ts.Program; readonly source: ts.SourceFile } {
  const file = resolve(root, ".policy-virtual", name);
  const external = resolve(root, ".policy-virtual", "external.d.ts");
  const contents = new Map([
    [file, text],
    [external, "declare function readExternal(): any; declare function readExternalList(): any[];"],
  ]);
  const options: ts.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    jsx: ts.JsxEmit.ReactJSX,
    noEmit: true,
    skipLibCheck: true,
  };
  const host = ts.createCompilerHost(options);
  const originalSource = host.getSourceFile.bind(host);
  host.getSourceFile = (path, languageVersion, onError, shouldCreateNewSourceFile) => {
    const content = contents.get(path);
    return content === undefined
      ? originalSource(path, languageVersion, onError, shouldCreateNewSourceFile)
      : ts.createSourceFile(path, content, languageVersion, true);
  };
  const program = ts.createProgram([file, external], options, host);
  const source = program.getSourceFile(file);
  if (!source) throw new Error("Unable to construct policy self-test source");
  return { program, source };
}

function selfTest(): number {
  const samples: readonly {
    readonly name: string;
    readonly text: string;
    readonly expected: string | null;
  }[] = [
    {
      name: "constraint.ts",
      text: "export type Constraint<Value extends any> = Value;",
      expected: "explicit any",
    },
    {
      name: "unsafe.ts",
      text: "export const value = readExternal();",
      expected: "unsafe inferred value",
    },
    {
      name: "unsafe-list.ts",
      text: "export const value = readExternalList();",
      expected: "unsafe inferred value",
    },
    {
      name: "unsafe-return.ts",
      text: "export function read() { return readExternal(); }",
      expected: "unsafe return boundary",
    },
    {
      name: "unsafe-object.ts",
      text: "export const value = { nested: readExternal() };",
      expected: "unsafe inferred value",
    },
    {
      name: "unsafe-forward.ts",
      text: "function consume(value: string): string { return value; } export const result = consume(readExternal());",
      expected: "unsafe call argument",
    },
    {
      name: "unsafe-assign.ts",
      text: "let result = ''; result = readExternal(); export { result };",
      expected: "unsafe assignment boundary",
    },
    {
      name: "empty-type.ts",
      text: "export type Empty = {};",
      expected: "unrestricted empty object type",
    },
    { name: "index.ts", text: "export const value = 1;", expected: "forbidden index file" },
    {
      name: "assertion.ts",
      text: "const value: unknown = 1; export const result = value as unknown as string;",
      expected: "double type assertion",
    },
    {
      name: "nonnull.ts",
      text: "const value: string | undefined = undefined; export const result = value!;",
      expected: "non-null assertion",
    },
    {
      name: "suppression.ts",
      text: "// @ts-ignore\nexport const value = 1;",
      expected: "prohibited suppression",
    },
    { name: "barrel.ts", text: "export * from './module.js';", expected: "wildcard barrel export" },
    {
      name: "private-sdk.ts",
      text: "import '../nessie-node-sdk/src/nessie.js'; export const result = 1;",
      expected: "private SDK import",
    },
    {
      name: "public-sdk.ts",
      text: "import 'nessie-node-sdk/errors'; export const result = 1;",
      expected: null,
    },
    {
      name: "apps/mobile/src/server-import.ts",
      text: "import '@nestjs/common'; export const result = 1;",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/provider-import.ts",
      text: "void import('@supabase/supabase-js');",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/sdk-import.ts",
      text: "void import(`nessie-node-sdk`);",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/builtin-import.ts",
      text: "import 'fs/promises'; export const result = 1;",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/database-require.ts",
      text: "require('pg');",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/module-require.ts",
      text: "module.require('node:fs');",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/server-relative.ts",
      text: "import '../../api/src/main.js'; export const result = 1;",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/server-package.ts",
      text: "import '@mirror/api/planning'; export const result = 1;",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/server-type.ts",
      text: "export type Server = import('@supabase/supabase-js').SupabaseClient;",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/server-import-equals.cts",
      text: "import server = require('@nestjs/core'); export { server };",
      expected: "server dependency in mobile",
    },
    {
      name: "apps/mobile/src/computed-import.ts",
      text: "const dependency = 'pg'; void import(dependency);",
      expected: "non-literal module import in mobile source",
    },
    {
      name: "apps/mobile/src/unsafe-screen.tsx",
      text: "export const value = readExternal(); export function Screen(): unknown { return <span>{value}</span>; }",
      expected: "unsafe inferred value",
    },
    {
      name: "apps/mobile/src/unsafe-child.tsx",
      text: "export function Screen(): unknown { return <span>{readExternal()}</span>; }",
      expected: "unsafe JSX value",
    },
    {
      name: "apps/mobile/src/unsafe-props.tsx",
      text: "export function Screen(): unknown { return <span {...readExternal()} />; }",
      expected: "unsafe JSX value",
    },
    {
      name: "apps/mobile/src/public-client.ts",
      text: "import '@mirror/api-client'; export const result = 1;",
      expected: null,
    },
    {
      name: "apps/mobile/app.config.ts",
      text: "import 'node:path'; export const config = { name: 'Mirror' };",
      expected: null,
    },
    {
      name: "packages/api-client/src/server-dynamic.ts",
      text: "void import('@supabase/supabase-js');",
      expected: "server dependency in public client",
    },
    {
      name: "packages/api-client/src/server-require.ts",
      text: "require('node:fs');",
      expected: "server dependency in public client",
    },
    {
      name: "packages/api-client/src/server-relative.ts",
      text: "import '../../../apps/api/src/main.js'; export const result = 1;",
      expected: "server dependency in public client",
    },
    {
      name: "valid.ts",
      text: "export function read(): unknown { return readExternal(); } export const value: unknown = readExternal(); export const state = { kind: 'ready' } as const;",
      expected: null,
    },
  ];
  for (const sample of samples) {
    const { program, source } = virtualProgram(sample.name, sample.text);
    const issues = inspect(program, [source]);
    if (
      sample.expected ? !issues.some((issue) => issue.rule === sample.expected) : issues.length > 0
    )
      throw new Error(`Source-policy self-test failed: ${sample.name}`);
  }
  return samples.length;
}

const sampleCount = selfTest();
const maintained = new Set(
  maintainedFiles(root)
    .filter((file) => /\.[cm]?[jt]sx?$/.test(file))
    .map((file) => resolve(file)),
);
const issues: PolicyIssue[] = [];
const checked = new Set<string>();
const configurations = [
  "apps/api/tsconfig.json",
  "packages/api-client/tsconfig.json",
  "tsconfig.scripts.json",
];
for (const mobileConfiguration of [
  "apps/mobile/tsconfig.json",
  "apps/mobile/tsconfig.tooling.json",
]) {
  if (existsSync(resolve(root, mobileConfiguration))) configurations.push(mobileConfiguration);
}
for (const configuration of configurations) {
  const path = resolve(root, configuration);
  const contents: unknown = ts.parseConfigFileTextToJson(path, readFileSync(path, "utf8")).config;
  const parsed = ts.parseJsonConfigFileContent(contents, ts.sys, resolve(path, ".."));
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const sources = program
    .getSourceFiles()
    .filter(
      (source) =>
        maintained.has(resolve(source.fileName)) && !checked.has(resolve(source.fileName)),
    );
  for (const source of sources) checked.add(resolve(source.fileName));
  issues.push(...inspect(program, sources));
}
for (const file of maintained) {
  if (!checked.has(file))
    issues.push({
      file,
      line: 1,
      rule: "source file missing from configured typechecking projects",
    });
}
if (issues.length > 0) {
  console.error(
    issues.map((issue) => `${relative(root, issue.file)}:${issue.line}: ${issue.rule}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Source policy and ${sampleCount} negative/positive self-tests passed for ${checked.size} first-party source files.`,
  );
}
