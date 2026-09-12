# Mirror mobile

Initial local foundation for the Mirror synthetic-data MVP. The app calls `@mirror/api-client`; the NestJS backend owns all financial calculations. This version provides branded startup, sign-in, secure session restoration, three native navigation destinations, and an authenticated liquidity summary. The app always uses a light appearance, with the official logo and app-owned illustration documented in [the login record](../../docs/verification/mobile-login.md). Liquidity is undergoing a further presentation/chart revision; jobs and decisions remain labeled placeholders. Job capture, decision registration, full records/overhead screens, and their device acceptance remain pending in [Mobile-Plan.md](../../docs/Mobile-Plan.md).

## Prerequisites

Use Node 24.15.0 and pnpm 11.1.3 from the existing workspace. Local iOS development requires Xcode, CocoaPods, and the installed iPhone 17 simulator. The current target is iPhone 17 / iOS 26.5. Android remains supported by the architecture; an Android JavaScript export does not verify a native Android binary or device.

Install from the workspace root with `pnpm install --frozen-lockfile`. Native dependencies live in this package. There is one workspace lockfile. Expo uses `src/entry.ts` and `registerRootComponent`; Expo Router and first-party index files are not used.

## Run the local synthetic journey

1. From the workspace root, run `pnpm demo:mobile-api`. This starts a temporary, isolated PostgreSQL cluster, applies existing migrations, and serves the real Mirror API with synthetic Auth and replay banking on `http://127.0.0.1:3000`. It requires the PostgreSQL binaries used by the backend integration runner. Override `PG_BIN` if needed.
2. The runner writes randomized local sign-in credentials to `.local/mobile-demo-credentials.json` with owner-only permissions. Open that local file privately; never put its contents into source, screenshots, logs, or issue reports. Keep the runner active. It removes credentials and stops its temporary database when shut down normally.
3. In another terminal, run `pnpm --filter @mirror/mobile start` and keep it active. Metro serves the development build on IPv4 loopback, `http://127.0.0.1:8081`.
4. For the first native installation or after native dependency/configuration changes, run `pnpm --filter @mirror/mobile ios` in a third terminal. Expo generates the native project, compiles the simulator development build, reuses the running Metro server, and launches iPhone 17. Sign in using the current runner's credentials.
5. Once the development build is installed, subsequent sessions can use `pnpm --filter @mirror/mobile ios:dev` to start Metro and open the selected iOS simulator without rebuilding. If Metro is already running, press `i` in its terminal instead. Keep both the API and Metro active while using the app.

