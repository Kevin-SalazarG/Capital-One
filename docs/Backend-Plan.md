# Backend Development Plan

**Version:** 1.2  
**Date:** 2026-09-12  
**Status:** direct Supabase SDK/RPC persistence, backend checks, measured local HTTP workloads, container verification and isolated recovery pass. The SQL migrations are applied to the selected Supabase project; demo Auth setup, live Nessie verification and hosting remain pending.  
**Objective:** complete and verify the agreed Mirror backend before starting the mobile application.

## 1. What this plan delivers

Deliver the backend for the MVP in [Idea.md](Idea.md), using the architecture in [Backend.md](Backend.md), the standards in [Code.md](Code.md), and the delivery rules in [GitHub.md](GitHub.md). Follow [AGENTS.md](../AGENTS.md) when executing each task.

Before mobile starts, a typed API consumer and automated tests must be able to complete the product journey without a graphical interface:

1. Authenticate and access the authorized fictional business.
2. Synchronize its selected Nessie account and inspect source freshness.
3. Review income, expenses, commitments, overhead budgets, and a 30-day forecast.
4. Calculate the required working-capital reserve and identify shortfalls.
5. Evaluate a new job and compare the allowed advance and supplier-payment alternatives.
6. Register a decision without losing pending conditions or committing the same capacity twice.
7. Reconcile a controlled sandbox deposit, evaluate another decision, and recalculate when dates or obligations change.

“Backend complete” means complete for this synthetic-data MVP, not production certification or completion of the mobile product. Native networking, secure token storage, navigation, accessibility, and device behavior still need verification during mobile development. Client integration may reveal additive contract refinements; the backend should not require a redesign of its financial rules.

This document authorizes no implementation or external action by itself. Provisioning, authenticated sandbox operations, shared-environment migrations, GitHub mutations, and deployment occur only when the corresponding work is authorized.

## 2. Starting point and boundaries

