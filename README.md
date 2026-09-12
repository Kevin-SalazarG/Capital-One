# Mirror

Mirror is a synthetic-data cash-flow planning mobile app and backend for a fictional small business. The backend integrates observed account data, commitments, overhead budgets, a deterministic 30-day forecast, and constrained customer-advance/supplier-schedule alternatives. Registering a plan changes internal planning only. The initial mobile foundation provides sign-in and an authenticated liquidity summary; the remaining journey is tracked in [Mobile-Plan.md](docs/Mobile-Plan.md).

Read [AGENTS.md](AGENTS.md), [the product scope](docs/Idea.md), [backend architecture](docs/Backend.md), and [implementation evidence](docs/Backend-Plan.md) before changing the project.

## Local verification

Use Node 24.15.0, pnpm 11.1.3, and Git. The independently versioned `nessie-node-sdk` is consumed through its public workspace package. Its source and Git history remain in [the separate SDK repository](https://github.com/Kevin-SalazarG/nessie-node-sdk); its local directory is excluded from Mirror's repository.

From a fresh Mirror checkout, obtain the pinned SDK revision before installing dependencies:

```sh
git clone --no-checkout https://github.com/Kevin-SalazarG/nessie-node-sdk.git nessie-node-sdk
git -C nessie-node-sdk checkout --detach 7d57c894c5b45eb38d3c817830f79c73f6ce27cf
pnpm install --frozen-lockfile
```

The clone commands assume `nessie-node-sdk/` does not exist. If you already have a checkout, preserve any local work and verify its revision before changing it. CI obtains the same pinned revision before its frozen installation.

Keep the SDK checkout present before running `docker build --file apps/api/Dockerfile --tag mirror-api:local .` from the workspace root. Docker consumes it from the local build context even though it is excluded from Mirror's Git history.

The organizer's local `Capital One Challenge HackMTY 2026.pdf` is also excluded from Mirror's repository. It is not required to run the application and is not downloaded automatically.

```sh
pnpm --filter nessie-node-sdk build
pnpm --filter @mirror/api build
pnpm generate:contracts
pnpm check
```

`pnpm test:integration` creates an isolated PostgreSQL cluster, applies the versioned Supabase SQL migrations, and exercises the SDK's RPC transport through a local HTTP bridge into the actual SQL functions. The bridge is a test fixture, not a deployed Supabase project. Set `PG_BIN` to a PostgreSQL 17 binary directory. On the development macOS machine its default is `/opt/homebrew/opt/postgresql@17/bin`; Linux CI supplies its own path. Verification of the replacement persistence boundary is tracked in [the quality report](docs/verification/quality-gate.md).

## Start the API

Copy [the configuration template](apps/api/.env.example) to `apps/api/.env` and configure values locally. Never paste or commit credentials. Follow [the operations guide](docs/verification/operations.md) to apply the Supabase SQL migrations and prepare the synthetic Auth identity before starting.

After that one-time database preparation, the running API needs only three values:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_ANON_KEY` is used explicitly for Auth. `SUPABASE_SERVICE_ROLE_KEY` stays on the backend and invokes restricted SQL functions through the Supabase JavaScript SDK. Mirror's tables remain in the private `mirror` schema; the public Data API exposes only the required service-role functions. Those functions enforce business membership, RLS and atomic revision checks. Replay banking and local server settings have defaults. Migration and seed variables belong only to the separate preparation step.

```sh
pnpm --filter @mirror/api demo:seed
pnpm --filter @mirror/api build
pnpm --filter @mirror/api start
```

The versioned API is `/v1`; liveness and readiness are `/v1/health/live` and `/v1/health/ready`. [OpenAPI](apps/api/openapi.json) is a generated artifact; it is not exposed as an unrestricted production documentation endpoint. The [public client](packages/api-client/src/client.ts) contains no database, banking SDK, credentials, or financial engine.

External Supabase/Nessie verification and deployment are separate from the local synthetic test suite. See the [mobile handoff](docs/verification/mobile-handoff.md) for client usage, states, and pending native checks.

## Develop on the iPhone simulator

Follow the [mobile setup guide](apps/mobile/README.md) for the authorized local synthetic environment. Run `pnpm demo:mobile-api` from the workspace root, start Metro with `pnpm --filter @mirror/mobile start` in another terminal, then run `pnpm --filter @mirror/mobile ios` for native installation. The scripts keep the development-client connection on IPv4 loopback. The temporary API writes private randomized credentials to a local file; keep them out of source and logs.

The app uses an always-light appearance and branded startup that waits for session readiness. [Startup/login evidence](docs/verification/mobile-login.md) records completed checks and pending device acceptance; liquidity presentation is being revised, and jobs/decisions remain placeholders. This development build requires the running API and Metro and does not certify a standalone demo or live providers.
