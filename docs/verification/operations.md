# Backend operations and Supabase setup

This runbook covers the synthetic Mirror MVP. The user selected Supabase project `zypzevcgnkshrgirxirb` and requested direct access through the Supabase JavaScript SDK. Applying SQL, preparing a synthetic identity, authenticated Nessie verification and deployment require their corresponding authorized setup. Replacement persistence passed the backend gate; current container/recovery and hosted checks remain separate in [the quality report](quality-gate.md).

## Runtime configuration

Copy [the environment template](../../apps/api/.env.example) to a protected local `apps/api/.env`. The running API requires three values:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The anon key is used explicitly for Supabase Auth. The service-role key is used only by the backend for SQL RPC calls and must never enter a mobile bundle, log, generated client or Docker layer. The API does not open a production PostgreSQL connection or require database passwords. Auth clients do not persist or automatically refresh a shared global session.

| Variable                                                    | Responsibility                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `SUPABASE_URL`                                              | Project endpoint for Auth and Data API RPC calls.                   |
| `SUPABASE_ANON_KEY`                                         | Auth login, refresh, logout and token verification.                 |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | Server-only access to restricted Mirror RPC functions.              |
| `NODE_ENV`, `PORT`, `TRUST_PROXY_HOPS`                      | Runtime mode, listening port and verified proxy distance.           |
| `BANKING_MODE`                                              | Labeled `replay` fixtures or verified `nessie_live` behavior.       |
| `NESSIE_API_KEY`, `NESSIE_CUSTOMER_ID`, `NESSIE_ACCOUNT_ID` | Authorized fictional banking connection for live mode.              |
| `NESSIE_UNITS_VERIFIED`                                     | Explicit confirmation of the selected provider's amount units.      |
| `DEMO_USER_ID`, `DEMO_BUSINESS_ID`, `DEMO_SETUP_CONFIRMED`  | Protected synthetic setup target and `synthetic-only` confirmation. |

The runtime image does not require seed identifiers or administrative CLI credentials. Optional live-provider configuration remains separate from the three Supabase values.

## Prepare the approved project

Project `zypzevcgnkshrgirxirb` already has migrations `20260912132954_mirror_schema` and `20260912133001_mirror_rpc`. Remote SQL health, forced RLS on all 14 tables and anonymous RPC denial were verified. All three runtime variables are configured, and the service-role key successfully invokes health through the hosted Data API. Provision the demo Auth identity before the authenticated application journey. The Supabase runtime values do not require a separate database connection URL.

1. Review [the SQL migrations](../../apps/api/supabase/migrations), the sole versioned source for Mirror's private schema and RPC functions. Mirror does not own managed Supabase Auth tables.
2. Apply them in order using authorized Supabase administrative tooling. If the CLI is authenticated and linked to the intended project, `pnpm --filter @mirror/api db:migrate` invokes `supabase db push --linked`. Confirm its target before an authorized shared-environment run. An API key does not apply schema migrations.
3. Keep the Data API enabled for `public` RPC functions and keep `mirror` outside exposed schemas. The migrations revoke RPC execution from `PUBLIC`, `anon` and `authenticated`, grant it to `service_role`, and restrict business-table execution to non-login `mirror_executor`. Review actual project grants and RLS.
4. Provision the fictional Supabase Auth identity through protected provider tooling and record its UUID locally. Mirror supplies no public signup or independent password database.
5. Configure runtime values and the synthetic seed target, then run `pnpm --filter @mirror/api demo:seed` when authorized. Verify login, membership and a coherent snapshot through the API.

The seed refuses to overwrite an existing business. Replay creates the labeled reference business, account, payroll and budget. Live mode requires configured fictional customer/account IDs and starts with zero observed balance, unavailable source, no sync timestamp and incomplete data. Its synthetic obligations use offsets from today's `America/Monterrey` calendar. Successful authenticated refresh and explicit completeness review are required before decisions. Neither seed branch calls or writes Nessie.

## Persistence and authorization

`DatabaseService` uses the official Supabase SDK and validates RPC results with authored Valibot schemas. `mirror_state` returns one coherent authorized snapshot. Services calculate against it and prepare explicit changes; `mirror_apply_state` checks membership and the captured `dataRevision`, then commits the whole change set in one PostgreSQL transaction. A revision conflict rejects the entire write. Public `planningVersion` separately records financial changes that invalidate evaluations.

