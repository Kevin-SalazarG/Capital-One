# Mobile handoff

The backend exposes a versioned `/v1` REST contract. This document records its consumer contract and the transport refinements made for the mobile start on 2026-09-12. Mobile implementation and native evidence are tracked separately in [Mobile-Plan.md](../Mobile-Plan.md). Use [the generated OpenAPI document](../../apps/api/openapi.json) and [the generated client](../../packages/api-client/src/client.ts); do not import backend models or financial calculations into mobile.

## Connection and session lifecycle

The deployment base URL is pending user configuration. Locally the API listens at `http://localhost:3000`; a device must use the approved reachable HTTPS address, not its own loopback interface. Native networking, secure token storage, and bundling have not been verified by a Node HTTP consumer.

```typescript
import { MirrorClient, MirrorApiError } from "@mirror/api-client";

let accessToken: string | undefined;
const client = new MirrorClient({
  baseUrl: "http://localhost:3000",
  accessToken: () => accessToken,
});

// Obtain these credentials from the synthetic demo operator, not source code.
const session = await client.login({ email, password });
accessToken = session.accessToken;
const business = await client.getBusiness(businessId);
const dashboard = await client.getDashboard(business.id);
```

The base URL excludes `/v1`, because generated operation paths already contain it. Keep access tokens in memory and refresh credentials in platform secure storage. Both `session.expiresAt` and `session.identity.expiresAt` are Unix epoch **seconds**; compare with `Date.now()` only after converting seconds to milliseconds. They originate from the provider's `expires_at` and verified JWT `exp`, respectively. Do not assume a token is usable until that expiry: protected operations also check revocation and membership.

Serialize refresh requests per session and replace the stored refresh credential only after validating the response. The server uses a separate provider context for every request and returns the provider's latest refresh token. It does not offer a refresh-operation key, rotation-recovery endpoint, or a guaranteed reuse window. If a dispatched refresh loses its response, times out, is cancelled, or returns an unusable response, the credential may already have rotated. Do not automatically replay the old credential. Show session unavailability and require a fresh sign-in to reestablish access. A transport failure or `AUTH_UNAVAILABLE` is not proof of revocation. A confirmed `401 UNAUTHORIZED` means the credential is unusable for this operation.

Logout verifies the current session, records a local Mirror revocation, then attempts provider-local sign-out. A successful response confirms both steps. `503 AUTH_LOGOUT_INCOMPLETE` means Mirror blocked the session but provider sign-out was not confirmed. A lost response cannot establish either outcome. Clear local credentials, sensitive caches, drafts, and in-flight session results even when logout fails; report local sign-out without claiming provider revocation. The client captures the access token synchronously when dispatch begins, so the caller can clear memory immediately after calling `logout`.

These are inspected backend semantics from [the Auth provider](../../apps/api/src/modules/auth/supabase-auth-provider.ts) and synthetic tests, not verified behavior of a configured live provider account.

## Request cancellation and transport errors

Every generated operation accepts a trailing optional `MirrorRequestOptions`. Existing path, body, and query positions remain unchanged. Query operations use an empty query object when only request options are needed:

```typescript
const cancellation = new AbortController();
const dashboard = await client.getDashboard(businessId, {
  signal: cancellation.signal,
  timeoutMs: 15_000,
});
const movements = await client.listBankMovements(
  businessId,
  { offset: "0", limit: "50" },
  { signal: cancellation.signal, timeoutMs: 15_000 },
);
```

`timeoutMs` bounds the complete fetch and response-body read. It must be an integer from 1 through 2,147,483,647 milliseconds. `MirrorClientOptions.timeoutMs` supplies an optional default; the operation value overrides it. Omission at both levels preserves the previous behavior with no client deadline. The mobile transport must choose explicit limits for its environment. The underlying server has separate limits: Auth requests allow 8 seconds each inside a 10-second Auth operation, banking provider reads have a 15-second deadline, and database transactions allow 8 seconds. Client timeout choices do not extend those limits or prove server cancellation.

The transport combines the caller signal with its deadline, rejects pre-aborted calls before dispatch, and releases timers/listeners after completion. Its caller promise settles on cancellation even if an injected transport ignores abort. Cancellation after dispatch does not prove rollback; a financial write may already have committed. There are no transport retries or hidden token refreshes.

`MirrorTransportError` exposes a fixed safe message, `code`, and optional HTTP `status`, `requestId`, and `retryAfterMs` where available. It does not retain raw bodies, validation issues, native exception text, request URLs, or caller abort reasons:

