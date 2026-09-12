# Backend verification

Verified on 2026-09-12 using Node.js 24.15.0, pnpm 11.1.3 and PostgreSQL 17. The backend uses the Supabase JavaScript SDK: `SUPABASE_ANON_KEY` for Auth and the server-only `SUPABASE_SERVICE_ROLE_KEY` for database RPCs. The public API contracts remain unchanged.

## Local checks

The complete workspace `pnpm check` passed. It also ran 73 mobile tests and exported iOS/Android bundles; this verifies build compatibility, not native-device acceptance. Source-policy and Biome checks covered 140 first-party files. An earlier concurrent mobile formatting issue was resolved by its owning work before this final run.

| Check                       | Evidence                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API integration             | 89 tests passed across ten files: real PostgreSQL, installed SDK/RPC transport, signed Auth fixtures, banking, planning, decisions and public HTTP consumers.                                                |
| API unit tests              | 59 passed, including 32 deterministic financial cases.                                                                                                                                                       |
| Independent SDK             | 84 tests and isolated installed-package checks passed; SDK source and Git history are unchanged.                                                                                                             |
| Types, builds and contracts | API/client builds and type checks, scripts type checking and generated-contract drift checks passed.                                                                                                         |
| Quality                     | Encoding, source policy including 35 virtual cases, Biome and backend formatting passed.                                                                                                                     |
| Large results               | A valid evaluation larger than 8 MiB persists and reads through RPC. The 32 MiB dataset/change-set budget and 10,000-row limit reject exhausted datasets without truncation or partial commits.              |
| Container                   | Image `mirror-api:local` (`efd3b209acda`) built successfully. Actual PostgreSQL 17.11 and PostgREST 16.3 verified RPC reads/writes, CAS, anonymous denial, scope isolation and the five-second SQL deadline. |
| Recovery and runtime        | Exact-money dump/restore, readiness/liveness, unauthenticated 401, dependency failure, non-root/read-only/no-capabilities execution, redacted logs and SIGTERM passed.                                       |

The normal SQL tests use a local HTTP bridge that executes the actual database functions under the service role. The container smoke separately uses real PostgREST. Both environments use synthetic data. Local container routing uses `NODE_ENV=test` for HTTP; a separate assertion verifies that production still requires HTTPS.

## Measured HTTP workload

[Recorded responses](examples/http-responses.json) and [latency samples](examples/http-latency.json) were regenerated with the current SDK/RPC implementation. Twelve sequential samples per operation produced zero errors:

| Operation                   | p95 ms | Budget ms |
| --------------------------- | -----: | --------: |
| Dashboard                   |  51.58 |       500 |
| Replay refresh              | 256.07 |      2000 |
| Job evaluation              | 399.14 |       750 |
| Evaluation and confirmation | 411.11 |       500 |

These measurements describe one local client on Apple M2/macOS with synthetic Auth/replay and isolated PostgreSQL. They do not establish hosted latency or concurrent throughput. Financial engine evidence remains in [its report](financial-engine.md).

## Selected Supabase project

Migrations `20260912132954_mirror_schema` and `20260912133001_mirror_rpc` are applied to `zypzevcgnkshrgirxirb`, running PostgreSQL 17.6. Local migration versions match the remote migration history.

Verified remotely:

- All 14 Mirror tables have RLS enabled and forced.
- Service-role SQL health returns `{"ready":true}`; an absent synthetic identity has no businesses or active session.
- The configured anon key receives HTTP 200 from Auth settings and HTTP 401/code `42501` from the protected data RPC.
- Supabase security advisors returned no findings after migration.

The supplied service-role key also successfully invokes `mirror_health` through the actual Supabase JavaScript SDK and hosted Data API. All three Supabase runtime variables are configured. These checks do not verify a provisioned Auth user's login, a seeded business journey, hosted API deployment or authenticated Nessie behavior. The demo Auth identity remains pending. Credentials are absent from this report.

## Remaining gates

Complete the demo identity/configuration, authenticated Supabase and designated Nessie walkthrough, event-use conditions and approved HTTPS hosting described in [Backend-Plan.md](../Backend-Plan.md). Native acceptance remains mobile work. No root repository, commit, PR, remote CI or hosting deployment was created by this backend change.
