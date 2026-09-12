# Public HTTP consumer verification

The scenarios below passed through the Supabase RPC persistence boundary in the 2026-09-12 backend gate: 89 integration tests across ten files. This is the P8 evidence for [Backend-Plan.md](../Backend-Plan.md). Response examples and timing samples were regenerated against the current implementation.

The headless consumer imports `MirrorClient` from the public `@mirror/api-client` package and communicates with a listening NestJS application over HTTP. The server fixture uses the same application configuration, validation, serialization, authentication guard, and error handling as normal startup. The replacement fixture routes the installed Supabase SDK through a local HTTP RPC bridge into actual SQL functions in isolated PostgreSQL. Service-role grants, the constrained `mirror_executor`, membership and forced RLS are exercised without claiming a hosted Supabase deployment.

Authentication is an explicitly synthetic `TestAuthProvider`; banking is an explicitly synthetic mutable replay provider. Only `Date` is fixed to the scenario's 2026-09-12 calendar. Network timers remain real. These tests do not verify Supabase Auth claims, authenticated Nessie behavior, deployment, or native-device networking.

## Regression scenarios

- Login, refresh, authenticated business listing, banking refresh, and logout/revocation.
- Basic category budget, flexible expense creation/adjustment/cancellation, and the resulting forecast changes.
- The reference reserve of 40,000 and immediate expense capacity of 10,000 from an opening balance of 50,000 and payroll of 30,000.
- A new job's minimum balance of -20,000 and protection gap of 30,000; required advance of 30,000; the permitted supplier split; both alternatives preserving the 10,000 cushion.
- Consistent business, liquidity, and overhead planning versions in the dashboard composer.
- Conditional decision registration, persisted same-content retry, and conflicting reuse of an idempotency key.
- A 15,000 partial synthetic receipt included in the updated 65,000 cutoff balance, explicit reconciliation, a duplicate match applied once, and a remaining advance of 15,000.
- Refusal to confirm receipt of the entire advance from partial evidence.
- A second job using registered commitments; a later payroll-date change making its evaluation stale; rejection of stale confirmation; preserved decision history and reevaluation.
- Two concurrent confirmations against one planning version producing one successful decision.
- Concurrent identities/refreshes, access denial across businesses, evaluation-object isolation, and session revocation without affecting another identity.
- Incomplete data, an infeasible advance limit, failed provider refresh with the prior balance preserved, and stale-source reporting.
- Invalid money representation, missing authentication, malformed JSON, and a payload over the 256 KB limit.

Expected financial values are assertions against the documented synthetic case. The consumer does not import financial engine functions or calculate financial outcomes.

## Executed checks

`pnpm test:integration` passed 89 tests across ten files, including six public-client HTTP cases and ten Auth contract cases. A separate `WRITE_EVIDENCE=true` run regenerated the response examples and latency report. Twelve sequential samples per operation produced zero errors: p95 dashboard 51.58 ms, replay refresh 256.07 ms, evaluation 399.14 ms and evaluation/confirmation 411.11 ms. All four declared budgets passed. These are local synthetic measurements, not hosted throughput claims; see [the quality report](quality-gate.md).

Workspace `tsc --noEmit` passed. Targeted Prettier and Biome checks passed for the HTTP tests, server/auth fixtures, and banking freshness service changes. The checked tests are [public-client.e2e.test.ts](../../apps/api/test/e2e/public-client.e2e.test.ts).

The workflow exposed and led to fixes for an array-response serialization mismatch and oversized request bodies incorrectly returning HTTP 500. The final checks exercise the corrected behavior rather than weakening the assertions.

## Authentication provider contract verification

[auth-provider.integration.test.ts](../../apps/api/test/integration/auth-provider.integration.test.ts) exercises the production `SupabaseAuthProvider` and installed Supabase JavaScript SDK against a local HTTP Auth fixture. It generates ephemeral P-256 keys, signs ES256 JWTs and serves public JWKS. Synthetic session records exist only in the isolated runner. Auth uses `SUPABASE_ANON_KEY` explicitly; provider-session checks and durable logout revocation use bounded server-only RPCs. Managed provider session tables are not exposed to the mobile client or owned by Mirror migrations.

The ten cases verify valid signatures and session lookup; rejection of wrong issuer, audience, expired tokens, and tampered signatures; removal of a still-valid JWT's provider session; logout revocation persisting across provider instances; simultaneous actual SDK login and refresh for separate users; safe handling of provider user failures; invalid credentials versus login/refresh server failures; disconnected transport; provider logout failure with local revocation retained; and actual cancellation of a stalled refresh. The tampering assertion verifies that a rejected signature does not reach the provider user endpoint.

Each public Auth operation shares a 10-second upstream deadline and each individual fetch has an 8-second cap, including reading its response body. The installed SDK's refresh backoff cannot accept an abort signal. A private transport response therefore normalizes network failures, server errors, and cancellation into an error the SDK does not retry; Mirror exposes only its safe `AUTH_UNAVAILABLE` HTTP 503 response. Invalid credentials or sessions still return HTTP 401. Tests use a 75-millisecond injected deadline, observe the stalled connection closing, and assert a single request for both timeout and HTTP 500 refresh failures. All SDK work is awaited; the implementation does not race an uncancelled SDK promise against a timer.

RPC requests have their own eight-second deadline, and SQL statement/lock limits are configured by the migrations. The Auth deadline does not establish an end-to-end protected request deadline. These fixtures validate local protocol and cryptographic/session behavior; they do not verify configuration, signing keys, permissions or availability in the selected hosted project.
