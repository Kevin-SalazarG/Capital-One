# Mobile Development Plan

**Version:** 1.2  
**Date:** 2026-09-12  
**Status:** M0 review and M1 local foundation in progress; native and provider gates remain explicit.  
**Platform:** iPhone first, compatible with Android.  
**Objective:** deliver the complete Mirror mobile journey against its public API, with an accessible design system and a reproducible standalone demo.

## 1. Purpose and ownership

Implement the MVP in [Idea.md](Idea.md) using the stack, folder structure, and boundaries in [Mobile.md](Mobile.md). [Backend.md](Backend.md) owns financial and API behavior; [Code.md](Code.md) owns code quality; [GitHub.md](GitHub.md) owns authorized delivery. Follow [AGENTS.md](../AGENTS.md) before executing work.

This document owns mobile task sequencing, dependencies, progress, and acceptance evidence. It does not replace the architecture, duplicate the financial engine, or mark the [backend readiness gate](Backend-Plan.md#7-definition-of-ready-for-mobile) complete. Writing this plan does not authorize application scaffolding, dependency installation, signing, cloud resources, or GitHub operations.

The finished journey must let the user:

1. Sign in and open the authorized fictional business.
2. Understand observed cash, pending commitments, overhead spending, the 30-day forecast, reserve needs, and source freshness.
3. Enter a new job, review its original outcome, and compare the permitted customer-advance and supplier-installment alternatives.
4. Register a plan explicitly, preserving pending conditions and handling uncertain responses safely.
5. Review reconciliation, evaluate another job against existing decisions, and reevaluate when relevant data changes.
6. Complete the journey on a standalone iPhone build, with Android compatibility and visible failure states.

One fictional business, one account, one currency, and the base/collection-delay scenarios remain the product boundary. There is no public onboarding system, admin panel, direct Nessie access, real payment execution, persistent offline financial dataset, push notification system, or required AI interaction.

## 2. Starting point and entry conditions

Initial inspection on 2026-09-12 found an existing pnpm workspace, `apps/api/`, generated `packages/api-client/`, backend verification documents, and the independent SDK repository. The authorized first execution block added `apps/mobile/`. The user subsequently authorized delivery to the existing private [Capital-One repository](https://github.com/Kevin-SalazarG/Capital-One), and the root Git repository is initialized. Preserve concurrent backend work and the independently versioned SDK checkout, which is excluded from Mirror's Git history.

The [backend handoff](verification/mobile-handoff.md) describes the public client and local synthetic consumer evidence. It still identifies external provider verification and reachable HTTPS as pending. Its existence is not proof that the complete readiness gate passed. Earlier unchecked backend-plan tasks and current implementation reports must be reconciled by the backend owner rather than silently interpreted as completion or absence of code.

The [public client](../packages/api-client/src/client.ts) has named operations, runtime response validation, token and fetch injection, and typed path/query/body inputs. M0 extended its backend-owned generator with per-request cancellation/deadlines, safe transport errors including non-JSON responses, and retry-header metadata. The [handoff](verification/mobile-handoff.md) records the contract and regression evidence. Mobile consumes this public boundary without a second endpoint catalog.

Root quality scripts now include mobile application/tooling types, tests, lint, formatting, and JavaScript exports. Source-policy analysis covers mobile and forbidden server imports; maintained-text checks include authored CSS and dependency patches. Native build and device evidence remain separate from these commands.

Planning and handoff review may proceed while the backend is being completed. Application implementation starts after explicit implementation authorization and the documented readiness review. If an external gate remains open, record it and request a scoped decision before substituting a local-only prototype; do not quietly relax the agreed gate.

## 3. Sequence and dependencies

Keep the M0–M5 milestone identifiers from `Mobile.md`. A task is complete only when its deliverable, actual verification, and evidence are recorded. The execution ledger below distinguishes completed tasks from partially implemented milestone requirements.

| Milestone | Deliverable                                                                     | Depends on                                         | Exit evidence                                                                                         |
| --------- | ------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| M0        | Reviewed handoff, device/delivery decisions, and contract gaps                  | Current backend evidence and required user choices | Explicit entry decision; no hidden contract or environment assumptions.                               |
| M1        | Expo foundation, design system, native navigation, session, and quality tooling | M0 and implementation authorization                | iOS and Android builds, typed API access, themed controls, and session lifecycle work.                |
| M2        | Mi liquidez, records, commitments, overhead control, and reserve presentation   | M1                                                 | All four product objectives are represented using authoritative API results.                          |
| M3        | Guided job input, original outcome, and both alternatives                       | M1; M2 before integrated acceptance                | Changed inputs produce fresh backend results with constraints and conditions visible.                 |
| M4        | Safe registration, decisions, reconciliation review, and reevaluation           | M2 and M3                                          | Duplicate taps, uncertain responses, stale versions, and session changes do not create false success. |
| M5        | Cross-platform verification, standalone demo, and handoff                       | M4 and approved delivery configuration             | Verified candidate build, complete device journey, and honest live/replay evidence.                   |

Default to the table order for one implementer. After M1, M2 and M3 may progress in parallel if contributors have separate file ownership and stable contracts. M4 waits for their integrated results. Tests, accessibility, and failure handling accompany each feature; M5 is the final combined pass, not their starting point. Do not create extra tasks, contributors, or branches automatically.

Do not promise a fixed delivery time before M0 resolves the device, environment, signing, and contract risks. Re-estimate after the M1 two-platform build, preserving time for integration and rehearsal.

## 4. Implementation checklists

### M0 — Review the handoff and resolve entry decisions

**Goal:** avoid building the app around an unverified contract or an unusable demo installation path.

- [x] **M0.1** Recheck applicable instructions, repository boundaries, concurrent edits, workspace/toolchain ownership, and the absence or current state of mobile. Preserve the SDK and backend changes.
- [x] **M0.2** Review the backend readiness checklist against actual evidence, the generated OpenAPI document, and public-client consumer tests. Record the candidate revision or artifact hashes when Git is unavailable, the approved API base URL, and unresolved external gates. Do not count Node tests as native verification.
- [x] **M0.3** Review typed request inputs, cancellation, transport deadlines, safe network/non-JSON/schema errors, retry-header access, and refresh behavior. Resolve required capabilities through the backend-owned generator and public extension points. Confirm that the base URL excludes `/v1`, which the generated operation paths already contain.
- [x] **M0.4** Confirm expiry units, refresh rotation/recovery, logout semantics, permitted read retries, rate-limit handling, and every write's uncertain-outcome policy. For confirmation, document idempotency scope/lifetime, same-key replay, conflicts, and whether lookup is available; do not invent a status endpoint.
- [ ] **M0.5** Identify the demo iPhone/iOS version, Android test target, minimum supported OS versions, local native toolchains, authorized app identifiers, and signing/distribution route. Confirm access and costs without purchasing services or changing accounts. Keep physical-device HTTPS connectivity distinct from simulator loopback access.
- [x] **M0.6** Prepare a concise visual brief for the existing three-tab journey: information hierarchy, typography, semantic outcomes, the approved always-light appearance, and key screen compositions. Resolve essential branding choices without adding screens, paid assets, or another styling framework. System fonts are acceptable until a licensed custom font is selected.
- [x] **M0.7** Record the entry decision and an evidence inventory. Retain the selected stack in `Mobile.md`; revalidate compatible package patches during M1. Report any gate requiring user or backend-owner action before mobile implementation starts.

**Exit:** the implementer has a reviewed contract, an approved reachable environment, the required backend evidence, and a viable device/delivery path. Pending prerequisites stay explicit; planning is not a completed native compatibility test.

### M1 — Establish the native and design foundation

**Goal:** prove one working mobile foundation before multiplying screens.

- [x] **M1.1** Create only the necessary `apps/mobile/` files and add the app to the existing pnpm workspace. Use `src/entry.ts` with Expo's named-entry configuration. Keep one workspace lockfile; create no index files, directory barrels, or empty feature scaffolding.
- [x] **M1.2** Pin a compatible Expo/React/React Native set and the visual dependency family from `Mobile.md`. Declare native modules in the app package. Integrate HeroUI Native, Uniwind, Tailwind CSS 4, required styling peers, matching Reanimated/Worklets/Gesture Handler, safe areas, and keyboard control. Configure Expo Metro plus Uniwind without unrelated resolver overrides or a second styling system.
- [x] **M1.3** Extend quality coverage to mobile TS/TSX, configuration, tests, generated public contracts, and authored CSS. Enable the complete TypeScript policy, Prettier, Biome lint, strict UTF-8/LF, forbidden-import checks, and source-policy analysis using the mobile tsconfig. Prove failures with inert/virtual negative cases rather than authored forbidden files. Review native generated/build-directory exclusions narrowly.
- [x] **M1.4** Configure the compatible `jest-expo` and React Native Testing Library toolchain. Add typed providers, controlled clocks/network/storage adapters, and synthetic fixtures. Verify at least a control interaction and an API-error state before using the harness throughout the app.
- [ ] **M1.5** Implement the smallest useful `design-system`: semantic theme source, resolved native/SVG colors, text, button, surface, icon, labeled fields, amount/date inputs, notices, loading/empty/error feedback, and screen/keyboard layouts. Use narrow typed props and actual reuse; keep financial cards in their features. Review representative light controls under both operating-system appearance settings, with long Spanish labels and large text.
- [ ] **M1.6** Compose providers once and implement typed native-stack navigation plus the three native tabs. Use supported native tab symbols/assets rather than assuming tabs accept arbitrary SVG components. Separate authenticated navigation, test native sheets/back behavior, and protect dirty forms from accidental dismissal.
- [ ] **M1.7** Configure one public API transport and a safe error adapter. Validate public environment configuration, wire supported cancellation and timeouts, distinguish abort/network/schema/API errors, and map user-facing messages without exposing payloads. Never import server internals or add direct provider access.
- [ ] **M1.8** Implement sign-in, restoration, serialized refresh, unavailable/invalid session states, and sign-out. Keep access tokens in memory, refresh credentials in SecureStore, and validate restored values. Test rotation uncertainty, storage failures, late responses after logout, and navigation reset. A failed network request must not masquerade as confirmed revocation.
- [ ] **M1.9** Configure TanStack Query with scoped keys, one foreground/connectivity adapter, controlled read retries, cancellation, and authoritative invalidation. Use memory-only financial caching. Do not persist or automatically resume financial mutations on reconnect, and do not duplicate query data in global UI state.
- [ ] **M1.10** Build and launch iOS and Android development binaries, run Expo Doctor/peer checks, and verify a thin sign-in-to-dashboard journey with a real API response. Test physical iPhone networking, secure storage, keyboard, consistent light appearance under operating-system appearance changes, and navigation. Record any emulator-only Android evidence honestly.
- [ ] **M1.11** Record compatible versions, native prerequisites, a release-mode performance baseline, and agreed measurable budgets for startup, scrolling, and interaction. Separate UI timings from backend/network latency. Record package/license decisions and add optional images/fonts/materials only when a real screen needs them.

**Exit:** both platforms build; the public client bundles without server-only dependencies; themed controls, navigation, authenticated API access, and recovery states work. Mocked tests or a successful Metro export alone do not close this milestone.

### M2 — Deliver Mi liquidez and overhead control

**Goal:** cover all four problem-statement objectives before centering the app only on job simulation.

- [ ] **M2.1** Implement the dashboard from backend summaries: observed balance, source/cutoff, minimum balance, critical date, operating shortfall, protection gap, reserve target, and additional-expense capacity. Keep configured cushion distinct from calculated reserve and clearly label internal planning rather than bank-held funds.
- [ ] **M2.2** Render the supplied daily series in a bounded SVG forecast with a readable daily alternative. Show base versus collection-delay results as supplied by the API. Handle empty, flat, zero, and negative series without converting renderer coordinates into financial conclusions.
- [ ] **M2.3** Implement movement/account views and explicit banking refresh with FlashList, stable identities, bounded pagination, and separate refresh/fetch/source states. Retain the last complete response on failure with its original age; do not claim the phone communicates directly with Nessie.
- [ ] **M2.4** Implement authorized commitment creation, editing, cancellation, and recurring-entry controls supported by the contract. Show dates, paid/outstanding amounts, provenance, conditions, and editability. Leave recurrence expansion, permissions, and financial calculations to the backend.
- [ ] **M2.5** Implement category budgets, paid versus committed spending, and the permitted flexible-overhead adjustment. Review the intended change before submission; refresh the authoritative budget/cash impact afterward. Do not edit observed payments or non-negotiable obligations to make a scenario fit.
- [ ] **M2.6** Implement loading, empty, incomplete, offline, stale-source, replay, and provider-failure states across these screens. Missing data must not become zero. Refreshing an old snapshot must not relabel its source as current.
- [ ] **M2.7** Verify the reference opening-balance/reserve case, changed inputs, pagination, duplicate refreshes, exact amount/date rendering, inaccessible objects, and cache isolation. Capture a reviewed iPhone screen set and Android compatibility evidence for the completed slice.

**Exit:** income/expenses, 30-day liquidity, overhead control, and reserve needs are understandable using backend-owned values. The user can identify what is observed, what is pending, and when the source was last current.

### M3 — Deliver guided job evaluation and comparison

**Goal:** explain which obligation is affected, when, by how much, and under what permitted conditions.

- [ ] **M3.1** Implement a feature-owned React Hook Form journey for job collection, costs, dates, allowed advance amounts/dates, supplier schedules, fees, delivery conditions, and the defined collection-delay scenario. Use the API's bounds and Valibot resolver; retain draft state across steps and warn before discarding it.
- [ ] **M3.2** Validate amount/date adapters against the public policy. Preserve decimal strings, zero versus empty input, allowed precision, calendar dates, and explicit timezone semantics. Reject ambiguous notation instead of silently rounding or shifting a due date.
- [ ] **M3.3** Add input review and explicit evaluation submission. Separate field errors, missing critical data, network errors, and a valid but financially infeasible response. The app sends inputs; it never searches for an advance or computes supplier installments locally.
- [ ] **M3.4** Present original terms with affected obligations, dates, minimum balance, shortfall/protection gap, assumptions, horizon, and backend explanations. Keep financial outcome, pending conditions, validity, and provenance independently visible.
- [ ] **M3.5** Compare only the two permitted alternatives with amounts, dates, known costs, requirements, and remaining conditions. Make partial protection, insufficient information, infeasibility, and beyond-horizon effects explicit. Do not invent a third option, silently lower the cushion, or imply negotiation is already complete.
- [ ] **M3.6** Tie displayed evaluations to the submitted input and returned planning version. Changing the draft invalidates its prior result for confirmation. Cancel or disregard superseded responses, prevent duplicate submissions, and offer explicit recovery without using a stale result as the new answer.
- [ ] **M3.7** Test both alternatives, the capped-advance failure, collection delay, missing inputs, fixed obligations, and horizon limits. Repeat the journey with changed dates/amounts so screens cannot pass by selecting fixed fixture outputs. Validate keyboard focus, errors, and long financial explanations on both platforms.

**Exit:** a user can submit a changed job and understand the resulting alternatives and limitations. Selecting a comparison card does not register a decision; registration belongs to M4.

### M4 — Register decisions and handle subsequent changes safely

**Goal:** make the decision lifecycle correct under uncertainty, concurrent updates, and renewed sessions.

- [ ] **M4.1** Implement decision list/detail/history with explicit current/review-needed states, pending conditions, selected alternative, and original calculation provenance. Load records by validated identifiers rather than placing complete financial snapshots in navigation state.
- [ ] **M4.2** Add a separate registration review and confirmation action. Submit the server evaluation, allowed alternative, expected version, and contract-defined idempotency key. Before sending, securely persist the exact minimal recovery intent scoped to identity/business/environment. If persistence fails or exceeds supported storage limits, do not dispatch the confirmation.
- [ ] **M4.3** Prevent duplicate taps and coordinate conflicting local confirmations. Update success UI only after the API confirms registration; invalidate affected queries using authoritative versions. Registering a plan must not increase observed cash or claim conditions are fulfilled.
- [ ] **M4.4** Model timeout, cancellation, or process interruption after dispatch as an uncertain outcome. On recovery, validate the saved intent and current scope, then use documented lookup or an explicit same-key/same-content retry. Do not automatically replay on launch/reconnect, invent a new key for an unresolved operation, or equate cancellation with server rollback.
- [ ] **M4.5** Handle version/idempotency conflicts distinctly: obtain current state, request reevaluation where required, and ask for a fresh user decision on changed terms. Keep unresolved recovery discoverable; signing out must not cause the next user to replay someone else's intent.
- [ ] **M4.6** Implement permitted condition updates and reconciliation review/correction through existing API operations. Keep reconciliation UI owned by commitments and link it from decisions where needed. Partial receipts reduce pending money only as returned by the backend; they do not confirm unrelated commercial conditions.
- [ ] **M4.7** Implement reevaluation after refresh, reconciliation, date changes, and overhead/commitment edits, preserving historical results. Evaluate a second job against the new planning state without resending the first job as a duplicate commitment.
- [ ] **M4.8** Apply an explicit uncertain-outcome policy to every financial mutation, not only registration. For operations without documented idempotency, refetch/review state before another user action instead of blindly resending. Cover concurrent edits, unauthorized objects, late responses, offline rejection, logout, and relaunch in integration tests.

**Exit:** no client path reports success without evidence, duplicates registration through an automatic retry, conceals stale evaluations, or mixes sessions. The second-decision and delayed-collection journeys work against updated backend state.

### M5 — Verify and deliver the standalone demo

**Goal:** finish the complete device experience and document exactly what was verified.

- [ ] **M5.1** Automate the core native journeys with Maestro using synthetic credentials supplied securely, not committed fixtures: sign-in/liquidity, evaluate/register, and stale/uncertain-decision recovery. Combine device flows with targeted integration tests for failures that cannot be injected reliably through UI alone.
- [ ] **M5.2** Complete the accessibility and platform matrix: VoiceOver/TalkBack, font scaling, always-light rendering under both operating-system appearance settings, contrast, touch areas, long/negative amounts, keyboard/focus, native sheet dismissal, back gestures/system back, safe areas/edge-to-edge, reduced motion, and unavailable haptics. Record the actual device/OS and any untested combination.
- [ ] **M5.3** Measure the candidate in release mode against the M1 workload and budgets. Review startup, bounded list scrolling, chart interactions, renders, and bundle composition; fix observed problems without blanket memoization or unsupported performance claims.
- [ ] **M5.4** Review session/storage lifecycle, environment separation, cache isolation, redacted errors/logs/screenshots, uncertain writes, and absence of privileged dependencies or credentials in the mobile bundle. Keep observed security checks distinct from production certification.
- [ ] **M5.5** Run the complete applicable mobile quality gate and contract checks on the exact candidate. Extend CI coverage when implementation is authorized without dropping backend checks. Use frozen installs, reviewed action pins, and no secrets in untrusted PR jobs. Remote settings, publication, and merges remain separately authorized actions.
- [ ] **M5.6** Prepare the approved signed standalone iPhone build and the Android verification artifact. Install and cold-launch without Metro, verify the approved HTTPS API and session recovery, and record provisioning validity and installation instructions. Do not configure EAS, buy accounts, or submit to stores without corresponding authorization.
- [ ] **M5.7** Rehearse the complete demo sequence below, including a changed input and a failure case. Coordinate any controlled sandbox update through the approved backend/operator workflow; the app neither holds the Nessie key nor creates a deposit while simulating. Record live, stored, and replay evidence separately.
- [ ] **M5.8** Complete an English mobile README covering prerequisites, actual scripts, environment-variable names without secrets, development builds, testing, native regeneration, installation, supported targets, and known limitations. Attach the evidence inventory, unresolved decisions, and final candidate identifier. Perform Git delivery only if explicitly authorized, with verified personal identity and short English commits.

**Exit:** the standalone iPhone candidate completes the agreed journey, Android compatibility has recorded evidence, all critical correctness/security defects are closed, and the remaining limitations are explicit.

## 5. Screen ownership and public API mapping

This is a consumer mapping of the inspected generated client, not another route specification. Revalidate signatures against the handoff candidate before implementation. Query keys, form schemas, and feature components stay with the owner; shared controls remain in the design system.

| Feature        | Screens or behavior                                           | Existing public operation examples                                                                                                                                                 |
| -------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`         | Sign-in, restoration, sign-out, authorized business selection | `login`, `refreshSession`, `getSession`, `logout`, `listBusinesses`, `getBusiness`                                                                                                 |
| `liquidity`    | Overview, forecast, daily detail, movements, explicit refresh | `getDashboard`, `getForecast`, `getBankAccount`, `listBankMovements`, `refreshBanking`, `getLatestBankSyncRun`                                                                     |
| `commitments`  | Obligations, recurring entries, overhead, and reconciliation  | `listCommitments`, `createCommitment`, `updateCommitment`, `createRecurringCommitments`, `listBudgets`, `setBudget`, `adjustOverhead`, `reconcilePayment`, `correctReconciliation` |
| `job-planning` | Guided form, input review, original result, alternatives      | `evaluateJob`, `getEvaluation`                                                                                                                                                     |
| `decisions`    | Registration, list/detail/history, conditions, reevaluation   | `confirmDecision`, `listDecisions`, `getDecision`, `getDecisionHistory`, `updateDecisionCondition`, `reevaluateDecision`                                                           |

Consume one authorized demo business; business selection here means resolving the permitted context, not adding multi-business management. Use the [target structure](Mobile.md#4-target-structure), with descriptive files such as `job-form-screen.tsx`, `use-job-evaluation.ts`, and `alternative-card.tsx`. Add a directory only with a real implementation.

## 6. Acceptance and verification matrix

Backend tests prove financial rules; mobile tests prove exact presentation and safe interaction with those rules. Full-stack/device journeys prove their integration. Do not import backend functions into mobile tests to create the expected answer.

| Case                                                                         | Required mobile evidence                                                                                                                       | Milestone |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Reference opening balance 50,000; payroll 30,000; cushion 10,000             | Display returned reserve 40,000 and immediate additional-expense capacity 10,000, clearly distinguished from observed cash.                    | M2        |
| New job on original terms                                                    | Display minimum -20,000 and protection gap 30,000 for the reference inputs; a positive closing balance must not obscure the earlier shortfall. | M3        |
| Advance 30,000 before payroll                                                | Display returned minimum 10,000 and the reduced final collection; preserve pending agreement/receipt status.                                   | M3        |
| Advance capped at 20,000 with a fixed supplier payment                       | Display minimum 0 and insufficient cushion; no invented feasible alternative.                                                                  | M3        |
| Supplier installments of 10,000 and 30,000                                   | Display the returned dates, protected result under the reference assumptions, and required agreement/delivery conditions.                      | M3        |
| Changed amount/date and delayed collection                                   | Submit changed inputs, show the matching new backend result, and reject superseded evaluation responses.                                       | M3–M4     |
| Overhead adjustment, paid expense, recurring obligation                      | Show backend-updated budget and liquidity; do not double count or edit observed history.                                                       | M2–M4     |
| Decimal extremes, empty input, negative results, date/timezone boundaries    | Exact labels and request round-trips; no silent rounding, ambiguous separators, clipping, or shifted calendar dates.                           | M1–M3     |
| Partial/repeated/ambiguous reconciliation                                    | Show returned remaining amounts once, require review for ambiguity, and preserve matching history.                                             | M4        |
| Two decisions on one planning version                                        | Surface conflict, obtain current state, and require a new evaluation; no fake second success.                                                  | M4        |
| Lost response, duplicate taps, relaunch, expired session                     | Recover only the correct same-key intent or require review; no duplicate registration or cross-session replay.                                 | M1–M4     |
| Missing data, infeasible alternatives, effects after day 30                  | Visible reasons and horizon limitations, independent of successful HTTP transport.                                                             | M2–M4     |
| Offline, failed source refresh, stale data, labeled replay                   | Distinct availability/provenance states with original age; no automatic financial writes or false live claim.                                  | M1–M5     |
| Wrong business/object, logout with in-flight requests                        | Access errors without leaked values; previous-session data cannot repopulate the next session.                                                 | M1–M4     |
| Large text, screen reader, reduced motion, light appearance under OS changes | Complete readable journey on recorded iOS/Android targets; status and actions never depend only on color, motion, or haptics.                  | M1–M5     |
| Standalone cold launch without Metro                                         | Installed candidate reaches the approved API and completes the journey; it does not claim offline evaluation.                                  | M5        |

All numeric expectations above apply only to the [reference fixture](Idea.md#8-ejemplo-financiero-verificable). Use additional varied cases; never embed these outputs as production responses.

### Required quality layers

- **Static and policy:** strict typing, no explicit/implicit `any`, no authored index files or directory barrels, no unsafe escape hatches, and no server-only imports. Include screens, tests, scripts, and configuration.
- **Text and lint:** Prettier, Biome with warnings treated as failures, strict UTF-8 without BOM, LF/final newline, and authored CSS coverage compatible with the chosen styling syntax.
- **Unit/component:** exact formatting/adapters, typed controls, form validation, error states, theme behavior, session coordination, and query invalidation using the compatible native testing stack.
- **Integration:** generated-client HTTP behavior, cancellation/timeouts, token refresh races, cache isolation, write uncertainty, and version conflicts against controlled synthetic environments.
- **Native:** iOS/Android builds, device networking/storage, navigation/keyboard/gestures, accessibility, release measurements, and standalone installation. A JavaScript bundle is not a substitute for these checks.
- **Contract and CI:** generated-artifact drift, reviewed dependency versions, frozen installation, meaningful failing checks, and no secret-dependent live provider tests in normal PR verification.

Only add script names when their implementations exist. Existing root commands must be extended rather than presumed to include mobile. Record skipped checks and their impact; never report them as passing.

## 7. Demo and evidence handoff

Rehearse this sequence on the candidate iPhone build:

1. Sign in and explain the fictional business, selected source mode, and cutoff.
2. Show cash, upcoming obligations, overhead budget, and reserve needs.
3. Enter the new job and show the shortfall before collection.
4. Compare advance and supplier-installment alternatives with pending conditions.
5. Explicitly register a plan and inspect its decision record.
6. Refresh after the separately authorized controlled deposit, review reconciliation, and show the remaining amount and conditions.
7. Evaluate a second job with the first plan already included.
8. Change a date and show that the prior decision needs review, then reevaluate.
9. Change at least one input outside the reference script and demonstrate a clear failure or unavailable-source state.

The backend operator prepares and updates synthetic source data through approved tooling. Disclose those preparation steps; do not rely on hidden database edits. If live provider evidence is unavailable, demonstrate labeled backend replay and state that the live gate remains unfinished. Replay is not an undisclosed mobile-local financial engine.

Create evidence documents only when there is actual evidence to record. Suggested files under `docs/verification/` are `mobile-foundation.md`, `mobile-journey.md`, and `mobile-release.md`; none is created by this plan. Keep the existing `mobile-handoff.md` as the backend-to-mobile contract handoff, not a mobile release report.

Each evidence record contains the candidate revision or artifact hashes, dependency/toolchain versions, device/OS, environment/source mode, checks actually run and their results, sanitized screenshots or logs, and unresolved limitations. Installation artifacts and URLs must be real, approved, and free of signing material or credentials.

## 8. Definition of done and change control

- [ ] M0–M5 tasks are closed with evidence, or an explicitly approved scope change is recorded without concealing an unmet product requirement.
- [ ] All four problem-statement objectives, both alternatives, registration, reconciliation review, second-job evaluation, and stale-result recovery work through the public API.
- [ ] The backend remains the only financial authority; no privileged SDK, credential, or server module enters the app.
- [ ] The app preserves exact monetary/date semantics and independent financial, condition, validity, and source states.
- [ ] Required quality, integration, native, accessibility, and release checks pass for the exact candidate; critical correctness and isolation failures are resolved.
- [ ] The standalone iPhone installation and Android compatibility evidence exist, with actual supported targets and remaining limits documented.
- [ ] English setup/delivery documentation, Spanish UI copy, asset licenses, safe configuration instructions, and honest live/replay evidence are complete.

At execution time, track each task by its existing ID with owner, status (`not started`, `in progress`, `blocked`, or `done`), evidence, blocker if any, and next scoped action. Do not check a task because code exists or because a dependency installed successfully.

Keep architecture changes in `Mobile.md`, backend contract decisions with the backend owner, product changes in `Idea.md`, and execution progress here. Do not use this plan to overwrite concurrent work, alter SDK history, relax quality rules, or create unrequested repositories, commits, PRs, builds in paid services, or store submissions.

If time is constrained, defer custom fonts, decorative images, blur/gradients, and secondary motion before removing accessibility, write safety, financial correctness, overhead control, reserves, either required alternative, or Android verification. Any larger product reduction needs an explicit decision.

## 9. Initial execution decision — 2026-09-12

The user authorized mobile development, explicitly selected local development with synthetic data, and selected the iOS iPhone 17 simulator as the current test target. Provider verification and deployment remain deferred. This is a scoped entry decision for M0/M1; it does not close the full backend readiness gate or certify a standalone demo. Android compatibility remains an architecture requirement; Android device acceptance, signing, physical-device networking, and distribution are outside this first execution block.

The first slice establishes the Expo workspace, typed API transport, session lifecycle, shared controls, navigation, and an authenticated liquidity summary. M2–M5 remain subsequent milestones. Execution evidence and exact limitations are recorded in [mobile foundation](verification/mobile-foundation.md).

| Task      | Owner            | Status      | Evidence and next action                                                                                                                                                                                                                         |
| --------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0.1–M0.4 | Mobile / backend | done        | Workspace inspection, generated transport regressions, auth and uncertain-write policies in the handoff.                                                                                                                                         |
| M0.5      | Mobile / user    | in progress | iPhone 17 / iOS 26.5 simulator and local identifier selected; Android native target and release distribution deferred by the user.                                                                                                               |
| M0.6–M0.7 | Mobile           | done        | Visual brief and explicit local entry decision in foundation evidence; external backend gates remain open.                                                                                                                                       |
| M1.1–M1.4 | Mobile           | done        | Named Expo entry, pinned workspace dependencies, strict source coverage, and real HeroUI component test harness.                                                                                                                                 |
| M1.5–M1.6 | Mobile           | in progress | Shared themed controls and three destinations implemented; amount/date controls, dirty job forms, sheets, and complete accessibility acceptance remain.                                                                                          |
| M1.7–M1.9 | Mobile           | in progress | Validated public transport, secure session controller, scoped query cache, and failure regressions implemented; native lifecycle evidence is recorded separately.                                                                                |
| M1.10     | Mobile           | in progress | iPhone 17 build including the native splash plugin passed; startup/session gating is component-tested. Final visual and full native journey acceptance remain open; Android native and physical iPhone checks are deferred for this local block. |
| M1.11     | Mobile           | in progress | Exact versions and native prerequisites recorded; release measurements, performance budgets, and final package/license review remain.                                                                                                            |
| M2.1      | Mobile           | in progress | The initial liquidity presentation is being replaced after user review, including a chart of backend-provided opening and daily balances. Final hierarchy, chart tests, export, and device review remain pending.                                |
| M2.2–M5.8 | Mobile           | not started | Continue product implementation after foundation acceptance; README and CI scaffolding do not close the release tasks.                                                                                                                           |

## 10. Login and appearance revision — 2026-09-12

The user explicitly selected an always-light app and requested a more expressive login with the official Capital One logo, concise copy, and animation. The appearance decision in [Mobile.md](Mobile.md#theme-and-component-contracts) supersedes the previous system-selected light/dark proposal. Source artwork and its observed colors are documented in the [canonical asset README](../apps/mobile/assets/brand/README.md); the financial and authentication boundaries remain unchanged.

The implemented login behavior includes validation on blur/submission with error correction feedback, an initially hidden password with a show/hide action, email/password keyboard actions, accessible busy state, one pending authentication request, and password clearing after completion. The official logo, app-owned illustration, and animated startup are implemented. Native splash retention leads into session restoration and a destination-specific reveal; the [architecture](Mobile.md#startup-and-session-presentation) owns the 1,600/650 ms minimum intervals, 360 ms fade, and reduced-motion behavior.

The completed startup/login snapshot passed 73 tests in eight suites, including eight login and eight session-transition tests. A later source-policy snapshot passed for 143 first-party files and 35 virtual regression cases. The iPhone 17 build with the native splash plugin succeeded. These results replace the earlier blocked source-policy status; they do not certify subsequent liquidity changes or the final candidate.

The desktop lock interrupted the original visual pass; a later session partially observed the light login. Final layout/motion, native keyboard and focus, VoiceOver, Dynamic Type, system appearance/reduced-motion changes, and the authenticated journey still need complete recorded evidence. The user subsequently rejected the liquidity screen's hierarchy, so its replacement, backend-data chart, forthcoming regression tests, and final export remain in progress. Keep jobs and decisions labeled as placeholders. Record final totals, candidate identity, and visual acceptance in [mobile-login.md](verification/mobile-login.md). M1 and the native Android, physical iPhone, signing, and release gates remain open.
