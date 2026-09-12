# Mobile interface revision

**Date:** 2026-09-12  
**Status:** startup, login, and liquidity revision implemented; 92 mobile tests and the mobile static/export gates passed. Native simulator composition and selected interactions observed; the complete device acceptance matrix remains open.  
**Target:** local synthetic API, iPhone 17 simulator, iOS 26.5, `dev.mirror.local`.

## Approved direction

The user explicitly selected an always-light app and requested a more expressive login with the official Capital One logo, concise copy, and animation. [Mobile.md](../Mobile.md#theme-and-component-contracts) owns the decision, which supersedes the earlier system-selected light/dark proposal. The current implementation selects light in Expo configuration, React Native appearance, and Uniwind. Operating-system appearance changes must not introduce dark app content or controls.

The [canonical asset README](../../apps/mobile/assets/brand/README.md) records the logo extracted from [Capital One's official homepage](https://www.capitalone.com/), including its original geometry, aspect ratio, provenance, and checksum. Its observed fills are `#013D5B` for the wordmark and `#CC2427` for the swoosh. They describe the source artwork, not a complete corporate palette. Preserve the canonical SVG when adapting native rendering; illustration must not replace or redraw the logo.

The implemented composition uses the canonical logo, a separate app-owned SVG illustration, layered surfaces, and animated input/action feedback. Startup reveals usable content after layout and session readiness. The [initial foundation record](mobile-foundation.md) retains its original checks and hashes; those values do not identify this later candidate.

## Implemented startup and motion

The `expo-splash-screen` config plugin uses a light canvas and logo image. The entry module prevents automatic splash dismissal; the first React root layout hides the native splash once the branded loading view is present. Restoration then reveals either sign-in or the authenticated workspace according to the real session controller, including stored-credential validation and backend refresh.

With ordinary motion enabled, the initial React transition requests a minimum 1,600 ms display interval and a 360 ms fade. Subsequent transitions to a new destination use 650 ms and the same fade. The interval is measured from transition mount; waiting for authentication or restoration may take longer. These are configured animation parameters, not observed cold-start measurements or a fixed two-second network timeout.

The transition keeps its child subtree mounted and disables interaction/accessibility exposure while covered. A rejected attempt preserves the login draft. A newly authenticated scope stays covered until the matching reveal callback completes; stale callbacks are checked against the current session destination. Refreshing the already revealed scope does not repeat the opening overlay.

Reduced-motion handling is implemented. The design-system provider reads and subscribes to React Native's preference, defaults to disabled motion while that value is unavailable, and disables HeroUI animations when requested. The continuous loading indicator stops under reduction; illustration springs, transition delays, and fades use Reanimated's system reduction setting. Actual on-device reduction, animation smoothness, and screen-reader behavior still require review.

## Implemented interaction contract

The screen presents a short sign-in heading, persistent `Correo electrónico` and `Contraseña` labels, and the `Entrar` action. It uses the existing React Hook Form, Valibot, public API request contract, and session controller. It adds no registration, password recovery, provider SDK, or financial logic.

- Initial incomplete typing stays free of validation errors. Blur or submission validates the field; an existing error updates as its value is corrected. Inline errors expose polite live announcements.
- Password entry starts hidden. `Mostrar contraseña` and `Ocultar contraseña` preserve its value and expose an accessible action name.
- Email uses its matching keyboard and a next action that advances focus. Password uses a go action that submits through the same validated handler as the button.
- Pending authentication shows `Entrando…` while preserving `Entrar` as the accessible action name. Busy/disabled state and a submission guard prevent another pending request through either input method.
- Authentication completion clears the password and preserves the email. A rejected login shows `Revisa tu correo y contraseña.` without provider response details.

Apple's [Entering data guidance](https://developer.apple.com/design/human-interface-guidelines/entering-data) supports secure entry for sensitive input. Its [Text fields guidance](https://developer.apple.com/design/human-interface-guidelines/text-fields) recommends matching the keyboard to the expected content and validating email when the user moves to another field. The local login applies blur validation to its existing credential fields; it is not a password-creation flow.

NN/G's [mobile login checklist](https://www.nngroup.com/articles/checklist-registration-login/) recommends masking a login password initially while offering a way to reveal it. These references inform the interaction choices; they do not establish that this implementation has passed accessibility or usability testing.

## Liquidity presentation

The overview leads with the backend's unconditional capacity for new expenses and its capacity date. Observed cash and the reserve target are separate secondary values, with the original cutoff, source label, and stale/failed-source warning still visible. The screen does not infer that capacity equals observed cash minus the reserve, mark the reserve as bank-held money, or replace unavailable amounts with zero.

The forecast presents the returned base and delayed-collection scenarios through a segmented control. Its projected closing amount is distinct from the minimum balance before receipts. A stepped daily-closing graph uses exact decimal labels, a light area gradient, bounded pixel coordinates, and an endpoint marker. Its shape comes entirely from backend daily balances; the intraday minimum is not inserted into the closing series. Zero is labeled when inside the displayed range, and a constant series remains visibly constant. The daily disclosure exposes the original dated amounts and respects reduced motion in its chevron/entrance feedback.

The native details sheet contains provenance, source age, reserve/cushion/protection gap, conditional-cash limitations, and the evaluated horizon. The main screen retains the relevant warning and conditional projection label. The consultation action only refetches the authorized business/dashboard reads. It neither synchronizes the bank nor sends a financial mutation. Jobs and decisions share the light visual language and remain explicitly labeled placeholders.

## Completed verification

The final run used `./node_modules/.bin/jest --runInBand` from `apps/mobile` and passed **92 tests across ten suites**, without warnings or pending handles. It includes eight [login component tests](../../apps/mobile/src/features/auth/sign-in-screen.test.tsx), eight [session-transition tests](../../apps/mobile/src/navigation/session-transition.test.tsx), ten [chart tests](../../apps/mobile/src/features/liquidity/forecast-trend.test.tsx), and nine [liquidity integration tests](../../apps/mobile/src/features/liquidity/liquidity-screen.test.tsx).

| Covered behavior                            | Observed result                                                                                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid submission from button and keyboard | Both paths reject invalid values before calling login; correcting values updates errors.                                                                                   |
| Initial typing, blur, and correction        | Errors stay absent while initially typing, appear after blur with polite live-region metadata, and clear when corrected.                                                   |
| Password visibility                         | Password starts hidden; show/hide preserves the entered value.                                                                                                             |
| Keyboard contract                           | Email advertises next/submit and does not authenticate; password advertises go/blur-and-submit.                                                                            |
| Pending submission from button and keyboard | Each initial path sends the exact entered values once; repeated submissions stay blocked while pending.                                                                    |
| Completion and rejected access              | Password clears, email remains, busy state resolves, and provider details stay out of the safe 401 message.                                                                |
| Startup and layout                          | Restoration, layout, and matching transition completion are all required before exposing the destination.                                                                  |
| Session changes and interrupted callbacks   | The draft survives pending/rejected login; invalid resolved session data does not reveal authenticated content, and stale callbacks cannot reveal an obsolete destination. |
| Already revealed session refresh            | The workspace remains exposed without a repeated opening overlay while the same scope refreshes.                                                                           |

Form tests use real HeroUI controls, Lucide icons, React Hook Form, Valibot, and session coordination. Lucide imports use individual public icon subpaths; Jest transforms their `.mjs` sources with Babel while preserving Expo's existing JavaScript/TypeScript and asset transforms. No private CommonJS icon path or icon mock is used. Native keyboard/safe-area layout and SecureStore are isolated in the form harness. The transition harness uses the real session controller/provider, a synthetic stateful child, a controlled `BrandTransition` completion boundary, and mocked native splash dismissal; it does not simulate Reanimated physics or native navigation. Inert CSS variables permit component execution and do not validate rendered colors, native storage, or screen-reader output.

The liquidity harness retains the real generated client, session controller, TanStack Query, chart, and modal with a typed synthetic HTTP transport. It verifies distinct returned amounts, insufficient information, stale/failed-source disclosure, scenario selection, native-sheet dismissal callbacks, read-only retry, and logout. It does not validate native gesture physics or backend financial rules through these synthetic responses.

The final global source-policy check passed for **144 first-party source files and 35 virtual regression cases**. The encoding check passed for **198 maintained text files**. Mobile source/tooling TypeScript, mobile Biome with warnings as errors, mobile Prettier, and **Expo Doctor 21/21** passed. The iOS and Android exports each produced a roughly **5.4 MB** Hermes bundle; the previous custom-theme-variable warnings are resolved. Export emitted only the terminal environment's `NO_COLOR`/`FORCE_COLOR` warning. The complete backend/SDK root `check` command was not rerun for this UI change; these results do not claim a fresh complete workspace gate. The SDK working tree remained clean.

The **iPhone 17 / iOS 26.5 build including the native splash plugin succeeded** with zero errors and two native build warnings. Subsequent UI-only changes were loaded by Metro into that installed development build. Native Android and standalone release builds were not run.

The local `start` script runs Metro with localhost hosting and IPv4-first DNS. The `ios` script also sets `EXPO_PACKAGER_PROXY_URL=http://127.0.0.1:8081`, keeping the development-client launch on the same loopback address even when reusing Metro with `--no-bundler`. The [mobile README](../../apps/mobile/README.md#run-the-local-synthetic-journey) owns the complete startup commands. API and Metro must stay active for this local development build.

## Candidate identity and native observations

Final export artifacts under `.local/mobile-export/`:

| Artifact                                             | SHA-256                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| iOS `entry-5c1fb0b1d42e0aadcdceedddb0379439.hbc`     | `c4eff2b801bf86357c92fe7726d4f407e7801bec96432db14359df5899fdd400` |
| Android `entry-6e8f0dfbf1535c3da325e039a6658c5f.hbc` | `b51db98ff2abfa750876550e2e535d68a9e34c268fe36a355521424c2db48ce2` |
| `liquidity-screen.tsx`                               | `64beb801ccda5fbfb7b61f150e509fb46ae7447ef45b0545ca2a9fdac4c4916d` |
| `forecast-trend.tsx`                                 | `596bc4296ee95cc645c5fcff827f213168cbfc43ca92c76e351b992bde953082` |

These export hashes identify the generated bundles, not a signed application or a Git commit. The installed development build obtains current JavaScript from Metro.

The simulator showed the revised capacity overview and forecast, switched between the real returned scenarios, and opened/closed the native details sheet. Cold launch restored the existing synthetic authenticated session. The native logo splash and subsequent React illustration/logo transition were captured separately; development-client download UI can appear before React loads. These observations establish the rendered states, not release startup timing or animation smoothness. The Expo tools button was hidden through its developer-menu preference so it no longer obscures product content.

Sanitized local evidence includes `.local/liquidity-forecast-preview.png`, `.local/liquidity-overview-preview.png`, `.local/mobile-startup-transition.png`, and `.local/mobile-brand-transition.png`. The later desktop lock prevented finishing the interactive daily-disclosure and broader native acceptance pass; command-line simulator screenshots remained available. No credentials are included in these images.

The PR includes a sanitized [before screenshot](mobile-forecast-before.png) supplied in the design feedback and an [after screenshot](mobile-forecast-after.png) captured from the iPhone 17 simulator. Both contain synthetic financial data only. The floating gear visible in the earlier image belongs to the development client; it is hidden in the later capture.

## Remaining device acceptance

The original foundation checks and their hashes remain historical. Current native evidence is limited to the observations above; do not close the complete acceptance matrix from static screenshots or component tests:

- [x] Final mobile types, source-policy, formatting, lint, 92 tests, Doctor, and iOS/Android exports; complete workspace gate status stated separately.
- [x] Candidate source/artifact identity and actual simulator build/launch result after required configuration changes.
- [ ] Final light composition, logo rendering, and appearance stability under both operating-system appearance settings.
- [ ] Native email-to-password focus, keyboard visibility/dismissal, password show/hide, validation, and pending submission feedback.
- [ ] VoiceOver reading order and announcements, large text, touch areas, contrast, and reduced-motion behavior on the candidate.
- [x] Visible authenticated synthetic liquidity and native session restoration, without credentials in evidence.
- [ ] Fresh sign-in and daily-disclosure native interaction after the final composition changes.

Animation presence, smoothness, reduced-motion handling, and VoiceOver behavior are not verified by the component tests above. Native Android, a physical iPhone, signing, standalone release installation, and release performance remain outside this local simulator pass. M1 stays in progress, and [Mobile-Plan.md](../Mobile-Plan.md#10-login-and-appearance-revision--2026-09-12) owns the broader remaining work.