| Code                      | Meaning                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `NETWORK_ERROR`           | Fetch failed or the response body could not be read. This does not prove the device is offline. |
| `RESPONSE_NOT_JSON`       | The response body was not valid JSON, including proxy HTML errors.                              |
| `RESPONSE_SCHEMA_INVALID` | Success or error JSON did not match the public response contract.                               |
| `REQUEST_SCHEMA_INVALID`  | A generated request-body schema rejected input before dispatch.                                 |
| `REQUEST_OPTIONS_INVALID` | The base URL could not be parsed or the timeout was outside its supported range.                |
| `REQUEST_ABORTED`         | Caller cancellation; the server outcome can remain uncertain after dispatch.                    |
| `REQUEST_TIMEOUT`         | The total deadline elapsed; the server outcome can remain uncertain after dispatch.             |

`MirrorApiError` retains the existing `status`, `code`, `requestId`, and safe backend `message`, and adds optional `retryAfterMs`. Valid `Retry-After` delta-seconds and IMF-fixdate values are normalized to milliseconds at response receipt; past dates become zero and malformed/overflowing values are omitted. HTTP-date normalization depends on the device clock. The backend currently sends `Retry-After: 60` for rate limits.

The consumer owns read retries. Allow at most one additional attempt for a GET after `NETWORK_ERROR`, or structured HTTP 429, 502, 503, or 504; honor `retryAfterMs`. A retry waits for an active, connected, current session, and cancellation stops it. If the delay exceeds the consumer's acceptable wait, show a manual retry state instead of shortening the server delay. Do not retry aborts, schema/input errors, authorization failures, 409 conflicts, or writes automatically. The mobile session controller owns login/refresh/logout separately from the read-query policy.

## Journey and concurrency

Use `refreshBanking`, `listBankMovements`, `listCommitments`, `listBudgets`, and `getDashboard` to display data. The dashboard already combines liquidity, reserve, overhead, decisions, and one coherent planning version. Mobile renders supplied decimal strings and daily rows; it does not recompute the forecast.

Submit a job through `evaluateJob`. The response includes the original outcome, permitted alternatives, assumptions, pending conditions, source freshness, and an immutable evaluation identifier. A valid request can return an infeasible financial result with HTTP 200. Invalid fields produce an HTTP error.

Register an allowed alternative using `confirmDecision` with the evaluation ID, selected alternative ID, expected planning version, and a newly generated `idempotencyKey` in the JSON body. Keys contain 8–120 ASCII letters, digits, underscores, or hyphens. Securely persist the exact minimal intent and its identity/business/API-environment scope before sending; failure to persist blocks dispatch. If the response is lost, recovery requires a fresh authorized session in that same scope and an explicit same-key/same-content retry. Do not generate a new key or change its payload to disguise a conflict. Version conflicts require retrieving current state and recalculating before a new registration attempt.

The database uniqueness scope is `(businessId, userId, key)`. The request hash covers `evaluationId`, `alternativeId`, and `expectedVersion`. Successful confirmation stores its idempotency record and decision atomically. Matching replay returns the original registration response, including its original `planningVersion`, before testing whether the evaluation is now stale. Reusing the key with different content produces `409 IDEMPOTENCY_CONFLICT`; different keys cannot register the same business/job twice. A renewed session for the same authorized identity may recover the same operation.

The [idempotency model](../../apps/api/src/platform/database/business-state.ts) records creation time but defines no expiration or pruning. Therefore the current implementation retains protection for the lifetime of the persisted record; it does not promise survival of a database reset, restore, or environment replacement. There is **no lookup-by-idempotency-key endpoint**. `getDecision` requires an already known decision ID, and a paginated list is not proof that an uncertain operation never occurred. Never automatically replay a stored intent at launch/reconnect or across identities/environments.

`reconcilePayment` applies observed money once to a commitment. A partial receipt reduces the outstanding amount without confirming all business conditions. `correctReconciliation` preserves the previous matching evidence in history. `updateDecisionCondition`, `reevaluateDecision`, and `getDecisionHistory` expose the subsequent lifecycle.

### Uncertain outcomes for every write

All POST/PATCH operations below require an explicit user action. A timeout, network failure, cancellation after dispatch, or unusable response means the result is unknown, not rolled back. No write is automatically queued or retried on reconnect.