The initial inspection on 2026-09-12 found the project documentation, challenge PDF, and existing `nessie-node-sdk/`. Implementation has since added the root pnpm workspace, `apps/api/`, `packages/api-client/`, versioned migrations, isolated PostgreSQL tests, CI configuration, and a Docker artifact. The user subsequently authorized delivery to the existing private [Capital-One repository](https://github.com/Kevin-SalazarG/Capital-One), and the root Git repository is initialized. The SDK retains its separate repository and unchanged source/history; its local checkout and the challenge PDF are excluded from Mirror's Git history.

The SDK manifest declares version `0.1.0`, Node.js `>=22`, pnpm `11.1.3`, and ESM/CommonJS package exports. It already defines encoding, formatting, lint, type, test, build, and installed-package checks. Its [contract notes](../nessie-node-sdk/docs/contract.md) explicitly distinguish fixture/local-server testing from authenticated Nessie compatibility. Inspection is not a fresh successful test run.

Use the stack already selected in `Backend.md`. Exact compatible patches, the PostgreSQL version, connection strategy, and client generator must be validated rather than inferred from a `latest` tag. Do not redesign or republish the SDK to begin the API.

Maintain these boundaries throughout the plan:

- One fictional business, one selected account, one currency, and a 30-day horizon.
- The `auth`, `businesses`, `banking`, `commitments`, `planning`, `decisions`, and `dashboard` modules own the responsibilities described in `Backend.md`.
- Mobile will consume Mirror's API exclusively. No backend dependency or financial engine goes into the generated mobile client.
- No mobile scaffold or admin panel is needed to execute this plan.
- No real banking, lending, custody, customer data, public onboarding system, ERP, or multi-currency support.
- No Redis, queues, microservices, Kubernetes, WebSockets, GraphQL, or required LLM service. Rule-based explanations are sufficient for the core journey.

## 3. Sequence and dependencies

Checked tasks below refer to implemented and locally tested deliverables. External gates remain unchecked. The user explicitly deferred Supabase/Nessie account configuration and the deployment destination, region, and budget until later; this is an accepted scope boundary for this implementation, not evidence that those integrations passed. P0.6 and P0.7 contain completed local decisions alongside remaining provider/event decisions. P3 implements a fail-closed adapter against typed fixtures; its real-provider compatibility remains gated by P0.4.

| Phase | Deliverable                                        | Depends on                             | Exit evidence                                                            |
| ----- | -------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| P0    | Compatibility, provider, and data decisions        | Authorization to begin                 | Recorded results and resolved assumptions for the core path.             |
| P1    | API foundation and enforceable quality gates       | P0 compatibility decisions             | Build, validation, contract-generation sample, and baseline checks pass. |
| P2    | Persistence, identity, and business isolation      | P1                                     | Migrations, session flow, RLS isolation, and versioning tests pass.      |
| P3    | Nessie synchronization and normalized banking data | P2 and verified P0 provider contract   | Repeat imports and failures preserve a coherent dataset.                 |
| P4    | Commitments, reconciliation, and overhead budgets  | P3                                     | Paid, pending, recurring, and adjustable amounts remain consistent.      |
| P5    | Deterministic liquidity and reserve engine         | P2 and agreed financial input contract | Reference calculations and boundary tests pass.                          |
| P6    | Inverse planning and job evaluation                | P5                                     | Both alternatives, constraints, and infeasibility are verified.          |
| P7    | Atomic decisions and reevaluation                  | P3, P4, P6                             | Concurrent requests and retries cannot double-commit capacity.           |
| P8    | Complete API journey and mobile-consumer package   | P7                                     | Generated-client tests complete the journey without UI.                  |
| P9    | Release verification and mobile handoff            | P8 and approved target environment     | Reproducible, reachable demo backend with documented limitations.        |

Default to this order for a single implementer. After P2 fixes the financial input contract, P5 and P6 can progress alongside P3 and P4 if separate contributors are available. P7 must wait for both paths. The user authorized parallel contributors for this implementation. GitHub delivery remains outside the current authorization.

Security, tests, OpenAPI, and documentation are part of every phase. P9 validates the integrated result; it is not the first time those concerns are addressed.

## 4. Phase checklists

### P0 — Resolve the risky assumptions

**Goal:** discover compatibility and provider problems before building the product around them.

- [x] **P0.1** Verify repository boundaries, existing changes, SDK package consumption, and lockfile ownership for the planned pnpm workspace. Preserve the SDK's independent history and existing files.
- [x] **P0.2** Run the existing SDK checks in its own package context once implementation is authorized. Prove a minimal import from the selected backend runtime. Record failures instead of assuming the manifest proves compatibility.
- [x] **P0.3** Validate a minimal combination of NestJS, ESM, Valibot, OpenAPI, Vitest, the Supabase JavaScript SDK/RPC transport, and the banking SDK with compatible pinned versions. Test a representative schema-to-client generation path that does not introduce `any` or index files.
- [ ] **P0.4** Using the existing key through server configuration, verify only the authorized fictional customer's account and required Nessie reads. Record server, states, amount units, precision, dates, response variants, and balance semantics without recording the key.
- [x] **P0.5** Define the money and time policy: currency, precision, rounding, permitted ranges, cutoff, same-day ordering, calendar timezone, recurrence rules, and stale-data behavior. Do not infer Nessie units from the illustrative MXN example.
- [ ] **P0.6** Select the development/test environments and demo identity approach. Confirm the intended Supabase project, PostgreSQL version, runtime/migration connection modes, and the process for obtaining deployment budget and region approval.
- [ ] **P0.7** Define coherent synthetic fixtures and expected outputs from `Idea.md`. Confirm event rules affecting the pre-existing SDK, reused materials, and required disclosures before the event submission. Fixtures are implemented and tested; the [event review](verification/event-reuse.md) verifies MIT licensing and SDK provenance. Current 2026 reuse/disclosure conditions and permission for organizer/brand materials remain unconfirmed.

**Exit:** record compatibility results and provider evidence, agreed financial inputs, and remaining external decisions. Do not freeze the banking adapter around an unverified assumption. If Nessie access is temporarily blocked, pure-domain work may continue with explicitly labeled fixtures, but the provider gate remains open.

Supabase has ended support for Node.js 20 in its client libraries; the selected runtime must satisfy current package requirements. Table-exposure defaults have also changed, so inspect actual permissions rather than assuming them. [Runtime notice](https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20), [Data API changes](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

### P1 — Establish the API and quality foundation

**Goal:** make every subsequent feature fit one verified project structure and API convention.

- [x] **P1.1** Create only the necessary root workspace and `apps/api/` foundation. Pin the agreed toolchain and dependencies. Integrate the SDK through its public package interface; do not scaffold `apps/mobile/`.
- [x] **P1.2** Configure strict TypeScript and the full `Code.md` policy, Prettier, Biome lint, UTF-8/LF checks, and meaningful file naming. Prove the source-policy checker rejects invalid virtual samples without adding forbidden source files.
- [x] **P1.3** Add startup configuration validation, dependency injection boundaries, structured redacted logs, request identifiers, safe errors, payload limits, and basic health checks.
- [x] **P1.4** Establish `/v1` API conventions: input/output validation, money strings, dates, stable error codes, bounded pagination, operation identifiers, and authentication declarations. Separate financial outcome, pending conditions, and freshness.
- [x] **P1.5** Set up unit and HTTP testing, and a reproducible PostgreSQL test environment. Ensure Nest test execution matches production validation and serialization behavior.
- [x] **P1.6** Establish incremental OpenAPI generation and a small typed consumer proof. Add the declared quality scripts and prepare applicable CI checks under the GitHub policy; activate remote protections only when authorized.

**Exit:** a clean installation can build and start the API, a validated sample route and generated consumer work, intentional policy violations fail, and no financial logic or secrets are embedded in controllers or client artifacts.

Use the project's stricter standards when adapting framework examples. Nest documents ESM/Standard Schema support and testing with Vitest and Supertest; examples are not permission to weaken typing or replace Valibot. [Nest migration guidance](https://docs.nestjs.com/migration-guide), [Nest testing](https://docs.nestjs.com/fundamentals/testing).

### P2 — Build persistence, identity, and isolation

**Goal:** establish a safe write path before importing or changing business data.

- [x] **P2.1** Define authored Valibot persistence contracts and versioned Supabase SQL migrations. Cover business membership and policy, source identities, planning state, and the relations needed by later modules; evolve the schema with each feature rather than inventing future product tables.
- [x] **P2.2** Keep business tables in the private `mirror` schema. Expose only the required service-role RPC functions through the Data API and execute business operations under the constrained `mirror_executor` role. Keep managed provider schemas outside Mirror's migration ownership.
- [x] **P2.3** Implement login, refresh, logout, and session inspection through NestJS and Supabase Auth. Use provisioned synthetic demo identities; public sign-up, social login, and password-recovery UX are outside this MVP.
- [x] **P2.4** Verify identity and session policy, check current business membership, and enforce object-level permissions. Reject caller-controlled membership or tenant claims; isolate session state across requests.
- [x] **P2.5** Implement transaction-local verified authorization context and forced RLS for business data inside RPCs. Test allowed access, cross-business access, absent context, reassignment attempts, anonymous/authenticated RPC rejection, and connection-context reuse using the actual SQL roles.
- [x] **P2.6** Implement coherent business snapshots and atomic `dataRevision` compare-and-set commits, alongside the public `planningVersion` protocol used by financial writers. Persist idempotency and audit records with decision confirmation in the same SQL transaction.
- [x] **P2.8** Enforce the 32 MiB business-state/change-set and 10,000-row-per-collection MVP limits. Validate the resulting dataset before mutation commit; reject exhaustion with `DATASET_LIMIT` (422), preserve all previous data, and verify a valid evaluation larger than eight MiB persists and reads through RPC.
- [x] **P2.7** Add protected, reproducible setup for the fictional business and test identities. Verify applying migrations to an empty database and upgrading a previous test schema without corrupting data.

**Exit:** authenticated access works, invalid/revoked-session behavior follows the documented policy, unauthorized access is denied, and all business writes have a tested consistency boundary. Use a second isolated synthetic business in tests to prove isolation; it is not a multi-business UI feature.

The service-role API key is server-only. Its broad provider privileges do not authorize business data access by themselves: public RPC grants, a constrained executor, explicit membership checks and forced RLS must enforce the scoped operation. RLS tests must exercise the executor without bypass privileges. [RPC functions](https://supabase.com/docs/guides/database/functions), [RLS behavior](https://supabase.com/docs/guides/database/postgres/row-level-security).

### P3 — Integrate and normalize Nessie data

**Goal:** produce a coherent banking dataset that the rest of Mirror can trust within its documented limitations.

- [x] **P3.1** Implement the `banking` adapter for the selected account, deposits, withdrawals, and bills verified in P0. Do not expose the SDK's full resource catalog through Mirror.
- [x] **P3.2** Map validated provider data into explicitly typed internal records with source identity, account, currency interpretation, dates, statuses, and synchronization metadata.
- [x] **P3.3** Implement protected manual refresh with bounded provider calls, cancellation, timeouts, and the defined read-retry policy. Persist run status, success/failure, cutoff, and source freshness.
- [x] **P3.4** Enforce deduplication and update semantics with database constraints. Fetch outside short database transactions, then publish a complete internal revision through the P2 version protocol.
- [x] **P3.5** Detect inconsistent or incomplete source reads and prevent older overlapping refreshes from overwriting newer data. On failure, preserve the last complete dataset and expose its age and the failed update.
- [x] **P3.6** Provide paginated account/movement reads and typed fixtures for provider failures, schema discrepancies, pending/cancelled records, duplicates, and non-operating deposits.

**Exit:** reimporting the same source data does not duplicate cash, failures do not publish partial snapshots, and all outputs identify live sandbox, stored snapshot, or labeled replay. A local database transaction does not make multiple upstream Nessie reads atomic.

### P4 — Complete commitments, reconciliation, and overhead control

**Goal:** represent future obligations and general expenses, not only bank movements.

- [x] **P4.1** Implement authorized creation, reading, editing, and cancellation of synthetic receivables and payables. Capture due dates, expected/received/remaining amounts, source, negotiability, and relevant conditions.
- [x] **P4.2** Implement the agreed recurring-payment rules and finite calendar expansion. Preserve occurrence identity so imported bills and manually confirmed obligations are not counted twice.
- [x] **P4.3** Implement reconciliation of full and partial observed payments to commitments. Preserve matching evidence; ambiguous matches require review rather than a guessed relationship.
- [x] **P4.4** Support review/correction of a match with auditability and recalculation. Coordinate banking and commitment changes inside the same consistency boundary.
- [x] **P4.5** Implement basic category budgets and totals for paid, committed-unpaid, remaining, and adjustable overhead. Prevent double counting when a committed expense becomes paid.
- [x] **P4.6** Support the permitted flexible-expense adjustment and explain its effect on budget and cash. Keep actual transactions immutable as observed facts; changing a planning assumption must not rewrite provider history.

**Exit:** obligations, partial payments, recurring events, category spending, and budget adjustments remain consistent across edits and refreshes. Every relevant mutation advances the planning state and makes affected evaluations stale.

### P5 — Implement the liquidity and reserve engine

**Goal:** make the four core financial outputs reproducible without HTTP, a database, or AI inside the engine.

- [x] **P5.1** Define immutable, validated financial input/output models and an explicit engine version. Inject cutoff, calendar policy, and scenarios instead of reading hidden global state.
- [x] **P5.2** Implement daily cash projection for the next 30 days plus the initial balance check. Respect the cutoff and same-day availability policy; do not sum already-settled history into the opening balance again.
- [x] **P5.3** Calculate minimum balance, operational shortfall, protection gap, critical date, reserve target, reserve coverage, and available capacity for an additional expense at a specified date.
- [x] **P5.4** Support the base and defined collection-delay scenario with explicit assumptions. Missing critical data blocks evaluation; estimates and effects outside the horizon remain visible.
- [x] **P5.5** Use decimal arithmetic with the P0 money policy, conservative required-amount rounding, and exact serialization. Return structured explanations identifying the obligations and dates behind each result.
- [x] **P5.6** Test the `Idea.md` examples, zero/negative balances, boundaries, rounding, date changes, reordered inputs, conservation of amounts, and deterministic reruns. Measure the bounded worst-case input selected for the MVP.

**Exit:** independently calculated reference outputs pass. Changing an input changes the calculation rather than selecting a prewritten response. Forecasts are conditional projections, not calibrated predictions or a promise of solvency.

### P6 — Add inverse planning for new jobs

**Goal:** compute actionable conditions instead of returning only a cash-flow chart.

- [x] **P6.1** Validate the proposed job's total collection, costs, dates, allowed advance, permitted supplier installments, non-negotiable obligations, and known fees.
- [x] **P6.2** Evaluate the unchanged job against the base operation and the selected scenarios, showing which obligation and date create a restriction.
- [x] **P6.3** Search for the minimum sufficient customer advance within the allowed amount and useful dates. Reduce the later collection by the same amount and avoid assuming same-day receipt precedes an outgoing payment.
- [x] **P6.4** Search the permitted supplier-payment schedule while preserving total cost, required delivery conditions, and known fees. Do not move payroll, taxes, or other non-negotiable obligations.
- [x] **P6.5** Compare alternatives with independent financial, condition, and freshness states. Return no feasible alternative when limits are insufficient; do not silently lower the cushion or invent another option.
- [x] **P6.6** Persist an immutable evaluation with the actual coherent data snapshot, planning version, engine version, assumptions, constraints, and result. Do not label a mixed concurrent read as one consistent version.

**Exit:** both alternatives and their limiting conditions are tested across every evaluated day and scenario. An advance or supplier agreement remains conditional until the corresponding evidence or user-confirmed condition exists.

### P7 — Register decisions safely and track changes

**Goal:** make a saved decision reliable under concurrent requests, retries, and updated data.

- [x] **P7.1** Implement list/detail access to evaluations and decisions, with confirmed and pending conditions, explanations, and historical snapshots scoped to the authorized business.
- [x] **P7.2** Confirm a selected alternative against a server-owned evaluation. Recheck authorization, allowed conditions, and expected version; never trust financial totals supplied by mobile.
- [x] **P7.3** Atomically advance the planning version and persist the decision, its commitments, idempotency record, and audit event in one transaction. A conflict rolls back the whole confirmation.
- [x] **P7.4** Make a same-key/same-content retry return the recorded result, including after a process restart or lost response. Reject the same key with different content and isolate keys by the documented identity/business scope.
- [x] **P7.5** Implement condition updates and reevaluation after relevant synchronization, reconciliation, commitment, or policy changes. Preserve the previous snapshot and expose stale/review-needed status until a new calculation completes.
- [x] **P7.6** Evaluate subsequent jobs against previously registered commitments. Pending inflows must not release unconditional spending capacity, and registering a conditional plan must not duplicate its eventual observed payment.
- [x] **P7.7** Test simultaneous confirmations, refresh-versus-confirmation, edits during evaluation, duplicate retries, partial failures, and unauthorized replays against PostgreSQL.

**Exit:** two requests cannot register commitments against the same outdated capacity. Historical evaluations remain traceable, and receipt of a deposit confirms money received rather than every term of an agreement.

### P8 — Finish the consumer-facing API

**Goal:** deliver all data mobile needs without requiring mobile to reconstruct the business logic.

- [x] **P8.1** Implement `dashboard` as a read composer over the existing modules, not a second financial engine. Return liquidity, category spending, reserve, warnings, and decision summaries with consistent version/freshness metadata.
- [x] **P8.2** Complete and review all required operation contracts, validation, errors, permissions, pagination, retry guidance, and examples. Keep invalid requests distinct from valid but financially infeasible evaluations.
- [x] **P8.3** Generate `packages/api-client` from the validated Mirror OpenAPI contract. Use named public entry points and precise types without `any`, index files, provider models, secrets, or Node-only runtime dependencies.
- [x] **P8.4** Build a headless consumer test that imports that public client and calls the running API over HTTP. Do not satisfy the test by directly calling controllers or domain functions.
- [x] **P8.5** Exercise login/refresh, synchronization, overhead adjustment, forecast, both alternatives, confirmation, reconciliation, second-job evaluation, and stale-result recovery using the client.
- [x] **P8.6** Provide synthetic success, empty, incomplete, conditional, infeasible, stale, unauthorized, conflict, and provider-unavailable examples. Verify public responses against the same schemas used to generate the client.
- [x] **P8.7** Freeze an initial reviewed `/v1` contract baseline and establish regeneration/drift checks. Document how compatible changes will be introduced during mobile integration.

**Exit:** a consumer outside the backend completes the journey with no financial calculations of its own. Schema generation and a Node consumer are useful evidence, but do not claim that React Native bundling or device behavior has already been tested.

### P9 — Verify, deploy, and hand off

**Goal:** make the completed backend reproducible and reachable for mobile development.

- [x] **P9.1** Run the applicable complete quality gate on the exact candidate revision: encoding, source policy, Prettier, types, lint, unit/integration/E2E tests, build, generated contracts, and affected SDK/package checks.
- [x] **P9.2** Complete a focused security review: business isolation, session lifecycle, secret redaction, input limits, rate limits, configuration failure, safe errors, and protected preparation operations. Close correctness and isolation defects before handoff.
- [x] **P9.3** Measure read, synchronization, evaluation, and confirmation behavior against the P0/P1 workload and latency budgets. Record environment and p95/error results; do not claim scalability from one successful request.
- [x] **P9.4** Build and smoke-test the Docker artifact including its local SDK dependency. Verify bounded RPC calls, timeouts, shutdown, liveness, readiness, and useful redacted operational logs.
- [x] **P9.5** Prepare reproducible fixtures, a labeled replay mode, and targeted demo recovery procedures. Rehearse migration and recovery in an isolated test environment; no broad deletion or public reset endpoint.
- [ ] **P9.6** Once the target, budget, region, and credentials are approved, deploy to the agreed demo environment and verify the reachable HTTPS API. Test provider failure without misrepresenting replay as live Nessie.
- [ ] **P9.7** Run an explicitly authorized authenticated Nessie read and controlled deposit/reconciliation walkthrough. Reconcile uncertain write outcomes before retrying. Keep the test scoped to the designated synthetic account.
- [x] **P9.8** Produce the mobile handoff package and evidence report. Complete authorized GitHub review/merge work according to `GitHub.md`; do not claim remote checks or approvals that have not happened.

**Exit:** the candidate backend passes the readiness checklist below. If hosting, credentials, or sandbox verification remain blocked, report the precise unfinished gate; “works locally with fixtures” is not the same as an integrated, deployed demo.

## 5. API capability inventory

These implemented operation families are published with exact method/path names and validated schemas in [OpenAPI](../apps/api/openapi.json). The generated [public client](../packages/api-client/src/client.ts) is the consumer entry point.

| Owner         | Operations to expose                                                                     | Consumer must receive                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `auth`        | Login, refresh, logout, session inspection.                                              | Typed session/identity results, expiry behavior, and safe errors.                         |
| `businesses`  | Read the authorized business and permitted planning settings.                            | Currency, timezone, cushion policy, membership scope, and current planning version.       |
| `banking`     | Read account/movements, request refresh, read refresh status.                            | Observed values, source identity, cutoff, errors, and freshness.                          |
| `commitments` | Manage pending obligations, recurring occurrences, reconciliation review, and budgets.   | Paid versus outstanding amounts, due dates, category totals, editability, and provenance. |
| `planning`    | Retrieve a forecast/reserve calculation and create/read a job evaluation.                | Daily values, explanations, constraints, alternative results, and input/method versions.  |
| `decisions`   | Confirm an evaluation, list/read decisions, update permitted conditions, and reevaluate. | Idempotent confirmation, commitments created, pending conditions, history, and conflicts. |
| `dashboard`   | Retrieve the mobile liquidity and decision summaries.                                    | Consistent presentation-ready data without formulas for mobile to reproduce.              |
| Platform      | Health/readiness and controlled API documentation access.                                | Minimal operational state without credentials or internal diagnostics.                    |

Fixture preparation, account provisioning, and destructive recovery belong to protected operational tooling, not unrestricted product endpoints. Merely viewing or evaluating a scenario must never create a Nessie movement.

## 6. Acceptance evidence

Use the full acceptance cases in `Idea.md` and `Backend.md`. The following table identifies the minimum evidence needed to close the important gates; it does not replace the complete test suite.

| Case                                                               | Required evidence                                                                                           | Phase |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----- |
| Opening balance 50,000; payroll 30,000; cushion 10,000; no new job | Reserve target 40,000 and immediate additional-expense capacity 10,000 for the reference inputs.            | P5    |
| New job without advance                                            | Minimum balance -20,000 and protection gap 30,000, despite a positive closing balance.                      | P5–P6 |
| Advance 30,000 before payroll                                      | Minimum 10,000; total job income unchanged.                                                                 | P6    |
| Advance capped at 20,000 and fixed supplier payment                | Minimum 0; no permitted alternative preserves the 10,000 cushion.                                           | P6    |
| Supplier receives 10,000 on day 10 and 30,000 on day 29            | Minimum 10,000 under the reference assumptions; agreement remains conditional.                              | P6    |
| Partial or duplicate payment                                       | Outstanding amount is reduced once, without duplicate cash or expense.                                      | P3–P4 |
| Payment already included in cutoff balance                         | It is not added again to future liquidity.                                                                  | P3–P5 |
| Recurring bill is paid or cancelled                                | Calendar, spending, and remaining commitments stay consistent.                                              | P4–P5 |
| Flexible overhead is adjusted                                      | Budget and cash impact change while paid/non-negotiable obligations remain protected.                       | P4–P5 |
| Incomplete data or failed/overlapping refresh                      | No fabricated success, mixed snapshot, or silently current result.                                          | P3–P8 |
| Delay, impossible agreement, or effect after day 30                | Constraints and horizon limits remain visible; the engine does not invent a solution.                       | P5–P7 |
| Two decisions on one version                                       | Only a valid atomic confirmation succeeds; the conflicting request must recalculate.                        | P7    |
| Confirmation response is lost and retried                          | Same recorded result and no duplicate commitments, including after restart.                                 | P7    |
| Wrong business, object, session, or pooled context                 | Access is denied and no unauthorized read/write or context leak occurs.                                     | P2–P9 |
| Complete public-client journey                                     | Runtime-validated API responses and generated types work over HTTP without UI or duplicate financial logic. | P8–P9 |
| Source unavailable during demonstration                            | Last-known data or replay is explicitly labeled; no live-connection claim is fabricated.                    | P9    |

The monetary values above belong only to the reference fixture. Add independent tests with changed dates and amounts so the implementation cannot pass by returning those constants.

## 7. Definition of ready for mobile

Mobile implementation starts after reviewing this gate, not merely after the server starts successfully:

- [x] All seven functional modules support the agreed journey through the public API.
- [x] The four problem-statement objectives and both inverse-planning alternatives have passing evidence.
- [x] Identity, business isolation, reconciliation, stale-data handling, and concurrent confirmation are tested.
- [x] The initial OpenAPI contract and typed public client are reproducible and compatible with the code standards.
- [x] The headless HTTP consumer completes the journey without importing backend internals or calculating financial results.
- [ ] The approved backend environment is reachable and its startup, migration, recovery, and failure behavior have been checked.
- [ ] Authenticated Nessie verification and the controlled update have been completed, separately from fixture-based CI.
- [x] The candidate revision passes applicable checks, with no unresolved critical security or financial-correctness defects.
- [ ] The mobile handoff contains the API base URL, configuration-variable names without secrets, OpenAPI, client usage, auth/refresh guidance, error/state catalog, synthetic examples, test results, and operating instructions.
- [x] Known limits and the remaining native/mobile validations are explicit. The demo does not depend on hidden manual database edits or an admin panel.

Do not aim for hypothetical enterprise completeness before starting mobile. Once this MVP gate passes, mobile becomes the next implementation priority; defer unrelated backend improvements.

## 8. Execution and change control

- Start with P0 when implementation is authorized. At each phase boundary, show the deliverable, checks, remaining risks, and next scoped task.
- Use small changes identified by the task IDs above. Git branches, commits, PRs, and reviews follow `GitHub.md`; this plan does not create those resources.
- Keep architecture decisions in `Backend.md`, code rules in `Code.md`, product changes in `Idea.md`, and execution progress here. Document a material change before treating it as an agreed new requirement.
- Set numeric workload, timeout, latency, and resource budgets after the initial compatibility spike, then measure against them. Do not publish invented throughput or fixed delivery estimates before that evidence exists.
- Re-estimate after P0 using the actual team and event constraints. A backend-first plan must still leave time for the mobile journey, integration, and presentation; backend readiness alone is not the finished hackathon submission.
- If a gate fails, fix it or record an explicit scoped decision. Do not remove tests, dilute security, duplicate calculations in mobile, or mark pending integrations complete to keep the checklist moving.

## 9. Execution evidence and deferred gates

Implementation owners: the primary agent integrated platform, business/commitment/budget services, contracts, HTTP evidence, and handoff. Parallel contributors owned persistence and deployment tooling, the deterministic engine and decisions, and the SDK/banking/Auth verification. The reviewed SQL migrations were applied to the selected Supabase project. Initial implementation and verification preceded root Git setup; the user subsequently authorized repository delivery. Hosting remains pending.

| Area                           | Deliverable and evidence                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compatibility and SDK          | Node 24.15.0, pnpm 11.1.3, NestJS 12.0.1, the pinned Supabase JavaScript SDK, Valibot 1.5.0, PostgreSQL 17.11; exact dependency versions in manifests/lockfile. The replacement backend compatibility gate passed. [SDK baseline](verification/sdk-baseline.md).                                                                                                                         |
| Identity and persistence       | Versioned Supabase SQL migrations, private business schema, service-role RPCs, constrained executor and forced RLS, coherent snapshots and revision CAS, session checks, idempotency, reconciliation guards and unique registered jobs. Replacement integration checks passed in the 89-test aggregate run. [Database tests](../apps/api/test/integration/database.integration.test.ts). |
| Banking and overhead           | Read-only SDK adapter, labeled deterministic replay, monotonic refresh ordering, complete-snapshot publication, partial matching/correction, recurring commitments, budgets, and flexible adjustments. [Banking evidence](verification/banking-adapter.md).                                                                                                                              |
| Financial engine and decisions | Exact decimal arithmetic, 30-day daily projections, reserve/shortfall/capacity, bounded inverse searches, immutable snapshots, conditional commitments, atomic confirmation, and reevaluation. [Financial evidence](verification/financial-engine.md).                                                                                                                                   |
| Consumer and contracts         | All seven modules over HTTP; generated typed/runtime-validated client, OpenAPI drift gate, synthetic response examples, and measured sequential HTTP workloads. [HTTP evidence](verification/http-consumer.md), [response examples](verification/examples/http-responses.json), [latencies](verification/examples/http-latency.json).                                                    |
| Operations and handoff         | Protected seed, local verification, CI definition, non-root Docker image, database recovery rehearsal, configuration and recovery instructions. [Operations](verification/operations.md), [mobile handoff](verification/mobile-handoff.md).                                                                                                                                              |

Local tests use reproducible synthetic accounts and an isolated PostgreSQL cluster. Auth security tests exercise the real Supabase SDK against a locally signed JWT/JWKS/Auth-contract fixture; they do not claim a real Supabase project has been verified. Normal checks require no Nessie credentials. Latency evidence describes one local workload and does not establish production scalability.

The remaining external checklist is explicit:

- **P0.4 / P9.7:** verify authenticated Nessie reads, amount units, statuses, dates, balance/cutoff semantics, and one authorized controlled deposit/reconciliation on the designated fictional account. Live mode requires explicit verified-units configuration.
- **P0.6:** provision the demo Auth identity, then verify login/session and seeded business access through the hosted API. All three Supabase variables are configured and the service-role key successfully invokes health through the actual Data API. SQL migrations, absent-session lookup, all 14 tables under forced RLS, and anon denial are also verified; these checks do not replace the full authenticated journey.
- **P0.7:** the [2026 event review](verification/event-reuse.md) confirms the SDK's MIT license and public baseline; no authoritative current rule resolving reuse was located. Obtain the applicable SDK/library exception, development window and AI/tool/material disclosures, and resolve permission for the Capital One logo and any redistributed challenge PDF. The report contains source evidence and an unsent organizer inquiry. Financial fixtures are implemented and tested; P0.7 remains open until submission conditions are resolved.
- **P9.6:** select/authorize the hosting destination, budget and region, apply shared-environment setup, deploy, and verify reachable HTTPS and live-provider failure behavior.
- **Mobile:** review the deployment/provider gates before treating the full readiness definition as passed; native networking, secure storage, bundling, navigation, and accessibility remain mobile work.

The [local release report](verification/quality-gate.md) separates historical results from fresh replacement checks. The running API uses only `SUPABASE_URL`, `SUPABASE_ANON_KEY` for Auth and `SUPABASE_SERVICE_ROLE_KEY` for RPC. Migration application, synthetic identity preparation and optional live banking configuration are separate setup steps.

**Configuration follow-up:** project `zypzevcgnkshrgirxirb` has migrations `20260912132954_mirror_schema` and `20260912133001_mirror_rpc`. Both SQL and actual SDK/Data API health return `ready: true` with the configured service-role key. The configured anon key receives Auth settings HTTP 200 and protected RPC HTTP 401/code `42501`. Supabase security advisors returned no findings. The demo Auth identity and designated Nessie account remain pending; no identity is fabricated from the project reference.

**Current next step:** complete the protected demo configuration, verify the authenticated Supabase/Nessie journey, confirm event conditions and select the hosting destination. Existing mobile work is preserved; local backend checks do not certify native acceptance or a hosted API.

The complete `pnpm check` passed, including 89 PostgreSQL/RPC/HTTP integrations, 59 API unit tests, 84 SDK tests, 73 mobile tests and iOS/Android exports. API/client builds and types, scripts type checking, unchanged contracts, encoding, source-policy checks including 35 virtual cases and Biome passed. Current container smoke uses real PostgreSQL/PostgREST and verifies exact-money recovery, RPC reads/writes, CAS, anonymous denial, the five-second SQL deadline, readiness, dependency failure, runtime restrictions and shutdown. Sequential local HTTP samples passed all four latency budgets with zero errors; see the recorded [samples](verification/examples/http-latency.json). Hosted Auth/business and Nessie journeys remain pending.
