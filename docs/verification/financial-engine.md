# Financial engine verification

Measured on 2026-09-12 at 10:40:49 UTC with Node.js 24.15.0, macOS Darwin 25.6.0, arm64, Apple M2. These are local synthetic measurements, not hosting or live-provider latency claims.

## Method and results

Run `pnpm --filter @mirror/api exec tsx scripts/measure-financial-engine.ts` from the workspace root. Each case runs five warmups and then records synchronous wall-clock duration with `performance.now()`. The p95 is the nearest-rank percentile. The measurements include validation, projections, structured explanations, candidate derivation, and result validation; they exclude HTTP, PostgreSQL, authentication, and provider calls.

| Workload                                                                                                                              | Samples | Forecast p50 / p95 / max (ms) | Job evaluation p50 / p95 / max (ms) |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------- | ----------------------------------- |
| 40 existing events, 10 job costs, 10 advance dates and 10 supplier schedules; up to 53 derived events                                 | 50      | 0.761 / 0.997 / 1.259         | 35.334 / 38.406 / 40.561            |
| 397 existing events, 100 job costs, 32 advance dates and 32 supplier schedules; exactly 500 events for fee-bearing supplier schedules | 20      | 3.419 / 3.629 / 4.035         | 511.549 / 555.630 / 583.657         |

The maximum workload uses the maximum admitted opening cash, total collection, and advance cap of `999999999999.99`. Of its 32 permitted advance dates, 29 are future dates preceding the final collection and three deliberately fall on or before the cutoff; the engine rejects those three. Collection delay is one day. A final collection delayed beyond the horizon is labeled explicitly, including in this workload. The benchmark evaluates both scenarios and every supplied schedule.

The observed normal p95 is below the provisional 750 ms evaluation budget, and the observed bounded maximum is below the provisional 2 s budget. These results support the current finite input bounds on this machine. They do not prove latency under concurrent HTTP traffic, database contention, deployment CPU quotas, or a different runtime. Production transaction and request durations require separate measurements.

## Financial evidence

The domain suite contains 32 passing tests, rerun successfully after the persistence services were adapted to Supabase. It verifies the `Idea.md` reference outputs: opening reserve `40000.00`, immediate capacity `10000.00`, unchanged-job minimum `-20000.00`, protection gap `30000.00`, minimum advance `30000.00`, insufficient `20000.00` advance, and the `10000.00`/`30000.00` supplier schedule. Independent changed-cost cases prove that the minimum is recalculated and that one cent less fails the cushion constraint.

Coverage also includes opening deficits, same-day debit-before-credit ordering, partial-horizon effects, collection delays, protected payroll and tax categories, known fees, delivery constraints, cancellation/settlement exclusion, overdue receivables and payables, selected spending dates, maximum amounts/event count, deterministic reruns, input reordering, runtime validation, and preservation of the input objects.

Money arithmetic uses a private decimal.js constructor at precision 40. Required amounts round upwards to cents. A customer advance shifts a fixed portion of the final collection; it does not increase job income. The search computes the maximum cushion deficit in each advance's effective interval across both scenarios, then verifies the exact cent-denominated candidate through the same forecast engine. It does not iterate over monetary units or use a floating-point monetary calculation. Supplier search is limited to the finite schedules supplied by the caller.

## Persistence evidence

The planning and decision services now read typed business snapshots and submit mutations through the shared Supabase transaction boundary. The financial engine and HTTP contracts are unchanged. On 2026-09-12, `MIRROR_TEST_FILE=test/integration/decisions.integration.test.ts pnpm test:integration` passed all 11 decision tests in 4.58 seconds against the real replacement SQL functions through the SDK/RPC bridge. This supersedes the earlier adapter's decision evidence; the complete workspace and hosted gates remain separate.

Serialization measurement exposed a valid bounded workload whose evaluation result occupies 10,327,653 UTF-8 bytes before persistence, exceeding the initial internal RPC limit. The reference job result occupies 50,929 bytes. These measurements use ordinary synthetic labels; admitted longer text can increase the result further. The passing large-result regression persists 397 commitments and evaluates 100 costs, 32 advance dates and 32 supplier schedules, asserts a result above eight MiB, and verifies exact persisted rereading and history listing through RPC without advancing the financial planning version.

The replacement admits a maximum 32 MiB complete business state or change set and 10,000 rows per collection. Dataset admission is separate from the financial input bounds. SQL rejects writes whose resulting state exceeds those limits with `DATASET_LIMIT` (HTTP 422), preserving the prior readable state without dropping records. Thus a financially valid input can still be too large for the explicitly bounded MVP dataset; the API must report that condition honestly. The internal RPC envelope limit is 33 MiB and does not expand the 256 KiB public request limit.

The decision regression suite covers coherent immutable snapshots, competing confirmations, concurrent same-key retries, retry after client restart, stale evaluations, infeasible registration rollback, second-job capacity, reviews without duplicating the registered job, receipt evidence and later correction, supplier agreement/delivery conditions, source failure without a version change, and cross-business access. A second evaluation must not register the same logical job again: both the service and PostgreSQL's business/job unique key must reject it without advancing the planning version or adding commitments.

Five additional commitment/budget regressions verify exact monthly occurrence counts, leap-year month-end clamping, paid and cancelled occurrence identity on replay, partial/full reconciliation without category-spending duplication, correction restoring the outstanding amount, rejection of overmatching and protected-expense adjustment, rejection of future-dated completed bills, and preservation of settled bill history when a recurring series is cancelled. The HTTP consumer also rejects negotiable payroll and tax inputs with status 400.

Protected demo-setup regressions execute the actual seed script in child processes against the isolated RPC fixture. They verify the exact replay fixture, a configured live account starting with zero observed cash and unavailable/incomplete source data, refusal to overwrite an existing business, and rejection of missing synthetic-data confirmation or invalid live identifiers before creating records. Neither branch provisions authentication or calls a banking provider. Live setup uses the current calendar date in `America/Monterrey`; its sample obligations retain their offsets from that cutoff. The four passing replacement seed tests also verify credential-safe subprocess output.

The fresh backend aggregate passed all 89 integration tests across ten files in 17.24 seconds, alongside 59 API unit tests, builds, type checks, lint and contract drift checks. The [quality report](quality-gate.md) records the separate whole-workspace formatting limitation and remaining container/hosted evidence.

## Limits and pending external evidence

All source data here is synthetic or labeled replay. Future receipts do not release unconditional spending capacity. A pending supplier agreement retains its original conservative due date until the agreement and required delivery are both confirmed. No simulation calls Nessie or performs payments.

Paid budget totals aggregate observed completed bank movements. Imported bill records are not added as separate expenses because a bill and a withdrawal might describe the same payment. Consequently, a completed bill without a corresponding observed withdrawal clears its pending obligation but contributes no paid movement to the budget. Complete live expense coverage for that case is not verified: authenticated provider balance, bill, and withdrawal semantics remain required under P0.4/P9.7. The application must not claim a fully verified live banking integration from these fixtures.

Authenticated Nessie compatibility, Supabase deployment configuration, HTTPS hosting, and native mobile behavior remain separate validation gates. The user deferred configuring external services. A 30-day projection cannot establish whole-contract viability; moving a payment beyond the horizon never yields a fully feasible alternative.