| Operations                                                                                                         | Recovery before another explicit action                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login`, `refreshSession`, `logout`                                                                                | Follow the session rules above; never reuse an uncertain rotated credential automatically.                                                                                                                                                                                                                                                                |
| `confirmDecision`                                                                                                  | Recover the persisted exact intent and explicitly retry with its original key, content, and authorized scope.                                                                                                                                                                                                                                             |
| `updateSettings`, `createCommitment`, `updateCommitment`, `adjustOverhead`, `setBudget`, `updateDecisionCondition` | Fetch the affected business, commitments, budgets, or decision and review current state/version. There is no general operation key or original-response replay.                                                                                                                                                                                           |
| `createRecurringCommitments`                                                                                       | Inspect current commitments/series and business version. Occurrence identities prevent some duplicates, but the operation advances planning version before returning existing occurrences; this is not confirmation-style replay.                                                                                                                         |
| `reconcilePayment`                                                                                                 | Review movements, pending commitments, and decision state. The backend returns an existing active match for the same business/movement/commitment and equal amount; a different amount conflicts. This semantic duplicate guard returns the current planning version and is not a general idempotency key or guarantee that changed evidence was applied. |
| `correctReconciliation`                                                                                            | Review current commitments and the decision history before correcting again. A completed correction makes the previous active match unavailable; it has no replay key.                                                                                                                                                                                    |
| `refreshBanking`                                                                                                   | Read the account, business version, and `getLatestBankSyncRun` (or `getBankSyncRun` if its ID is known). Latest status can belong to another caller, so it does not identify the uncertain request. Review before another refresh.                                                                                                                        |
| `evaluateJob`                                                                                                      | Inspect `listEvaluations`/known `getEvaluation` and the current input. A new explicit evaluation stores another snapshot, although it does not register commitments or change observed cash. There is no request-key lookup.                                                                                                                              |
| `reevaluateDecision`                                                                                               | Read `getDecision` and `getDecisionHistory`. Repeating can append another review event even against the same planning version; it has no replay key.                                                                                                                                                                                                      |

## States and errors

Keep financial result, pending conditions, and freshness visible independently. `protected` does not guarantee receipt, provider delivery, or solvency beyond the evaluated horizon. Show `insufficient_information`, `no_feasible_alternative`, `horizon_limited`, `review_needed`, stale source warnings, and replay provenance explicitly. The replay fixture retains its 2026-09-12 cutoff.

Common structured API error families are unauthorized/forbidden, invalid input, payload too large, missing object, stale evaluation, planning-version conflict, idempotency conflict, unavailable provider, and rate limit. Report a request ID for support; never log tokens or request bodies. Map fixed transport error codes and stable API codes to Spanish UI messages; do not display raw native exceptions or schema validation issues.

## Configuration and evidence

Variable names and setup steps are in [the environment template](../../apps/api/.env.example) and [operations](operations.md). All credential values remain server-side. The HTTP consumer tests in [public-client.e2e.test.ts](../../apps/api/test/e2e/public-client.e2e.test.ts) use the public client against a running NestJS server and real PostgreSQL, with explicitly synthetic Auth/banking providers.

[public-client-transport.e2e.test.ts](../../apps/api/test/e2e/public-client-transport.e2e.test.ts) adds synthetic fetch coverage for argument/header preservation, unchanged confirmation content, safe input/network/non-JSON/schema errors, rate-limit metadata, cancellation, deadlines covering body reads, and timer/listener cleanup. These tests run in Node and do not establish native fetch or storage compatibility. Generated transport code is maintained in [generate-contracts.ts](../../apps/api/scripts/generate-contracts.ts); regenerate instead of editing the client artifact.

The HTTP consumer also drops a confirmation response after the real local API has finished, verifies that one decision exists, and explicitly replays the same intent through the public client. The replay returns the existing decision without advancing the business version again. This demonstrates recovery against isolated PostgreSQL and synthetic providers; it is not a live-provider test.

The transport candidate was verified with Node 24.15.0 and pnpm 11.1.3:

- `pnpm generate:contracts` and `pnpm check:contracts`: generated artifacts match.
- `pnpm --filter @mirror/api typecheck`, `pnpm --filter @mirror/api build`, and `pnpm --filter @mirror/api-client build`: passed.
- `pnpm --filter @mirror/api test`: 59 unit tests passed.
- `pnpm test:integration`: 87 tests across 10 files passed, including 26 controlled transport cases and the lost-confirmation HTTP journey.
- Focused Prettier and Biome checks passed for the generator, client, transport tests, and this handoff. Encoding validation passed. Final workspace/mobile policy results belong to the mobile foundation evidence; concurrent mobile work is not certified by these backend checks.

There is no root Git revision. SHA-256 artifact identifiers for this contract candidate are:

| Artifact                                 | SHA-256                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `apps/api/openapi.json`                  | `d96c2ddf97f742c986f3db2c503bbcdd4a25482eb2142e995682be732bf402ee` |
| `apps/api/scripts/generate-contracts.ts` | `588b8eb2dcc58965f8076794b2b8837190799ac69e95fcfceaceeac6c6354412` |
| `packages/api-client/src/client.ts`      | `0b718b75c6b2926e435f1f7dc60aa7a96c844b732284e68460a9262591299100` |

After applying the Supabase migrations, the server requires `SUPABASE_URL`, `SUPABASE_ANON_KEY` for Auth, and `SUPABASE_SERVICE_ROLE_KEY` for database RPCs. These variables belong to the backend. Mobile continues to call Mirror's API. Demo setup and optional live Nessie configuration are separate operational steps.

The authoritative implementation checklist is [Backend-Plan.md](../Backend-Plan.md). Live Supabase/Nessie behavior, controlled sandbox updates, hosting budget/region, reachable HTTPS, and device behavior are pending separate configuration and verification. Local fixture tests must not be presented as those external validations.
