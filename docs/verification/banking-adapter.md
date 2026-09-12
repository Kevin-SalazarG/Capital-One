# Banking adapter verification

The historical checks below ran locally on 2026-09-12 for P3 of [Backend-Plan.md](../Backend-Plan.md), using synthetic fixtures and isolated PostgreSQL. Its direct Supabase RPC replacement passed the fresh 89-test integration aggregate across ten files in 17.24 seconds. Authenticated Nessie verification remains a separate open gate.

## Implemented behavior

The banking module uses the public `nessie-node-sdk` interface for the configured customer and account. It reads the account before and after deposits, withdrawals, and bills, rejects changed account brackets, validates money and calendar dates, and preserves provider identity and settlement states. Deposits begin as unclassified movements. Bills are passed to the commitments module within the publishing transaction.

Live construction requires explicit verification of major-unit MXN interpretation. Financial source amounts must fit two decimals and the agreed limit; movement and bill amounts must be positive. A combined response above 500 records, missing critical fields, unknown movement states, changed duplicate records, or disappeared previously imported movements prevents publication. A stable balance bracket is a documented heuristic, not an atomic upstream snapshot.

The complete provider refresh has a maximum 15-second deadline, cancellation support, and at most one extra GET attempt. Provider failures return safe codes without raw bodies or credential-bearing URLs. Simulation paths do not call provider write methods.

Publication uses a coherent Supabase RPC business snapshot and `dataRevision` compare-and-set commit alongside the public planning version. Account state, unique source movements, bill commitments, the success record and audit event commit together. A newer overlapping refresh or concurrent write rejects publication. Failed refreshes preserve the preceding dataset and retain a failed run. Reconciled movement amounts, dates, direction and settlement state cannot change without correcting existing evidence. The replacement integration tests verify these guarantees through the restricted service-role RPC and constrained executor.

The public banking API supplies account/freshness data, paginated movements, refresh, a run lookup, and the latest sync status. Every operation uses verified identity and business-scoped database access. Replay uses a named synthetic snapshot, keeps its actual cutoff and timestamps, and cannot be relabeled as current by changing the request date.

For configured live mode, the requested cutoff is today's calendar date in the business timezone, even when the stored business source was previously replay. The prepared request, sync run, and published snapshot use that same date. Live provider reads must start and finish on that business day; crossing midnight rejects the update. Every source is also checked before publication for completed movements after its cutoff. Such a record prevents the entire update, preserving the previous balance and version; future pending and cancelled records remain distinct from completed cash.

## Historical executed checks

| Check                          | Result                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK baseline                   | The [SDK report](sdk-baseline.md) records 84 passing SDK tests and isolated Node 24 package consumption.                                                                                                                                                                                                          |
| Provider unit tests            | 20 passed, including requested live cutoff mismatch and business-midnight crossing, normalization, units gate, scope, balance changes, settlement states, missing fields, duplicates, bounds, empty history, safe failures, timeout, cancellation, and replay.                                                    |
| PostgreSQL integration         | Twelve banking tests passed, including live cutoff progression after a prior replay source, unchanged replay dates, future completed record rejection for both sources, and retention of future pending/cancelled records. Existing transaction, reconciliation, isolation, overlap, and bill checks also passed. |
| Combined isolated database run | 55 tests passed across seven files after applying all four migrations to a fresh PostgreSQL 17 test database. Vitest duration was 6.16 seconds in this run; this is test duration, not an API latency claim.                                                                                                      |
| Type checking                  | Workspace `tsc --noEmit` passed at the checked state.                                                                                                                                                                                                                                                             |
| Lint and formatting            | Targeted Biome lint passed for 12 banking/fixture/test files with warnings treated as errors; Prettier formatted the intended files.                                                                                                                                                                              |

## Remaining gates

The authenticated provider contract, balance/cutoff semantics, and numerical units have not been verified. Live construction remains gated. The provider's multi-endpoint reads cannot prove upstream atomicity; absent or conflicting records are rejected conservatively for review. An incomplete failure record after loss of database access or revoked membership still requires operational inspection; the code does not bypass authorization to repair it.

HTTP consumer coverage, contract regeneration, deployment, container smoke tests, and measured latency belong to the integrated P8/P9 evidence. Passing these module checks does not establish that a deployed backend or native mobile integration is complete.

## Operational date handling

Retry a live update rejected at midnight after the business has entered the new day. The next request prepares a new cutoff; it does not relabel an older fetched snapshot. A completed movement dated after the cutoff requires provider-data review before retrying. Replay retains its historical cutoff and source timestamps on every day, and is reported stale when appropriate. Changing the clock or repeatedly refreshing replay is not a way to claim fresh observed cash.
