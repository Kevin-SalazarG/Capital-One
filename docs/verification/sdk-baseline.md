# SDK baseline verification

Verified on 2026-09-12 for P0.1 and P0.2 of [Backend-Plan.md](../Backend-Plan.md).

The workspace root was not a Git repository. The SDK was an independent, clean repository at commit `7d57c89` (`Document SDK usage`), with package version `0.1.0`. No SDK source, configuration, lockfile, or Git history was changed. Its declared build recreated ignored output; its package verification retained an isolated consumer in the operating system's temporary directory.

## Executed checks

Runtime: Node.js `v24.15.0`; package manager: pnpm `11.1.3`.

`pnpm check` ran inside `nessie-node-sdk/` and passed:

| Check             | Evidence                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Encoding          | 66 files passed strict UTF-8, no BOM, LF, and final-newline validation.                                               |
| Formatting        | Prettier reported all matched files formatted.                                                                        |
| Lint              | Biome checked 51 files with warnings treated as errors.                                                               |
| Types             | `tsc --noEmit` completed successfully.                                                                                |
| Tests             | 84 passed; zero failed, skipped, or cancelled. Fixtures and local HTTP servers were used.                             |
| Build             | ESM, CommonJS, and declaration output built successfully.                                                             |
| Installed package | An isolated packed installation passed ESM, CommonJS, subpath exports, published types, and compiled README examples. |

A separate Node 24 ESM smoke check imported `NessieClient` from `nessie-node-sdk`, injected a fixture-only fetch implementation, and called `accounts.get`, `deposits.listByAccount`, `withdrawals.listByAccount`, and `bills.listByAccount`. All four methods returned validated fixture results. The SDK Git status remained clean afterward.

## Public integration surface

Use the package root or its declared `models/*` and `errors` exports. Do not import private SDK source files.

| Public method                                    | Return type                        | Scoped operation                                                     |
| ------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------- |
| `accounts.listByCustomer(customerId, options?)`  | `Promise<Account[]>`               | Read only the configured customer's accounts.                        |
| `accounts.get(accountId, options?)`              | `Promise<Account>`                 | Read the selected account and balance.                               |
| `deposits.listByAccount(accountId, options?)`    | `Promise<Deposit[]>`               | Read selected-account deposits.                                      |
| `withdrawals.listByAccount(accountId, options?)` | `Promise<Withdrawal[]>`            | Read selected-account withdrawals.                                   |
| `bills.listByAccount(accountId, options?)`       | `Promise<Bill[]>`                  | Read selected-account bills.                                         |
| `deposits.create(accountId, body, options?)`     | `Promise<CreationResult<Deposit>>` | Separate, explicitly authorized controlled sandbox preparation only. |

All identifiers above are strings. `RequestOptions` accepts optional `signal: AbortSignal`, `timeoutMs: number`, and `maxRetries: number`. `NessieOptions` requires `apiKey` and accepts `baseUrl`, `timeoutMs`, `maxRetries`, and an injectable `fetch`. The default server is `https://prod-api.nessieisreal.com`; the default deadline is 10 seconds including retries and response-body reading; the default is two additional GET attempts. Writes are not retried automatically.

## Provider fields and interpretation limits

| Model        | SDK-validated fields relevant to Mirror                                                                                                                                                                                            | Remaining interpretation                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Account`    | `_id` is a 24-character string; `type` is Checking, Savings, or Credit Card; `balance` and `rewards` are nonnegative integers; `account_number` has 16 characters; `customer_id` and `nickname` are strings.                       | There is no currency or cutoff field. The units and balance relationship to observed transactions require authenticated verification.                                                                       |
| `Deposit`    | `_id`; integer `amount`; required string `medium`, `transaction_date`, `status`, and `description`.                                                                                                                                | Status and date strings are not domain-validated by the SDK. No account identifier is retained in this model; account scope comes from the requested route. Deposits are not necessarily operating revenue. |
| `Withdrawal` | `_id`; finite numeric `amount`; string `medium`; optional `transaction_date`, `status`, `description`, and `payer_id`.                                                                                                             | Missing critical dates/statuses must block normalization rather than invent settlement.                                                                                                                     |
| `Bill`       | `_id`, `account_id`; finite numeric `payment_amount`; `recurring_date` integer 1–31; string `payee`, `nickname`, `creation_date`, `payment_date`, and `upcoming_payment_date`; status pending, cancelled, completed, or recurring. | Recurrence semantics and settlement still need verification. The commitment owner must avoid duplicating a bill and an observed withdrawal.                                                                 |

Responses are validated and unmodeled fields discarded. The SDK enforces its published contract; Mirror must add units, ranges, calendar validation, state interpretation, account authorization, coherence checks, and classification. The provider exposes no documented cross-endpoint atomic snapshot or pagination guarantee through these methods. A stable balance read before and after a refresh is evidence of a stable bracket, not proof that every upstream read was atomic.

This work did not use an API key, make authenticated Nessie requests, write sandbox data, or verify live amounts, server states, or balance semantics. P0.4 and the live-provider handoff gate remain open. See the SDK's [contract and provenance notes](../../nessie-node-sdk/docs/contract.md).