The start script combines Expo's [localhost hosting option](https://docs.expo.dev/more/expo-cli/#server-url) with Node's [IPv4-first DNS ordering](https://nodejs.org/download/release/v24.15.0/docs/api/cli.html#--dns-result-orderorder). Expo 57 advertises `127.0.0.1` for localhost but binds the resolved `localhost` address; preferring IPv4 prevents an IPv6-only listener from rejecting the advertised URL on this Mac. Invoking Expo's declared CLI binary through Node preserves other `NODE_OPTIONS`. A development-server connection error requires restoring Metro and reloading the app; it does not require a native rebuild.

The `ios` script also sets Expo's documented `EXPO_PACKAGER_PROXY_URL` to `http://127.0.0.1:8081`. `run:ios` has no localhost flag and otherwise generates a LAN launch URL even when reusing the local Metro server. This override keeps its simulator deep link on the same loopback address, including with `pnpm --filter @mirror/mobile ios --no-bundler`. These local iOS commands expect Metro on port 8081.

The local development default is loopback port 3000. `EXPO_PUBLIC_MIRROR_API_URL` may override it using an origin without `/v1`, credentials, query parameters, or fragments. Release JavaScript requires a configured HTTPS origin. Loopback HTTP is accepted only in development. `127.0.0.1` in an Android emulator or a physical phone does not address the development computer; the Android emulator's development origin is `http://10.0.2.2:3000`.

The local fixture is a test tool, not a production authentication mode. No public reset endpoint or direct provider access is introduced. Every fixture restart creates a new temporary identity and business, so credentials from the previous run will stop working.

## Dependency compatibility

The initial core versions are Expo 57.0.22, React Native 0.86.3, React/React DOM 19.2.3, HeroUI Native 1.0.9, and Uniwind 1.12.0. The [package manifest](package.json) and workspace lockfile own the complete version set. React DOM satisfies the selected tooling peers; this foundation has no web delivery target.

Two reviewed pnpm patches are tracked in [workspace configuration](../../pnpm-workspace.yaml):

- [Uniwind 1.12.0](../../patches/uniwind@1.12.0.patch) adds a typed Expo Metro configuration overload. Its runtime behavior is unchanged; the overload avoids unsafe casts in the maintained Metro configuration.
- [Expo Constants 57.0.18](../../patches/expo-constants@57.0.18.patch) quotes the iOS config-generation paths and project-root value so directories containing spaces can be passed correctly to the build script. Regenerate CocoaPods and verify the native build after changing this dependency or patch.

The app-owned [iOS bundle path plugin](plugins/with-ios-bundle-path.cjs) quotes the resolved React Native bundle-script path during native generation. It fails when the expected upstream phase changes, so Expo/React Native upgrades must review this transformation. `app.config.ts` registers the plugin as part of reproducible CNG configuration.

`expo-splash-screen` is a declared native dependency and config plugin. Its logo image and light background are generated into the native project; changing them requires rebuilding the development client. The iPhone 17 build with this plugin succeeded. This is separate from the final device journey and release acceptance.

Lucide icons use individual public `lucide-react-native/icons/*` exports. The [Jest configuration](jest.config.cjs) adds `.mjs` transformation through the installed public Babel packages, retaining Expo's source/asset transforms and the native Worklets resolver. It does not redirect icon imports to private CommonJS files or mock their rendering.

Reassess these patches during dependency upgrades and remove them when the corresponding upstream fixes are included. Keep shared versions and native peers compatible rather than suppressing peer errors.

## Commands and generated files

| Command                                  | Responsibility                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm --filter @mirror/mobile start`     | Metro on IPv4 loopback for the development build.                                         |
| `pnpm --filter @mirror/mobile ios`       | Generate/build/launch on iPhone 17.                                                       |
| `pnpm --filter @mirror/mobile ios:dev`   | Start Metro and open the installed build in the selected iOS simulator.                   |
| `pnpm --filter @mirror/mobile android`   | Native Android development build when a target is available.                              |
| `pnpm --filter @mirror/mobile typecheck` | Strict application and tooling TypeScript checks.                                         |
| `pnpm --filter @mirror/mobile test`      | Jest-expo unit and component tests.                                                       |
| `pnpm --filter @mirror/mobile build`     | iOS and Android JavaScript/Hermes exports, not standalone native binaries.                |
| `pnpm --filter @mirror/mobile doctor`    | Expo configuration/dependency checks.                                                     |
| `pnpm check`                             | Workspace checks, including backend, mobile, contracts, and isolated HTTP/database tests. |

`app.config.ts` and config plugins own native configuration. `ios/`, `android/`, `.expo/`, and `dist/` are reproducible generated output and excluded from authored-source checks. Do not hand-edit generated projects. Uniwind writes its generated theme declarations into `.expo/`; app typing imports the library's declared native style types directly. No signing material or cloud account is configured for this local simulator target.

The provider composes gesture handling, safe areas, keyboard control, HeroUI, Query, and session state once. CSS owns the semantic light palette; Expo configuration, React Native appearance, and Uniwind keep the app light independently of operating-system appearance. Native splash dismissal follows the first React layout, and the session transition reveals only the current ready destination. The [startup contract](../../docs/Mobile.md#startup-and-session-presentation) records the initial/subsequent timing parameters and reduced-motion behavior.

Access tokens stay in memory; the small refresh credential uses SecureStore. An uncertain rotation requires sign-in, and logout clears local state even if remote revocation cannot be confirmed. The financial cache is memory-only. No financial write queue or automatic mutation replay exists in this foundation.

## Verification limits

The [foundation record](../../docs/verification/mobile-foundation.md) preserves the initial candidate; [startup/login evidence](../../docs/verification/mobile-login.md) records the later implementation and remaining checks. The completed startup/login snapshot passed 73 tests in eight suites. Final totals, liquidity/chart regressions, exports, and visual acceptance remain pending while that screen changes.

The current slice does not claim live Supabase/Nessie integration, deployment, Android device acceptance, standalone launch without Metro, release performance measurements, or complete accessibility acceptance. Physical iPhone, VoiceOver, Dynamic Type, and complete on-device reduced-motion checks remain open. User-facing replay, source age, and planning limitations remain visible.
