# Contributing

## Development setup

Use Node.js 22+ and pnpm 11.1.3, as pinned in `package.json`.

```sh
git clone https://github.com/Kevin-SalazarG/nessie-node-sdk.git
cd nessie-node-sdk
pnpm install --frozen-lockfile
pnpm check
```

The test suite uses fixtures, injected transports, and local HTTP servers. It requires no API key and does not call production. Package verification installs a tarball into an isolated temporary consumer and checks ESM, CommonJS, subpath exports, published TypeScript declarations, and the README's JavaScript and TypeScript examples. Documentation examples are type-checked, not executed against the API.

## Project structure

```text
src/
  nessie.ts                 Public client and package entry point
  resources/                One file per API resource
  models/                   Resource schemas and inferred types
  http/                     Transport, options, retries, validation, and redaction
  errors/nessie-errors.ts    Public error classes
tests/                      Runtime, contract, and type regression tests
scripts/                    Encoding and package verification
examples/                   Runnable integration examples
spec/nessie-openapi.yaml     Unmodified upstream specification snapshot
docs/                       Endpoint reference and contract decisions
```

## Quality checks

| Command               | Purpose                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| `pnpm check`          | Run all checks, tests, build, and package verification.                        |
| `pnpm format`         | Format supported source, configuration, and documentation files with Prettier. |
| `pnpm format:check`   | Check formatting without changing files.                                       |
| `pnpm check:encoding` | Check UTF-8 without BOM, LF line endings, and final newlines.                  |
| `pnpm lint`           | Run Biome lint; warnings fail the check.                                       |
| `pnpm lint:fix`       | Apply Biome's safe lint fixes.                                                 |
| `pnpm typecheck`      | Check TypeScript without emitting files.                                       |
| `pnpm test`           | Run runtime, contract, and architecture tests.                                 |
| `pnpm build`          | Build ESM, CommonJS, and declaration files into `dist/`.                       |
| `pnpm test:package`   | Verify a package built with `pnpm build`.                                      |
| `pnpm pack`           | Build and create a distributable tarball.                                      |

Prettier owns formatting; Biome owns lint. `.editorconfig` specifies UTF-8 without BOM, LF line endings, and two-space indentation. The original OpenAPI snapshot and generated lockfile are excluded from formatting.

TypeScript uses strict mode, exact optional properties, and checked index access. Source architecture tests reject `any`, type assertions, non-null assertions, suppression directives, and `index.ts` entry points.

Dependencies are pinned in `pnpm-lock.yaml`; commit intentional lockfile updates. Only esbuild's install script is allowed by the workspace configuration. Git ignores dependencies, build output, coverage, tarballs, environment files, logs, and editor files. Keep `.env.example` free of real credentials.

## Adding an operation

1. Verify the endpoint against the published API contract and record its source in [the endpoint reference](docs/endpoints.md).
2. Define or reuse a schema in `src/models/`; infer its TypeScript type from that schema.
3. Add the method to the matching resource file. Reuse the shared transport instead of duplicating authentication, validation, or retries.
4. Add route, validation, response, and type regression tests. Document contract discrepancies in [the contract notes](docs/contract.md).
5. Export public types from `src/nessie.ts` when appropriate and run `pnpm check`.

Keep comments only when they explain a non-obvious decision, contract limitation, public option semantics, or a required type-test directive. Use descriptive resource filenames, such as `customers.ts` and `accounts.ts`.

## Running examples

Set `NESSIE_API_KEY` in your environment. The SDK does not load `.env` files automatically.

```sh
pnpm exec tsx examples/list-customers.ts
```

`examples/create-customer.ts` changes data on the configured server. Run it only when you intend to create a customer.

## Commits and pull requests

Use short, direct commit subjects in English, in the imperative form. Examples: `Fix timeout handling`, `Add loan validation`, or `Update usage examples`.

Keep changes focused. Include tests for behavior changes and update documentation for public API changes. Run `pnpm check` before submitting. Never include API keys, authenticated URLs, or sensitive customer data in commits, issues, or test fixtures.

GitHub Actions runs the checks on Node.js 22 and 24 for pushes and pull requests. The workflow does not publish packages.
