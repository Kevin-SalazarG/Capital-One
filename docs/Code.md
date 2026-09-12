# Code Standards

**Version:** 1.0  
**Date:** 2026-09-12  
**Status:** agreed policy; local workspace checks and the repository CI workflow are implemented. Individual local and remote run results remain separate verification evidence.  
**Scope:** Mirror backend, mobile app, shared packages, SDK contributions, tests, scripts, and configuration maintained by the team.

## 1. Purpose and authority

Write code that is explicit, strongly typed, easy to navigate, secure by design, and straightforward to change. Organization must make ownership and behavior visible, not merely add folders or abstractions.

[Idea.md](Idea.md) defines product scope. [Backend.md](Backend.md) defines backend architecture. This document defines coding standards. [GitHub.md](GitHub.md) defines contribution and delivery rules.

These standards do not authorize implementation, broad refactoring, dependency installation, or changes to existing SDK behavior. Apply them to authorized work and report existing conflicts without silently rewriting unrelated files.

Source identifiers, comments, test descriptions, new engineering documentation, and GitHub communication must be in English. Existing Spanish product documents and localized user-facing copy are not automatically translated by this policy.

## 2. Non-negotiable rules

1. Never introduce explicit or implicit `any` into first-party code, including tests and mocks.
2. Do not create `index.ts` or equivalent index entry points in first-party code.
3. Validate external data at runtime before treating it as a trusted application type.
4. Keep financial calculations and authoritative decisions in the backend.
5. Maintain one authoritative implementation of each business rule.
6. Use Prettier for formatting, Biome for linting, and TypeScript for type checking.
7. Save text files as UTF-8 without BOM, with LF line endings and a final newline.
8. Keep secrets, credentials, and sensitive payloads out of clients, logs, fixtures, and Git history.
9. Fix the cause of a failed check; do not weaken a rule to make the check pass.
10. Do not claim code is tested, secure, deployed, or complete without supporting evidence.

## 3. TypeScript and precise contracts

### 3.1 Compiler baseline

First-party TypeScript must enable:

- `strict`, including `noImplicitAny` and strict null checking.
- `noUncheckedIndexedAccess`.
- `exactOptionalPropertyTypes`.
- `useUnknownInCatchVariables`.
- `noImplicitOverride` and `noImplicitReturns`.
- `noFallthroughCasesInSwitch`.
- `noUnusedLocals` and `noUnusedParameters`.
- `forceConsistentCasingInFileNames`.

