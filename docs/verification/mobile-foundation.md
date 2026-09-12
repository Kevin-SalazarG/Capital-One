# Mobile foundation

## Entry decision

On 2026-09-12, the user authorized the initial mobile implementation with local synthetic data and the iOS iPhone 17 simulator. The root workspace has no Git repository. The SDK retains its own repository; no Git delivery is included. Backend provider verification and hosted HTTPS remain open in [Backend-Plan.md](../Backend-Plan.md).

The installed toolchain is Node 24.15.0, pnpm 11.1.3, Xcode 26.6, CocoaPods, and an iPhone 17 simulator running iOS 26.5. Android SDK platforms 36/36.1 are present; this inspection is not an Android build or device test. The local application identifier `dev.mirror.local` is only for simulator development and claims no registered distribution identity.

This record preserves checks and artifact identities from the first foundation candidate. The later login and appearance revision is tracked in [mobile-login.md](mobile-login.md); the historical hashes and successful checks below do not identify or verify that changing candidate.

## Visual brief

Mirror uses Spanish labels, system typography, and tabular monetary figures, with brand actions separate from financial outcomes. The original brief proposed system-selected light/dark themes. On 2026-09-12, the user explicitly replaced that proposal with an always-light app and requested a richer login composition and animation. [Mobile.md](../Mobile.md#theme-and-component-contracts) owns the current appearance policy; the [canonical logo asset](../../apps/mobile/assets/brand/README.md) records official artwork and observed fills. CSS remains the owner of application colors.

Liquidity starts with observed cash and source/cutoff, then upcoming exposure, the reserve, and the configured cushion. Forms favor one column, persistent field labels, and a single explicit action. Decision results will show financial outcome, conditions, validity, and provenance separately. Rounded controls and selective surface grouping support touch and readability without turning every metric into an identical card. System fonts avoid unverified custom-font licensing and startup dependencies.

```text
Mirror                       Session
Mi liquidez
Source and cutoff
Observed cash
Minimum balance / critical date
Reserve needed / configured cushion
Pending and unavailable information
Liquidez | Evaluar trabajo | Decisiones
```

The initial block verifies the foundation, not completed job planning or decision registration. No fixture financial outputs are embedded in application screens.

## Implemented boundary

`apps/mobile` uses the named Expo entry, native stack/tabs, HeroUI controls, semantic CSS tokens, keyboard/safe-area providers, and exact decimal/calendar presentation. The subsequent appearance revision fixes the app to light. The sign-in form uses React Hook Form with Valibot and the public API request contract. The liquidity screen displays the authorized backend business and forecast; the other two destinations explicitly state that their features are still under development.

The generated public client now supports cancellation, bounded deadlines, redacted transport errors, and `Retry-After` metadata. The mobile cache is scoped to environment, user/session generation, and business. Access-denied responses suppress retained data. Read retries are bounded to one retry for selected transient failures, honor server delays, and exclude 429; mutations never retry automatically.

The access token exists only in memory. SecureStore holds the validated refresh credential, scoped to the API environment. Refresh calls are serialized, remove the previous credential before dispatch, and require sign-in after uncertain rotation. Session generation guards prevent late responses from changing another session. Unit tests cover these rules; native observations below establish the narrower simulator evidence.

The local runner starts the real Nest application against an isolated temporary PostgreSQL cluster with existing migrations. Authentication and banking data are synthetic fixtures. Randomized credentials remain in an owner-only `.local` file and are removed on normal shutdown. No shared environment, real payment, provider configuration, signing account, or Git operation is part of this work.

## Dependency candidate

The package manifest and workspace lockfile pin Expo 57.0.22, React Native 0.86.3, React 19.2.3, HeroUI Native 1.0.9, Uniwind 1.12.0, Tailwind CSS 4.3.3, Reanimated 4.5.1, Worklets 0.10.1, and Gesture Handler 2.32.0. Jest 29.7.0, jest-expo 57.0.5, React Native Testing Library 14.0.1, and test-renderer 1.2.0 provide the component harness.

The checked-in Uniwind patch preserves its upstream interface and adds an Expo Metro configuration overload. A scoped optional React type peer for HeroUI avoids conflicting nominal input ref types; scoped Expo tooling React DOM overrides match the app's React version. The Expo Constants patch quotes paths in the pod script. The app-owned [iOS bundle path plugin](../../apps/mobile/plugins/with-ios-bundle-path.cjs) quotes the resolved React Native executable during CNG and rejects an unexpected upstream script. These fixes address observed type and native failures without unsafe casts, dependency source edits, or handwritten generated native projects.

## Initial candidate verification

| Check                                | Result                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK `check`                          | Passed, including 84 tests and package verification; SDK Git status remains clean.                                                                         |
| API build and unit tests             | Passed; 59 unit tests.                                                                                                                                     |
| Mobile Jest                          | Passed; 60 tests across 7 suites, including real HeroUI control/form interactions. Native layout and SecureStore adapters are isolated in component tests. |
| Isolated PostgreSQL/HTTP integration | Passed; 87 tests across 10 files, including public-client transport and lost confirmation response recovery.                                               |
| UTF-8/LF and source policy           | Passed; 187 maintained text files, 131 first-party source files, and 35 virtual policy regression cases.                                                   |
| Prettier, TypeScript, Biome          | Passed for the complete workspace coverage, including mobile CJS tooling/plugin; lint warnings are errors.                                                 |
| API client build and contract drift  | Passed; generated OpenAPI and public client match their generator.                                                                                         |
| Mobile JavaScript/Hermes export      | Passed for iOS (1,897 modules) and Android (1,895 modules), approximately 5.3 MB per bundle. These are not native release binaries.                        |
| Expo Doctor / peer validation        | 21/21 checks passed; `pnpm peers check` reported no conflicts.                                                                                             |
| CNG bundle-path plugin               | Prebuild passed; a real Xcode-project probe verified idempotence and execution when both Node and bundle-script paths contain spaces.                      |

All steps of `pnpm check` passed across the initial run and the resumed final gate. An initial formatting failure was fixed before the final gate; successful unaffected SDK checks were retained rather than repeated. Native verification is separate below.

Two initial iOS build attempts failed on upstream shell scripts that split the workspace path at the space in `Capital One`: first Expo Constants, then the app bundle script. Both corrections are reproducible from maintained configuration. The final `expo run:ios --device 'iPhone 17' --no-bundler` completed successfully with zero errors. Expo installed `dev.mirror.local` on the iPhone 17 / iOS 26.5 simulator and issued its development-client launch. Two upstream warnings remained: duplicate `-lc++` linking and a development-launcher script without output dependencies.

The initial visual journey was interrupted when the Mac locked and computer-use automation could not unlock it. A later desktop session partially observed the light login. That observation does not close final login layout/motion review, successful sign-in, the visible dashboard, or native session restoration. Current progress and remaining device checks belong to [the login revision record](mobile-login.md).

A byte scan of all 28 exported files found neither the current synthetic email nor password. This targeted check complements source import policy and does not claim a complete binary security audit.

## Initial candidate identity

There is no root Git revision. These SHA-256 values identify the original foundation snapshot, before the subsequent login, artwork, and appearance changes:

| Artifact                                       | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm-lock.yaml`                               | `a3ea1455486b7800f607c9a17f5ee59f870fe099331b8610b7083536d5039b2d` |
| `apps/mobile/package.json`                     | `270e4c6ed6ccd240d63b1b2bf051cb0231dbb87b9ffa414c6ed5b24db604afd5` |
| `apps/mobile/app.config.ts`                    | `33bd5a3e82bffde343f91aed8321e7cacaae0082bfb4075136eb1e7afccabb8f` |
| `apps/mobile/plugins/with-ios-bundle-path.cjs` | `3aaebdf307596d88ed365f39627724d5b6ad5829027b9a7756a0d99ca369ceda` |
| Mobile source aggregate (37 files)             | `c1aa2f8226c3c9a8c3249e494c8ca2fb3dd3383c0d7f10438743b7a5019328ac` |
| `apps/api/openapi.json`                        | `d96c2ddf97f742c986f3db2c503bbcdd4a25482eb2142e995682be732bf402ee` |
| `packages/api-client/src/client.ts`            | `0b718b75c6b2926e435f1f7dc60aa7a96c844b732284e68460a9262591299100` |
| `apps/api/scripts/serve-mobile-fixture.ts`     | `10f3b0e6c97315ee58fe471d65d4d456ffda347d4e1a5e88cd103f90c79a6385` |
| `scripts/run-integration.ts`                   | `4c366a15e07d975362afd3ae3bff5897b8617bcee0b8f2347b759521642ac031` |

The source aggregate hashes the UTF-8 manifest of all files recursively under `apps/mobile/src`, sorted by repository-relative path, with one `path sha256` line per file and a final LF. It includes tests and excludes generated native/build output. Public-contract ownership and remaining provider evidence are in the [backend handoff](mobile-handoff.md).

The simulator executable SHA-256 is `7dc9e13066fb9ba1cd08eb6cbc2114dd75f3a4d29cd54f736363652cb4a1df26`; its debug dylib SHA-256 is `317a02266cbcb62f12a12564c409199a8406790dcaad6963c243664f4315d31c`. These identify the local Debug simulator build, whose JavaScript is supplied by Metro, not a signed standalone release.

## Remaining acceptance

M0 and M1 are only partially closed at the milestone level. The selected current target is the iPhone 17 simulator; native Android, a physical iPhone, signing, and standalone installation are deferred. An Android JavaScript export is not native Android acceptance. Release performance, complete accessibility and large-text coverage, native sheets/dirty-form dismissal, amount/date controls, and full package/license review remain open.

M2 still needs records, commitments, overhead, the full dashboard, and source-refresh interactions. M3/M4 job evaluation, alternatives, registration/recovery, decisions, and reconciliation have not been implemented in mobile. External provider verification and hosted HTTPS remain backend gates. The current development build requires Metro and the running local fixture API.
