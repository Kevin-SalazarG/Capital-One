# Mobile login revision

**Date:** 2026-09-12  
**Status:** branded startup and login implemented, component tests passed, and the iOS build with native splash succeeded; final liquidity and device acceptance remain in progress.  
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

## Completed verification snapshots

The completed startup/login run used `./node_modules/.bin/jest --runInBand` from `apps/mobile` and passed **73 tests across eight suites**, without warnings. It includes eight [login component tests](../../apps/mobile/src/features/auth/sign-in-screen.test.tsx) and eight [session-transition tests](../../apps/mobile/src/navigation/session-transition.test.tsx). The liquidity replacement and its chart regressions follow this run; final totals and the candidate gate remain pending.

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

A subsequent global source-policy snapshot passed for **143 first-party source files and 35 virtual regression cases**, replacing the earlier blocked backend snapshot. This remains a point-in-time result while liquidity files are changing. The **iPhone 17 / iOS 26.5 build including the native splash plugin succeeded**. That build result does not establish a standalone launch, a complete authenticated device journey, or final visual acceptance.

The local `start` script runs Metro with localhost hosting and IPv4-first DNS. The `ios` script also sets `EXPO_PACKAGER_PROXY_URL=http://127.0.0.1:8081`, keeping the development-client launch on the same loopback address even when reusing Metro with `--no-bundler`. The [mobile README](../../apps/mobile/README.md#run-the-local-synthetic-journey) owns the complete startup commands. API and Metro must stay active for this local development build.

## Final native candidate verification

The original desktop-lock interruption is historical. A later desktop session partially observed the light login; the complete composition and motion review remains open. The user then requested a new liquidity hierarchy, so its replacement and backend-data chart must settle before final tests, exports, and visual acceptance. Jobs and decisions still show clearly labeled placeholders. Record the final results and sanitized evidence here before closing this pass:

- [ ] Final mobile type, source-policy, formatting, lint, test totals including the forthcoming chart regressions, and export results, with the global workspace gate status stated separately.
- [ ] Candidate source/artifact identity and the actual simulator build/launch result after required configuration changes.
- [ ] Final light composition, logo rendering, and appearance stability under both operating-system appearance settings.
- [ ] Native email-to-password focus, keyboard visibility/dismissal, password show/hide, validation, and pending submission feedback.
- [ ] VoiceOver reading order and announcements, large text, touch areas, contrast, and reduced-motion behavior on the candidate.
- [ ] Actual synthetic sign-in, visible authenticated liquidity, and relevant native session-restoration evidence, without credentials in screenshots or logs.

Animation presence, smoothness, reduced-motion handling, and VoiceOver behavior are not verified by the component tests above. Native Android, a physical iPhone, signing, standalone release installation, and release performance remain outside this local simulator pass. M1 stays in progress, and [Mobile-Plan.md](../Mobile-Plan.md#10-login-and-appearance-revision--2026-09-12) owns the broader remaining work.