Backend code uses ESM according to `Backend.md`. Mobile follows its supported build configuration without disabling these safety requirements. A compiler upgrade must be reviewed rather than accommodated by silently relaxing checks. [TypeScript strict mode](https://www.typescriptlang.org/tsconfig/strict.html), [indexed access](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html), [optional properties](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html).

### 3.2 No `any`, including disguised escape hatches

- No `any` annotations, generic arguments, generic constraints, array elements, unions, or type aliases.
- No `as any`, double casts such as `as unknown as T`, or assertions used to pretend unvalidated data is safe.
- No untyped callbacks, event handlers, mocks, request bodies, or response wrappers.
- Do not replace a known model with `Object`, `Function`, an empty object type, or an unrestricted dictionary.
- Do not suppress application errors with `@ts-ignore`, `@ts-nocheck`, blanket lint disables, or non-null assertions.
- `@ts-expect-error` is limited to deliberate negative type tests with a specific expected error and explanation. It must never enable a forbidden type or unsafe production path.

Use `unknown` at an untrusted boundary, then narrow it with a runtime schema or a real type guard. If a dependency returns an unsafe value, contain it as `unknown` immediately and validate it before use. Do not propagate its unsafe type into application contracts.

`Record<string, unknown>` is appropriate only for genuinely unknown dictionaries before validation, not as a substitute for a domain model. Prefer `satisfies`, literal types, discriminated unions, and `readonly` data where they preserve meaningful guarantees. Constant assertions that preserve literal values are not the same as pretending external data has a type.

### 3.3 Model each concept deliberately

- Give domain models, request schemas, response contracts, component props, hook results, and error types descriptive names.
- Exported functions, services, adapters, and hooks must have explicit parameter and return types. Simple local values may use safe inference.
- Use one schema as the source for a transport contract and infer its TypeScript type when practical.
- Keep provider types, persistence types, domain models, and public API contracts separate when their meanings differ; map them at their boundaries.
- Model meaningful states with discriminated unions instead of unrelated booleans that permit impossible combinations.
- Distinguish absent fields, `null`, zero, and empty strings. Do not hide missing required values with defaults.
- Keep identifiers scoped by their meaning; do not accept an account identifier where a business identifier is expected just because both are strings.

Example of an explicit state contract:

```typescript
export type EvaluationAvailability =
  | { readonly status: "ready"; readonly evaluationId: string }
  | { readonly status: "blocked"; readonly reasons: readonly string[] };
```

Runtime validation still checks invariants that the type alone cannot express, such as requiring at least one reason for a blocked result.

### 3.4 Generated and external code

The ban applies to all authored Mirror code, regardless of whether a human or an assistant writes it. Mirror's generated public API client must also preserve precise contracts and named entry points; configure or replace an unsuitable generator rather than hand-editing its output.

Third-party dependencies are external code, not an excuse to weaken Mirror's boundaries. Keep them isolated behind typed adapters. Authored Supabase record schemas, RPC contracts and SQL migrations remain first-party code and must pass the applicable checks. Do not rewrite `node_modules`, and do not label authored business logic as generated to exclude it from checks.

## 4. Files, imports, and module boundaries

### 4.1 No index files or directory barrels

Do not create authored `index.ts`, `index.tsx`, `index.mts`, `index.cts`, `index.js`, or `index.jsx` files, or declarations serving the same index role. Do not replace them with a generically named barrel that exports an entire directory.

Use meaningful files such as `forecast-engine.ts`, `decision.schema.ts`, `use-liquidity.ts`, and `liquidity-card.tsx`. Import the file or an explicitly declared package entry point, not a directory that relies on implicit index resolution.

A package may expose a deliberately named public entry, such as the SDK's `nessie.ts` or a generated `client.ts`. Such entries use an explicit public export list, not wildcard re-exports of private implementation details.

Prefer named exports and `import type` for type-only imports. A framework-required default export is permitted when documented and necessary; it does not permit an index file. If a framework or generator requires a forbidden entry point, resolve the configuration or raise the conflict before implementation.

### 4.2 Naming and ownership

- Source files and directories: descriptive `kebab-case` names.
- Types, classes, and React components: `PascalCase`.
- Functions, variables, and properties: `camelCase`.
- Hooks: names beginning with `use`, such as `useLiquidity`.
- Constants: `UPPER_SNAKE_CASE` for true shared constants, not every local `const`.
- Test files: the subject name followed by `.test.ts`, `.spec.ts`, or the corresponding TSX extension.
- Preserve established document names such as `Code.md` and external resource filenames.

Each module owns its rules and writes. Cross-module access uses explicit public operations. Do not import another module's private repository, bypass its invariants, or introduce circular dependencies.

Keep package exports narrow. Backend-only dependencies must never enter the mobile dependency graph. Native mobile dependencies belong in the mobile package, and shared dependency versions must remain compatible across the workspace.

## 5. DRY, utilities, helpers, and hooks

DRY means one source of truth for a repeated rule or responsibility. It does not require unrelated concepts to share an abstraction because a few lines look similar.

Before adding code, search the repository for the same behavior, contract, component, or business rule. Reuse or improve its existing owner. When extracting shared behavior, migrate the affected callers in the authorized scope and test that their behavior remains correct.

| Kind               | Responsibility                                                                              | Placement                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Utility            | Small, generally reusable, pure transformation or predicate without business policy or I/O. | Feature-local `utils/`; promote to a technical shared location only when real consumers need it. |
| Helper             | Feature-specific composition, mapping, or preparation with a clear purpose.                 | The owning feature's `helpers/` directory or a descriptive file beside its caller.               |
| Domain function    | Authoritative business rule, calculation, or invariant.                                     | The owning backend domain, not a generic utilities folder.                                       |
| Service or adapter | Orchestration, persistence, network access, or another explicit side effect.                | Application or infrastructure layer.                                                             |
| React hook         | Reusable React state, lifecycle, subscriptions, or API interaction.                         | The owning mobile feature's `hooks/` directory.                                                  |
| Shared component   | A repeated visual pattern with a stable interface.                                          | Mobile UI or design-system folder, imported through a named file.                                |

Examples of placement, not files already created:

```text
apps/api/src/
├── platform/utils/is-non-empty-string.ts
└── modules/planning/
    ├── application/helpers/build-forecast-input.ts
    └── domain/forecast-engine.ts

apps/mobile/src/
├── features/liquidity/
│   ├── hooks/use-liquidity.ts
│   └── components/liquidity-card.tsx
└── shared/utils/format-money.ts
```

Do not create empty `utils`, `helpers`, or `hooks` folders in every feature. Do not add another `common.ts`, `helpers.ts`, or `utils.ts` containing unrelated code. A helper must not hide network calls, permission checks, or financial policy behind an innocuous name.

Mobile formatting is presentation only. A money formatter must not recompute a reserve, choose a business rounding policy, or turn an expected payment into available cash.

### 5.1 React hooks

- Use custom hooks for reusable React behavior, not for pure functions or backend services.
- Keep hooks at the supported call sites and follow React's Rules of Hooks; ordinary hooks must not be called conditionally or from utility functions.
- Return explicit, typed states and operations. Distinguish loading, error, empty, stale, and successful results where relevant.
- Share one API client and one owner for each server-data query pattern instead of repeating fetch and refresh logic across screens.
- Handle cancellation, cleanup, and outdated responses; a slow earlier request must not overwrite a newer result.
- Derive UI-only values when practical instead of duplicating state. Authoritative financial values still come from the backend.
- Reusing a hook shares logic, not automatically the same state instance. Shared state requires an explicit owner.

These rules follow React's separation between reusable hook behavior and independent state. [Custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks).

## 6. Readability and useful comments

- Functions and classes should have one clear responsibility. Split them when explaining their behavior requires unrelated steps or concepts.
- Prefer clear names, straightforward control flow, early returns, and exhaustive handling of meaningful states.
- Avoid deeply nested conditionals, side effects inside transformations, unexplained constants, and dense expressions that hide intent.
- Extract repeated domain constants to their owner with units and meaning; do not invent a global constants file for unrelated values.
- Remove dead code, unused exports, stale comments, and abandoned experiments within the authorized scope.
- Do not introduce abstractions, inheritance, caching, or memoization without a concrete reason.

Comments should explain **why**, an invariant, a unit, a security constraint, or a non-obvious provider limitation. They should not narrate obvious syntax.

Use documentation comments on public APIs when they clarify assumptions, errors, units, or examples. Keep comments in English, near the relevant code, and updated with behavior. Do not leave commented-out implementations or decorative banners.

Workarounds require an explanation and a real tracking reference when available. TODOs must describe actionable remaining work; they must not conceal a missing security or correctness requirement. Preserve required license and copyright notices.

## 7. Formatting, encoding, and lint

### 7.1 Prettier owns formatting

Use **Prettier**, not a separate tool named "Pretty". Prettier formats supported files; Biome checks code quality. Disable the Biome formatter and conflicting style rules so the two tools do not rewrite each other's output. [Prettier and linters](https://prettier.io/docs/integrating-with-linters).

Baseline settings, matching the existing SDK convention:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "endOfLine": "lf",
  "proseWrap": "preserve"
}
```

Print width is a formatting target, not a guarantee that every line stays within 100 characters. Keep formatter versions and settings consistent across editors, scripts, and CI. [Prettier options](https://prettier.io/docs/options).

Use checks in CI and write mode only for the authorized local files. Do not include an unrelated repository-wide formatting pass in a feature change.

### 7.2 UTF-8 and LF

All maintained text files must be valid UTF-8 without a byte-order mark, use LF line endings, and end with a newline. Encoding validation must decode bytes strictly rather than silently replacing invalid input.

Review unexpected replacement characters, mojibake, invisible control characters, and misleading Unicode in identifiers. Legitimate localized text remains valid UTF-8. Binary assets, including the challenge PDF, must not be processed as text or reformatted.

The future editor and Git configuration must support these rules without automatically rewriting unrelated legacy files.

### 7.3 Checks must cover the actual policy

`strict` does not ban explicit `any`. Biome's `noExplicitAny` must be configured as an error, but it is not the complete enforcement of this policy. [Biome rule](https://biomejs.dev/linter/rules/no-explicit-any/javascript/).

The source-policy check must inspect first-party syntax and types to reject forbidden index files, all explicit `any` positions, unsafe type escape hatches, and unsafe inferred values crossing application boundaries. Use TypeScript-aware analysis rather than a text search that mistakes prose or comments for code.

Prove the checks with intentionally invalid samples, including a generic constraint using `any`, an unsafe value from a dependency, and a virtual index-file path. Supply them as in-memory virtual files or inert text input to the checker, not executable first-party source or actual forbidden index files. The checker must reject them; their intentional failures are not accepted application code.

Warnings are failures in the quality gate. Do not add broad ignore patterns or disable checks to pass CI. Any third-party tooling exception must be narrow, explained, and must not exempt authored business code or weaken its public contracts.

## 8. Security and financial correctness

Security depends on verified controls, not on TypeScript, a framework, or a claim that code is "super secure".

- Treat request bodies, identifiers, tokens, provider responses, files, and configuration as untrusted until checked.
- Authenticate and authorize every protected operation and object. A known identifier or hidden UI control is not permission.
- Never accept a business scope only because the client supplied it.
- Keep credentials, connection strings, and privileged SDKs server-side. Validate configuration at startup.
- Use parameterized database operations; never concatenate untrusted SQL or shell input.
- Apply bounded payloads, pagination, timeouts, cancellation, and rate limits where appropriate.
- Retry reads only under a defined policy. Retry writes only when their idempotency and ambiguous outcomes are handled correctly.
- Redact secrets from error messages, logs, request URLs, traces, fixtures, screenshots, and examples.
- Keep user/session context isolated between requests. Do not store mutable user sessions in a global shared client.
- Return safe, structured errors. Catch `unknown` values, classify them, and never hide a failure by returning a fake success or empty result.
- Keep permission checks and consistency invariants inside the relevant write workflow, not only in an earlier screen or request.

Financial rules follow `Backend.md`: decimal arithmetic, explicit units and rounding, separate observed and expected cash, no duplicate imports, versioned snapshots, and atomic plan confirmation. Never implement a second copy of these rules in mobile or a helper.

## 9. Tests, dependencies, and generated artifacts

- Add regression tests for fixes and meaningful tests for new behavior.
- Test boundaries, invalid inputs, missing data, cancellation, provider failure, tenant isolation, duplicates, rounding, and concurrent decisions as relevant.
- Use strongly typed mocks and deterministic synthetic fixtures. Tests are not exempt from the typing rules.
- Inject time and other nondeterministic inputs where repeatability matters.
- Keep unit tests near their subject and integration/E2E tests in the locations defined by `Backend.md`.
- Do not replace database integration tests with mocks when validating transactions or database-enforced permissions.
- Do not claim a live integration works because mocked tests pass.
- Pin reviewed dependency versions and commit the appropriate lockfile. Align shared versions without overriding incompatible peer requirements.
- Keep native dependencies declared in the mobile package and server-only dependencies out of mobile.
- Regenerate artifacts from their source of truth. Do not hand-edit generated clients, copy provider contracts into several places, or commit transient build output without a documented delivery need.

## 10. Required quality gate

These are target script responsibilities, not scripts installed by this document:

| Script or check       | Required result                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `check:encoding`      | Valid UTF-8, no BOM, LF, final newline for maintained text.                                |
| `check:source-policy` | No forbidden first-party index files, `any`, unsafe escape hatches, or prohibited imports. |
| `format:check`        | Prettier reports no formatting changes.                                                    |
| `typecheck`           | Every affected workspace passes its TypeScript checks.                                     |
| `lint`                | Biome passes with warnings treated as failures.                                            |
| `test`                | Relevant unit, integration, and E2E tests pass.                                            |
| `build`               | Affected packages build with the pinned toolchain.                                         |
| `check:contracts`     | API specification and generated client stay consistent.                                    |
| `check`               | Aggregate all applicable checks without hiding failures.                                   |

Documentation-only changes may use a documented reduced scope, but must still validate encoding, formatting, links, and applicable policy. "Not applicable" is not the same as a test that ran successfully.

Before handing off a change, confirm:

- [ ] The change stays within the authorized scope and preserves unrelated work.
- [ ] Types, runtime validation, module boundaries, and the no-index policy are respected.
- [ ] Existing behavior was reused; new shared code has clear ownership.
- [ ] Comments explain useful context and remain accurate.
- [ ] Security and financial invariants are covered where affected.
- [ ] Relevant checks ran, and skipped checks have explicit reasons.
- [ ] Documentation and API contracts match the delivered behavior.
- [ ] No implementation or verification is claimed before it actually happens.

Repository-wide enforcement, hooks, and CI configuration will be implemented only when authorized. This document establishes the standard; it does not certify the current repository as compliant.
