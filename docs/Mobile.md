# Mirror Mobile Architecture

**Version:** 1.4  
**Date:** 2026-09-12  
**Status:** initial local foundation implemented; full native and product acceptance remain in progress.  
**Confirmed platform direction:** iPhone first, compatible with Android.  
**Scope:** the synthetic-data MVP defined in [Idea.md](Idea.md).

## 1. Purpose and boundaries

Build the mobile interface for understanding liquidity, evaluating a new job, and following registered decisions. Mobile captures input and presents backend results; it does not implement another financial engine.

[Backend.md](Backend.md) owns the API and financial architecture, [Code.md](Code.md) owns implementation standards, and [GitHub.md](GitHub.md) owns delivery rules. This document records the selected mobile architecture without changing product scope. The [backend readiness gate](Backend-Plan.md#7-definition-of-ready-for-mobile) retains its pending provider and hosted-HTTPS requirements.

[Mobile-Plan.md](Mobile-Plan.md) owns the detailed M0–M5 implementation tasks, dependencies, execution progress, and acceptance evidence. This document remains the source of truth for mobile architecture.

On 2026-09-12, the user authorized the initial implementation with local synthetic data and the iPhone 17 simulator. The scoped development target is iPhone 17 / iOS 26.5, using the existing Xcode toolchain and the local identifier `dev.mirror.local`. This entry decision permits the local foundation while external backend gates remain open; it does not certify live providers, physical-device delivery, Android native compatibility, or a signed standalone release.

The workspace now contains `apps/mobile/` alongside `apps/api/` and `packages/api-client/`. The initial slice implements session entry/restoration, native navigation destinations, shared controls, and an authenticated liquidity summary. Full job planning, decision registration, reconciliation, and records/overhead screens remain tasks in the implementation plan. The generated client supplies typed requests, runtime response validation, cancellation, deadlines, and structured errors; native integration evidence is recorded separately. Keep changes to its generator in the backend-owned workflow.

The mobile dependency boundary is:

```text
Screens and feature hooks
    → @mirror/api-client
    → Mirror REST API (HTTPS for release; loopback HTTP for local development)
    → backend-owned integrations and financial engine
```

No direct Nessie, database, or authentication-provider SDK belongs in the mobile bundle. Login, refresh, and logout go through Mirror's API. No public sign-up, social login, password recovery, payment execution, admin panel, or push notifications are added to this MVP.

## 2. Selected stack

| Area                      | Selection                                                                              | Responsibility                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Application               | React Native with Expo SDK 57                                                          | One TypeScript application for iOS and Android, using the SDK's compatible React, Hermes, and native module versions. |
| Build workflow            | Expo development builds and Continuous Native Generation                               | Native development and reproducible configuration; a standalone signed build for the demo.                            |
| Language                  | Strict TypeScript                                                                      | All safety requirements in `Code.md`; extend Expo's base configuration with bundler-compatible module resolution.     |
| Navigation                | React Navigation 7 with `@react-navigation/native-stack`                               | Explicit typed routes, native stacks, back gestures, and modal presentation.                                          |
| Main tabs                 | `react-native-bottom-tabs` and `@bottom-tabs/react-navigation`                         | Native iOS/Android tabs, subject to an early compatibility build.                                                     |
| Server state              | TanStack Query 5                                                                       | Queries, scoped caching, cancellation, invalidation, and loading/error states.                                        |
| API access                | Workspace package `@mirror/api-client`                                                 | Generated Mirror contracts and runtime-validated HTTP access; no second handwritten endpoint catalog.                 |
| Forms                     | React Hook Form 7, Valibot, and `@hookform/resolvers`                                  | Typed form state through the Valibot resolver and immediate input feedback. The backend validates again.              |
| Session storage           | `expo-secure-store`                                                                    | Persist the refresh credential and narrowly scoped recovery metadata; access tokens remain in memory.                 |
| Native startup            | `expo-splash-screen`                                                                   | Keep the branded native splash until the first app layout, then coordinate a verified session destination.            |
| Component system          | `heroui-native`                                                                        | The foundation for app-owned buttons, fields, surfaces, skeletons, and transient feedback.                            |
| Styling and themes        | `uniwind`, Tailwind CSS 4, `tailwind-variants`, and `tailwind-merge`                   | Semantic light tokens and reusable component variants; the app always uses a light appearance.                        |
| Motion and gestures       | `react-native-reanimated`, `react-native-worklets`, and `react-native-gesture-handler` | UI-kit dependencies and deliberate interactive motion, respecting reduced-motion settings.                            |
| Keyboard and safe areas   | `react-native-keyboard-controller` and `react-native-safe-area-context`                | Keyboard-aware forms, focused-field visibility, and system inset handling.                                            |
| Icons and feedback        | `lucide-react-native` and `expo-haptics`                                               | A consistent icon family and optional tactile feedback for explicit user actions.                                     |
| Images                    | `expo-image`, when an image-bearing screen is implemented                              | App-owned image rendering and cache policy; not a reason to add uploads or an image service.                          |
| Lists and chart           | `@shopify/flash-list` and `react-native-svg`                                           | Virtualized records and a bounded 30-day visualization of backend-provided values.                                    |
| Calendar and connectivity | `@react-native-community/datetimepicker`, `expo-network`, and React Native `AppState`  | Native date input, connectivity hints, and foreground refresh.                                                        |
| Operation IDs             | `expo-crypto`                                                                          | Random identifiers for explicitly idempotent user operations, not authentication or custom encryption.                |
| Tests                     | Jest with `jest-expo`, React Native Testing Library, and Maestro                       | Unit/component checks plus device-level journey verification.                                                         |
| Tooling                   | Existing pnpm workspace, Prettier, Biome, and TypeScript checks                        | Reuse the project quality policy without introducing a second formatter or lockfile.                                  |

### Version policy

The initial package pins are Expo 57.0.22, React Native 0.86.3, and React 19.2.3. Exact dependencies are owned by the [mobile manifest](../apps/mobile/package.json) and workspace lockfile. Preserve the SDK-compatible family when updating packages; a newer React release is not automatically supported by the selected Expo SDK. The initial selection incorporates the SDK 57 patch fixes identified during the architecture review. [Expo SDK 57](https://expo.dev/changelog/sdk-57).

Use the existing Node/pnpm toolchain where compatible, install Expo-managed packages through `expo install`, then record exact resolved versions and the workspace lockfile. A native build, peer-dependency check, and Expo Doctor must validate the combination before calling the stack verified. Keep Android compatibility checks in the first milestone, not at the end.

Treat the visual dependencies as a compatible set. The initial pins use HeroUI Native 1.0.9, Uniwind 1.12.0, Reanimated 4.5.1, Worklets 0.10.1, and Gesture Handler 2.32.0. Review package manifests and native compatibility tables together for upgrades; peer ranges alone do not prove a working build. The [mobile README](../apps/mobile/README.md#dependency-compatibility) records the reproducible Uniwind typing and Expo Constants path-quoting patches. They do not replace native verification. [Expo dependency updates](https://expo.dev/changelog/sdk-57), [Reanimated compatibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/).

### Why this combination

- React Native and Expo fit the TypeScript workspace and the two-platform requirement. The app reuses transport contracts, not server implementation code.
- React Navigation provides explicit route ownership without introducing file-based routing conventions. The app uses `src/entry.ts` with Expo's custom `main` entry and `registerRootComponent`. Expo Router is not required. [Custom Expo entry](https://docs.expo.dev/versions/latest/sdk/expo/#registerrootcomponentcomponent).
- The selected native tab library integrates with React Navigation and requires its config plugin and a development build. It is not available in Expo Go. Verify the selected stable versions together before implementing all screens. [Native tabs integration](https://oss.callstack.com/react-native-bottom-tabs/docs/guides/usage-with-react-navigation), [installation requirements](https://oss.callstack.com/react-native-bottom-tabs/docs/getting-started/quick-start).
- TanStack Query owns server state; React Hook Form owns the job draft; small React providers/reducers own session and UI state. Do not duplicate query results in Zustand, Redux, or a general global store. Add another state library only if a concrete need remains.
- Valibot is already used by the public API client. Use the supported form resolver, not an additional competing schema library. [Resolver documentation](https://github.com/react-hook-form/resolvers#valibot).

### Design and interaction layer

The visual foundation is **HeroUI Native with Uniwind and Tailwind CSS 4**, exposed through a small app-owned `design-system`. It provides a component baseline while leaving Mirror's information hierarchy, financial semantics, and visual identity under application ownership. HeroUI supports semantic themes through Uniwind; do not install NativeWind alongside it or combine multiple competing UI kits. [HeroUI theming](https://heroui.com/en/docs/native/getting-started/theming), [Uniwind setup](https://docs.uniwind.dev/quickstart).

Keep the manual package integration, existing workspace, and named Expo entry intact. Include required peers such as `tailwind-variants` and `tailwind-merge`. Import HeroUI through its documented component subpaths inside the design system. [HeroUI setup and granular exports](https://heroui.com/en/docs/native/getting-started/quick-start).

| Need                                                  | Selected treatment                                                          | Boundary                                                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buttons, surfaces, fields, loading, and brief notices | HeroUI Native behind named, typed app components.                           | Use the kit's skeleton/toast facilities; do not add separate competing packages for the same role.                                                  |
| Consistent color and density                          | Semantic CSS tokens, an always-light appearance, and component variants.    | Keep one token source; TypeScript types component props and variant choices, not arbitrary class strings.                                           |
| Focused fields and submit actions above the keyboard  | Keyboard Controller and one root `KeyboardProvider`.                        | Integrate with safe areas and native sheets; avoid nested keyboard-avoidance mechanisms.                                                            |
| Interactive motion                                    | Reanimated, matching Worklets, and Gesture Handler.                         | Prefer transform/opacity for custom motion; native navigation owns its own transitions.                                                             |
| Iconography                                           | Explicit Lucide icon imports, sized and colored through the design system.  | Reuse the existing SVG dependency; no dynamic import of the entire icon catalog.                                                                    |
| Tactile feedback                                      | An `expo-haptics` adapter for meaningful selections and confirmed outcomes. | Best effort only; unavailable haptics must never block an operation or communicate success alone.                                                   |
| Record detail and compact editors                     | Native-stack modal or `formSheet` presentation.                             | Do not add `@gorhom/bottom-sheet` unless a concrete interaction requires it. Avoid HeroUI presentations that require that optional peer until then. |
| Illustrations and other app images                    | `expo-image` when needed.                                                   | Define dimensions, accessibility, and appropriate cache behavior; keep credentials out of image URLs.                                               |

Keyboard Controller needs Reanimated and a native rebuild. Lucide uses `react-native-svg`, already selected for the forecast chart. Haptic availability varies by device and system state. These packages have distinct purposes but still require device verification. [Keyboard setup](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/installation), [Lucide React Native](https://lucide.dev/guide/react-native), [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/).

Keep `expo-font` conditional on a selected, licensed custom font; system fonts remain a valid initial choice. Treat `expo-blur` and `expo-linear-gradient` as optional visual treatments, with opaque/high-contrast fallbacks. They are not required for a polished interface. Do not add Skia, a full chart framework, Lottie, a local database, Redux/Zustand, analytics, or an error-monitoring service without a concrete requirement. No paid component template, animation asset, or cloud subscription is assumed.

## 3. Product navigation and screen ownership

User-facing copy starts in Spanish. Route names, source identifiers, and engineering documentation remain in English.

| Area            | Initial screens                                                                                          | What the user must understand                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Session         | Sign in, session restoration, unavailable business, sign out                                             | Whether the app has verified access; no embedded demo credentials.                                |
| Mi liquidez     | Liquidity overview, daily detail, movements, commitments, overhead budgets, permitted expense adjustment | Observed cash versus pending items, minimum balance, critical date, reserve target, and data age. |
| Evaluar trabajo | Guided job form, input review, original-terms result, alternative comparison                             | Which obligation is affected, when, by how much, and under what permitted conditions.             |
| Mis decisiones  | Decision list, detail, condition update, reevaluation                                                    | What was registered, what remains conditional, and whether the result needs review.               |

Use three native tabs for the three product areas, with a native stack per area where needed. Session screens live outside authenticated navigation. A decision-registration confirmation is an explicit step, not a side effect of selecting an alternative.

Keep the multi-step job draft inside one feature-owned form lifecycle. Warn before discarding unsaved input. Navigation parameters carry validated identifiers and small UI selections, not credentials, complete evaluations, or editable financial snapshots. Load authoritative records through the public client. Avoid duplicate screens when a shared commitment editor serves more than one flow.

This specifies information architecture. The approved appearance and login interaction contracts are recorded in [UI foundations](#8-ui-foundations-accessibility-and-performance); final screen composition remains subject to native review. The core experience remains forms and structured results, not a mandatory chat interface.

## 4. Target structure

The following tree describes intended responsibilities. Create a file or directory only when its implementation is needed; this document does not create empty scaffolding.

```text
apps/mobile/
├── app.config.ts
├── package.json
├── tsconfig.json
├── metro.config.cjs
├── jest.config.cjs
├── src/
│   ├── entry.ts
│   ├── app/
│   │   ├── app-root.tsx
│   │   └── app-providers.tsx
│   ├── navigation/
│   │   ├── root-navigator.tsx
│   │   ├── main-tabs.tsx
│   │   └── route-params.ts
│   ├── design-system/
│   │   ├── design-system-provider.tsx
│   │   ├── theme/
│   │   │   ├── global.css
│   │   │   ├── use-theme-colors.ts
│   │   │   └── motion.ts
│   │   ├── primitives/
│   │   │   ├── app-text.tsx
│   │   │   ├── button.tsx
│   │   │   ├── icon.tsx
│   │   │   └── surface.tsx
│   │   ├── forms/
│   │   │   ├── text-field.tsx
│   │   │   ├── amount-field.tsx
│   │   │   └── calendar-date-field.tsx
│   │   ├── feedback/
│   │   │   ├── inline-notice.tsx
│   │   │   ├── loading-skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── async-content.tsx
│   │   └── layout/
│   │       ├── screen.tsx
│   │       └── keyboard-screen.tsx
│   ├── platform/
│   │   ├── config/mobile-config.ts
│   │   ├── api/mirror-client.tsx
│   │   ├── api/api-error.ts
│   │   ├── query/query-client.ts
│   │   ├── query/app-lifecycle.ts
│   │   ├── session/session-controller.ts
│   │   ├── session/session-provider.tsx
│   │   ├── device/haptic-feedback.ts
│   │   └── storage/secure-session-store.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── screens/sign-in-screen.tsx
│   │   │   └── schemas/sign-in-form-schema.ts
│   │   ├── liquidity/
│   │   │   ├── screens/liquidity-screen.tsx
│   │   │   ├── components/liquidity-summary-card.tsx
│   │   │   ├── components/forecast-chart.tsx
│   │   │   ├── queries/liquidity-query-keys.ts
│   │   │   └── hooks/use-liquidity.ts
│   │   ├── commitments/
│   │   │   ├── screens/commitments-screen.tsx
│   │   │   ├── screens/overhead-screen.tsx
│   │   │   └── hooks/use-commitments.ts
│   │   ├── job-planning/
│   │   │   ├── screens/job-form-screen.tsx
│   │   │   ├── screens/alternatives-screen.tsx
│   │   │   ├── components/alternative-card.tsx
│   │   │   ├── schemas/job-form-schema.ts
│   │   │   ├── helpers/to-evaluation-input.ts
│   │   │   └── hooks/use-job-evaluation.ts
│   │   └── decisions/
│   │       ├── screens/decisions-screen.tsx
│   │       ├── screens/decision-detail-screen.tsx
│   │       ├── hooks/use-confirm-decision.ts
│   │       └── storage/pending-decision-store.ts
│   └── shared/
│       ├── copy/spanish-copy.ts
│       └── formatting/format-money.ts
├── .expo/                          # Generated and ignored
│   └── uniwind-types.d.ts
├── test/
│   ├── fixtures/
│   └── integration/
└── .maestro/
    ├── evaluate-job.yaml
    └── recover-stale-decision.yaml

packages/api-client/
└── src/client.ts                    Existing generated public entry
```

Unit/component tests sit beside their subjects. Feature-level query keys and additional screens are added beside their owners as the corresponding flows are built. Not every feature needs every subdirectory. Uniwind writes generated theme augmentation to `.expo/uniwind-types.d.ts`; the authored tsconfig imports the library's `uniwind/types` native style declarations. Generated declarations are not a place for unrelated types. Add `assets/images/` or `assets/fonts/` only with actual reviewed assets. `eas.json` is added only if an EAS build/distribution workflow is selected.

### Dependency rules

- `app` composes providers and navigation. It owns no financial policy.
- `navigation` connects screens and defines typed route parameters. It is not a feature barrel.
- `design-system` owns reusable visual primitives, form controls, feedback, layout, themes, and the UI-kit integration. It does not import features, financial contracts, session state, or API access.
- Features own their screens, forms, hooks, query keys, and UI-specific mappers. They use the public API package through the configured transport.
- `platform` owns session, HTTP setup, lifecycle, storage/device adapters, and configuration. It does not import feature screens.
- `shared` contains genuinely reused presentation transformations and common copy, not a second component library. It must not import features. Feature-specific copy stays with its feature; a second consumer, not a hypothetical future app, justifies extraction.
- Feature components may consume the design system, shared helpers, and platform adapters. Keep financial cards such as `liquidity-summary-card.tsx` and `alternative-card.tsx` in their features, not in generic UI folders.
- Wrap a third-party component only to enforce a real application contract: variants, accessibility, field errors, layout, or theme behavior. Do not create pass-through wrappers for every React Native primitive. Imports point to descriptive files, not a design-system barrel.
- Cross-feature coordination uses explicit hooks or operations. Do not reach into another feature's private state or copy a request, component, or validation rule.
- Native dependencies are declared in `apps/mobile/package.json`. `@mirror/api-client` remains platform-neutral and contains no React, native modules, Node-only runtime APIs, database, or Nessie imports.
- There are no authored index files, wildcard directory barrels, unsafe casts, or implicit/explicit `any`. Apply `Code.md` to screens, tests, generated public contracts, and configuration as well as source utilities.

Keep `apps/mobile` in the existing workspace. Do not create another workspace lockfile, move the SDK, or force incompatible versions through global overrides. The app composes Expo's Metro configuration with Uniwind, a named CSS entry, and the generated declaration path. Additional resolver changes require a reproduced problem. [Expo monorepos](https://docs.expo.dev/guides/monorepos/), [Uniwind configuration](https://docs.uniwind.dev/quickstart).

## 5. API integration and state ownership

`platform/api/mirror-client.tsx` configures the generated public client and runtime provider. It supplies the current session credential, cancellation, and reviewed request policy through the client's supported extension points. It must not duplicate endpoint definitions or deserialize responses with unchecked casts. If required capabilities are missing, change the backend-owned generator through its normal review path, not its generated output.

The [backend handoff](verification/mobile-handoff.md) records typed path/query/body arguments, authentication headers, `AbortSignal`, response validation, safe structured errors, and confirmation idempotency. Revalidate this contract when it changes. A generated method name alone is not evidence that its parameters or native transport work.

| State                                                   | Owner                                         | Lifetime                                                                                                |
| ------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Dashboard, movements, forecasts, evaluations, decisions | TanStack Query and backend response contracts | Scoped to API environment, authenticated session, business, resource, identifiers, and filters.         |
| Access token and authenticated identity                 | Session controller                            | Memory only; replace on successful refresh and clear on sign out.                                       |
| Refresh credential                                      | Secure session storage                        | Until logout, revocation, invalidation, or storage failure; never a source of authorization on its own. |
| Job draft and field errors                              | React Hook Form inside the job feature        | Current form journey; no background submission or automatic disk persistence.                           |
| Tabs, expanded rows, selected chart day                 | Local React state/navigation                  | UI lifecycle; do not duplicate backend values.                                                          |
| Uncertain confirmation intent                           | Decision-owned secure recovery store          | Until resolved or deliberately discarded; scoped to identity, business, and environment.                |

One root lifecycle adapter connects `AppState` and connectivity to Query's focus/online managers, with cleanup. Refresh active stale queries on foreground/reconnect. Connectivity is a hint, not proof the API can be reached. Network fetching state and backend financial validity are different concepts. [TanStack Query on React Native](https://tanstack.com/query/latest/docs/framework/react/react-native).

For the initial policy, allow at most one automatic extra attempt for eligible read failures; never retry authorization, validation, or version-conflict errors. Keep retry ownership in one layer and do not multiply transport retries by Query retries. The final timeouts and retryable statuses must match the backend handoff.

After a successful planning mutation or banking refresh, invalidate the affected business summaries, commitments, forecasts, evaluations, and decisions. Use returned planning-version metadata and refetch authoritative results. Do not optimistically increase observed cash, change reserves, or label a decision registered before the server confirms it.

## 6. Session security

Use a provisioned synthetic identity through Mirror's login endpoint. The local runner creates temporary randomized credentials in an owner-readable file outside source control; its synthetic Auth override remains confined to the testing fixture. Do not put a shared password, refresh token, Nessie key, provider key, or backend service credential in the app configuration. `EXPO_PUBLIC_MIRROR_API_URL` is public configuration; release configuration must point to an approved HTTPS environment.

- Persist the refresh credential through SecureStore, not AsyncStorage. Keep the access token in memory and validate restored data as `unknown` before use.
- Restore access through the backend. Stored identity and decoded token claims do not prove a current session or permission.
- Serialize refresh requests: concurrent callers wait on the same refresh attempt. Replace rotated credentials safely and reject late results from an older session generation.
- Do not blindly replay an old refresh token after an uncertain rotation. Follow the backend's documented recovery policy; require sign-in when recovery cannot be established safely.
- A confirmed invalid/revoked credential ends the session. A network failure shows an unavailable state instead of pretending the credential was rejected.
- Clear queries, drafts, recovery metadata, and in-flight responses when signing out or changing identity/environment. A late request must not populate the next user's cache.
- Attempt server logout, but clear local credentials even if it fails. Do not claim server revocation succeeded when only local sign-out is known.
- Handle SecureStore read/write failures explicitly. Store small values, not a full forecast or session-response blob. Test cold start, token rotation, device lock, reinstall behavior, and backup exclusions; biometric gating is not required for this MVP.

SecureStore provides encrypted local key-value storage, but platform payload limits and backup behavior still matter. Verify them with the actual iPhone and Android build. It is not a replacement for server-side session validation. [SecureStore documentation](https://docs.expo.dev/versions/latest/sdk/securestore/).

## 7. Financial presentation and write safety

### Money, dates, and outcome dimensions

Keep amounts as canonical decimal strings throughout form submission, query caches, and API contracts. Do not apply `parseFloat` to financial inputs or silently round excess precision. The amount field may normalize explicitly supported input notation, but must reject ambiguous separators and preserve zero versus an empty value. Reuse the public input constraints where available; UI schemas add form concerns, not a second financial rule set.

The money formatter preserves exact values and the backend's currency/scale policy. Numeric conversion for bounded chart coordinates is presentation only; labels come from the original decimal values. Do not derive reserves, required advances, feasibility, or protected capacity from chart coordinates.

The implemented liquidity overview leads with unconditional capacity and its date, keeping observed cash and the reserve target distinct. Provenance and freshness remain visible while detailed source assumptions live in a native sheet. Scenario charts plot returned daily closing balances as steps, with exact labels and a daily disclosure. The projected closing amount and the intraday minimum before receipts are separate measures; an intraday minimum must not be inserted into the daily-closing line. Consultation remains a read-only refetch.

Calendar due dates remain calendar dates interpreted in the business timezone. Do not display `new Date("YYYY-MM-DD")` as a device-local instant and accidentally shift the day. Synchronization/calculation timestamps are instants and are formatted separately. Native date-picker adapters must round-trip the intended calendar day. [Expo date picker](https://docs.expo.dev/versions/latest/sdk/date-time-picker/).

Every financial result must keep these independent dimensions visible:

- Financial outcome: coverage, protection gap, shortfall, insufficient data, or no feasible permitted alternative.
- Conditions: confirmed versus pending customer or supplier agreements.
- Validity: current versus review required according to the backend.
- Provenance and age: live sandbox, stored snapshot, unavailable source, or explicitly labeled replay; show cutoff and synchronization/calculation time.

A successful HTTP response can contain a financially infeasible result. A pending agreement can coexist with a shortfall. A recent cache fetch can still contain old source data. None of these should collapse into a single green status.

### Offline and uncertain operations

The initial cache is memory-only. While the app remains running, previously fetched data may remain visible with its age and an offline/stale label. After a cold start without connectivity, show unavailability instead of promising an offline dataset. Persistent financial caching and offline-first synchronization are outside the initial implementation.

Do not queue financial writes for automatic execution on reconnect. Explicitly reject offline submission and disable paused/persisted mutation replay; setting retry to zero alone is not sufficient evidence of this behavior.

For decision registration:

1. Require a current server-owned evaluation and an explicit user confirmation. Disable duplicate taps while the operation is pending.
2. Create one operation key and retain the exact minimal intent, including evaluation, alternative, and expected version, before dispatch. Its header/field names come from the published contract.
3. On success, show the returned decision and invalidate related queries. Registering a plan changes internal planning, not a bank account.
4. On timeout, cancellation, or process interruption after dispatch, label the outcome unknown. Cancellation does not prove the server rolled back.
5. Resolve through the documented status lookup or an explicit same-key/same-content retry. Never manufacture a new key for an unresolved operation or change its payload silently.
6. On a version conflict, refresh and request reevaluation. Do not automatically accept new conditions on the user's behalf.

If the app restarts with an unresolved intent, recover only after verifying the same identity/business/environment and compatible idempotency scope. If that cannot be established, require review rather than resubmitting blindly. Persisted recovery data is not a general offline write queue.

## 8. UI foundations, accessibility, and performance

### Theme and component contracts

`design-system/theme/global.css` owns semantic colors, typography roles, spacing, radii, and surface treatment through the supported theme mechanism. Avoid copying the same color palette into a second TypeScript token object. `use-theme-colors.ts` reads and narrows the required resolved variables for navigation and SVG props, including theme changes; it does not assert unverified values to be strings. Uniwind exposes a hook for CSS variable access. [Resolved theme variables](https://docs.uniwind.dev/api/use-css-variable).

On 2026-09-12, the user explicitly selected an **always-light app**. This decision supersedes the earlier system-selected light/dark proposal throughout the mobile plan. Application content, navigation, controls, and the native appearance configuration must remain light when the operating system switches appearance. There is no app dark-mode setting. The current implementation selects light in Expo configuration, React Native appearance, and Uniwind; native verification must confirm that they remain consistent.

Brand color is separate from outcome colors; a selected card is not automatically a successful financial result. Define typography for headings, body, captions, and readable monetary amounts, plus spacing, border, and focus conventions. Keep `StyleSheet` or inline styles for measured/dynamic native values where useful, not a parallel hard-coded theme.

The design-system provider owns kit settings and the shared feedback presentation. `app-providers.tsx` composes it with the required gesture, safe-area, keyboard, query, and session providers; mount global adapters once. Keep control variants narrow and typed. Text fields expose labels, hints, errors, disabled, and busy states consistently; job-specific schemas and form orchestration remain in the feature.

### Login identity and interaction

The local prototype uses the official Capital One logo and its observed wordmark/swoosh colors, with provenance in the [canonical asset README](../apps/mobile/assets/brand/README.md). Preserve the original vector geometry, aspect ratio, and fills. Those observed colors are not a complete corporate palette or evidence of product affiliation. Mirror remains the synthetic challenge prototype defined in `Idea.md`.

Keep entry copy concise: a sign-in heading, persistent `Correo electrónico` and `Contraseña` labels, and the `Entrar` action. Validate on field blur or submission; avoid showing errors during the first incomplete keystrokes. Once an error is visible, update it as the user corrects the value. Keep inline error announcements polite. Passwords start hidden, with accessible show/hide actions that preserve the entered value. The email keyboard action advances focus; the password action submits through the same validated handler as the button.

While authentication is pending, show `Entrando…`, preserve the accessible action name `Entrar`, expose busy/disabled state, and prevent another request from either input method. Clear the password after completion while preserving the email. A rejected login uses the safe message `Revisa tu correo y contraseña.`; provider details stay outside UI copy. The [login verification record](verification/mobile-login.md) distinguishes component evidence from native keyboard, focus, and accessibility acceptance.

The user also requested a richer visual composition and animation on 2026-09-12. The implemented login combines the canonical logo with an app-owned SVG illustration, layered surfaces, and animated field/action feedback. These treatments preserve the form interaction contracts. Final visual acceptance remains a device review rather than a conclusion from component tests.

### Startup and session presentation

The entry module retains the native splash through `expo-splash-screen`; the first root layout replaces it with the branded React loading view. Session restoration determines whether the app reveals sign-in or the authenticated workspace. A stored credential alone does not authorize that destination. The native splash plugin uses the logo asset and light canvas color in app configuration; changes to that configuration require a native rebuild.

With ordinary motion enabled, the initial transition requests a minimum display interval of 1,600 ms followed by a 360 ms fade. Later transitions to a new destination use 650 ms followed by the same fade. These intervals begin when the React transition mounts; slow restoration or authentication can extend the wait. They are animation parameters, not measured cold-start performance or a timeout that grants access. Reduced-motion behavior follows the system preference.

Keep child content mounted behind the transition while disabling its interaction and accessibility exposure until the matching destination is ready and revealed. Preserve the login draft during a pending or rejected attempt. Validate completion callbacks against the current session destination so an interrupted transition cannot reveal an obsolete scope. Refreshing the already revealed session scope does not repeat the opening overlay.

### Interaction and accessibility

Use the design system's screen layouts, labeled fields, amount/date inputs, status descriptions, and async states. Native back behavior, safe areas, keyboard handling, and unsaved-form protection are part of the first vertical slice. Prefer native-stack sheets for compact record detail and editors. The main multi-step job flow stays a screen journey rather than nested sheets. Test keyboard/sheet behavior on both platforms before adopting a presentation across the app.

The iPhone-first acceptance pass includes Dynamic Type, VoiceOver labels and reading order, adequate touch areas, high-contrast text, reduced motion, and no clipping of long or negative monetary values. Android must also pass TalkBack, system back, keyboard, and edge-to-edge checks. Status always includes text; charts provide a readable daily list and explanation, not color alone. A UI kit's defaults are a starting point, not accessibility certification. Verify the light appearance under both operating-system appearance settings, long Spanish labels, focus after validation failure, and icon-only actions on real devices.

Provide empty, loading, refreshing, offline, and failed states explicitly. Skeletons preserve layout but do not imply that missing financial data is zero. Brief feedback may use a toast, but decision outcomes, validation errors, pending conditions, and recovery actions remain visible in the screen. Success feedback follows a confirmed API result; neither an animation nor a haptic pulse can turn an uncertain response into success.

Use deliberate motion to establish hierarchy and clarify selection, expansion, and progress. Respect the system reduced-motion preference in custom animations and review the kit's animation configuration. Native navigation transitions should not be duplicated with custom Reanimated transitions. Expensive blur or animation must not reduce contrast or obscure critical amounts.

The implemented design-system provider reads React Native's reduced-motion preference and subscribes to changes, keeping motion disabled while the preference is unavailable. It disables HeroUI animations when reduction is enabled, and the branded loading indicator stops its continuous motion. Illustration and transition animations request Reanimated's system reduction behavior. Verify actual motion changes and screen-reader behavior on the candidate device before claiming acceptance.

### Assets and rendering

Use FlashList for scrolling records with stable item identities and pagination. Avoid an unbounded map inside a ScrollView. The forecast chart is a small SVG view with a fixed horizon; do not bundle a browser chart or WebView. Verify empty/all-equal/negative-value charts without deriving financial conclusions in the renderer. [FlashList](https://docs.expo.dev/versions/latest/sdk/flash-list/), [React Native SVG](https://docs.expo.dev/versions/latest/sdk/svg/).

Use `expo-image` for image-bearing UI and explicit imports for the icons actually used. If a licensed custom font is chosen, prefer Expo's font config plugin for build-time embedding rather than blocking startup on a remote font. No image-heavy onboarding or decorative asset download is required for this MVP. [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/), [Expo Font](https://docs.expo.dev/versions/latest/sdk/font/).

Measure startup, scrolling, render behavior, and bundle size in release builds before claiming performance improvements or adding memoization everywhere. Keep visual dependencies in the mobile app; neither the API client nor the backend acquires UI dependencies.

## 9. Builds and delivery

Develop with an Expo development build on iPhone and validate the same app on Android. For the demo, prepare a signed standalone build that launches without Metro. It still needs the Mirror backend; independence from the development server does not mean offline financial evaluation.

The authorized initial target is the local iPhone 17 simulator on iOS 26.5. The [mobile README](../apps/mobile/README.md#run-the-local-synthetic-journey) documents the isolated API runner and development-build commands. The simulator accepts loopback HTTP in development; release configuration still requires HTTPS. Simulator artifacts and JavaScript exports do not close physical-device, Android native, signing, or standalone-release acceptance.

Local iOS builds use Xcode and the available signing identity. EAS Build/internal distribution or TestFlight are options, not configured services or assumed entitlements. Confirm the actual iPhone/iOS version, signing method, provisioning validity, bundle identifier, installation path, and any account cost before choosing the delivery route. No store submission is required by this architecture. [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/).

Use separate development and demo API configuration. Never disable certificate verification to reach the backend. Test physical-device connectivity: `localhost` on the phone is not the development computer. Allow no release dependency on an undisclosed tunnel, a public reset endpoint, or hidden database edits.

Use app configuration and config plugins as the native configuration source. Under Continuous Native Generation, generated native directories can remain outside Git if fully reproducible; do not discard manually maintained native changes. Keep signing files, provisioning material, build artifacts, local environment values, and device logs out of the repository. Cloud builds, signing changes, publication, and GitHub mutations require explicit authorization.

## 10. Verification and implementation sequence

The milestone overview below is expanded into actionable checklists in [Mobile-Plan.md](Mobile-Plan.md#4-implementation-checklists). Record progress there rather than maintaining two execution trackers.

Jest with the compatible `jest-expo` preset and React Native Testing Library is implemented for the app; the backend keeps its own test stack. The [foundation evidence](verification/mobile-foundation.md) records actual checks and pending device work. Keep renderer/testing peers aligned with the selected versions. [Expo testing guidance](https://docs.expo.dev/develop/unit-testing/). Maestro remains the target for reproducible native journeys, without placing credentials in recorded fixtures. [Maestro](https://docs.maestro.dev/).

| Milestone        | Deliverable                                                                                                                                     | Exit evidence                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| M0: handoff      | Review backend readiness, public client, synthetic examples, auth, errors, and idempotency.                                                     | No missing contract is silently implemented as mobile business logic.                                                               |
| M1: foundation   | Named Expo entry, workspace integration, native navigation, HeroUI/Uniwind design system, keyboard/gesture setup, session, and quality tooling. | iOS/Android builds and Expo Doctor pass; peer versions align; native sheets, themed controls, sign-in, and restoration work.        |
| M2: liquidity    | Overview, daily detail, records, commitments, overhead, reserve, and source/freshness states.                                                   | Authoritative values are displayed correctly; loading, empty, offline, and provider-failure states are distinct.                    |
| M3: job planning | Guided form, original-terms result, and the two allowed alternatives.                                                                           | Changed inputs produce backend results; conditional, insufficient, and infeasible outcomes remain explicit.                         |
| M4: decisions    | Confirmation, conditions, reconciliation review where required, and reevaluation.                                                               | Duplicate taps, lost responses, relaunch, expired sessions, and version conflicts cannot create fake success or blind resubmission. |
| M5: demo         | Standalone iPhone build, Android compatibility pass, accessible journey, and failure rehearsal.                                                 | Complete flow works on the target device; replay and live sandbox evidence are clearly distinguished.                               |

The root quality gate now includes mobile application/tooling TypeScript, source-policy/no-index enforcement, UTF-8/LF including CSS and dependency patches, Prettier, Biome, component tests, JavaScript exports, and backend contract checks. Native build and device acceptance remain separate evidence. Generated CNG projects and build output have narrow exclusions; maintained mobile source, tests, and configuration stay checked.

Required regression cases include exact amount/date round-trips, schema rejection, session refresh concurrency, logout with late responses, cache isolation, no offline write replay, uncertain confirmation recovery, stale evaluations, pending conditions, incomplete data, and effects beyond day 30. Test form input with changed values; do not hard-code the reference financial outputs into screens. Native permission/storage/navigation tests are separate from mocked component tests.

Foundation acceptance also requires focused-field scrolling, keyboard dismissal, native-sheet gestures, consistent light appearance in navigation and SVG under operating-system appearance changes, font scaling, reduced motion, unavailable haptics, and screen-reader feedback. Check the actual bundle for server-only modules and accidental optional UI peers. Do not silence peer conflicts, type errors, or unsupported native dependencies to declare the visual stack complete.

## 11. Decisions still to confirm

- Identify the physical demo iPhone, supported release OS targets, signing access, and standalone installation method. The initial iPhone 17 / iOS 26.5 simulator target is confirmed.
- Complete Android native build/device verification and the remaining iOS accessibility, keyboard, storage, and release checks.
- Close authenticated provider and hosted-HTTPS gates before claiming the full integrated backend/mobile demo.
- Revalidate pinned packages and compatibility patches on both native platforms before closing M1.
- Refine the initial visual identity and finish the required screen journey while preserving financial semantics.

**Current deliverable:** an initial local mobile foundation under this architecture. [Mobile-Plan.md](Mobile-Plan.md) owns execution status; [mobile-foundation.md](verification/mobile-foundation.md) preserves the initial candidate evidence, and [mobile-login.md](verification/mobile-login.md) records the later login revision. Full product completion, signed distribution, physical-device acceptance, hosted services, and Git delivery are not implied by the local implementation.