The MVP business dataset and a single change set are each limited to 32 MiB, with at most 10,000 rows in each collection. SQL checks the resulting complete dataset before committing. An oversized operation returns `DATASET_LIMIT` with HTTP 422, preserving the previous readable state and immutable history. The internal RPC envelope allows 33 MiB; public API request bodies remain limited to 256 KiB. Long descriptions or many saved evaluations can reach the byte limit before the row limit. Do not retry an oversized request unchanged or delete history to hide exhaustion; review dataset capacity before admitting further records. No automatic truncation or pruning is part of the MVP.

The service key identifies the backend; it does not replace user membership. Business RPCs install transaction-local verified user/business context and execute under `mirror_executor`, which cannot log in or bypass forced RLS. Private relational tables retain foreign keys, unique identities, exact amounts, immutable histories and reconciliation guards. Session-status RPCs return a bounded decision rather than provider session records. Absent identity or membership fails closed.

RPC fetches have an eight-second deadline. SQL operations have independent bounded statement/lock limits from the migrations. Auth and Nessie calls occur outside financial SQL transactions. These limits do not establish an end-to-end HTTP latency guarantee.

## Local and container verification

Use Node.js 24.15.0, pnpm 11.1.3 and PostgreSQL 17 binaries. The existing banking SDK retains its independent source and Git history.

```sh
pnpm install --frozen-lockfile
pnpm check
docker build --file apps/api/Dockerfile --tag mirror-api:local .
TEST_CONTAINER_IMAGE=mirror-api:local node --import tsx scripts/smoke-container.ts
```

The integration runner creates temporary loopback-only PostgreSQL and applies the checked-in SQL. A local HTTP bridge accepts SDK RPC requests and invokes the real SQL functions as `service_role`. Tests exercise executor permissions, RLS, membership, revision conflicts, idempotency and histories. Administrative SQL is limited to isolated fixtures and invariant probes. The bridge is not a hosted Supabase deployment or a production server.

Set `PG_BIN` to the directory containing `initdb`, `pg_ctl` and `postgres` when the default does not apply. Normal CI needs no real provider credentials. Encoding, source policy, Prettier, Biome and TypeScript cover authored schemas, services, tests and the generated public client.

Build from the workspace root so the [Dockerfile](../../apps/api/Dockerfile) includes the public workspace SDK. The replacement image and RPC smoke must pass before use. Verify readiness, liveness, unauthenticated `401`, non-root execution, read-only filesystem, removed Linux capabilities, bounded shutdown, public SDK loading, redacted logs, and absence of source/development tools/secrets. Recovery must preserve exact money and immutable history.

The current `mirror-api:local` image (`efd3b209acda`) passed that smoke using actual PostgreSQL/PostgREST, exact-money dump/restore, a five-second database cancellation probe, CAS and business-scope rejection. The local routing fixture uses HTTP with `NODE_ENV=test`; production HTTPS validation is tested separately and remains enforced.

The dedicated Colima `mirror` profile can be started with `colima start mirror --activate=false` and stopped with `colima stop mirror`. Select its socket explicitly; preserve the user's default Docker context and unrelated profiles, images and volumes.

## Failures, recovery and delivery

`/v1/health/live` checks the process; `/v1/health/ready` checks the database RPC. Hosting must supply HTTPS and the configured proxy distance. Authentication fails closed when provider verification or required session lookup is unavailable. Safe logs contain request identifiers, status and duration, never complete financial requests or credential-bearing URLs.

A failed banking refresh preserves the previous complete state and exposes failure/source age. Replay stays labeled. After stale evaluation, fetch current data and reevaluate. After an uncertain confirmation response, retry the identical intent with the original idempotency key. Reconciliation correction retains previous evidence and restores outstanding planning amounts without rewriting observed history.

Before an authorized shared-environment SQL change, take a provider-supported backup and rehearse recovery separately. Restore the complete schema, records and applicable migration history; verify memberships, exact money, immutable evaluations, idempotency and RPC/RLS grants before traffic. Never disable history guards or overwrite the active demo to force partial imports. Hosted recovery remains a separate gate.

[The CI workflow](../../.github/workflows/backend.yml) is a local artifact, not evidence of a remote run or deployment. [The Git checker](../../scripts/check-git-policy.ts) reads metadata without changing repository state. This runbook creates no root repository, branch, commit, PR or hosted deployment. Existing mobile work and its API contracts remain separate from the persistence replacement.

Primary references: [Supabase RPC](https://supabase.com/docs/reference/javascript/rpc), [database functions](https://supabase.com/docs/guides/database/functions), [Data API security](https://supabase.com/docs/guides/api/securing-your-api), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Docker build practices](https://docs.docker.com/build/building/best-practices/) and [pnpm deployment](https://pnpm.io/cli/deploy).
