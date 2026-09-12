import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import { MirrorClient } from "@mirror/api-client";
import type { MobileConfig } from "../config/mobile-config";
import { createQueryClient } from "../query/query-client";
import { createSessionController, type SessionController } from "../session/session-controller";
import { createSecureSessionStore } from "../session/secure-session-store";
import type { QueryClient } from "@tanstack/react-query";

export interface MobileRuntime {
  readonly client: MirrorClient;
  readonly session: SessionController;
  readonly queries: QueryClient;
  readonly config: MobileConfig;
}

export function createMobileRuntime(config: MobileConfig): MobileRuntime {
  const queries = createQueryClient({ allowLocalReads: config.localDevelopment });
  let session: SessionController | undefined;
  const client = new MirrorClient({
    baseUrl: config.apiUrl,
    accessToken: () => session?.getAccessToken(),
    timeoutMs: 20_000,
  });
  session = createSessionController({
    client,
    store: createSecureSessionStore(),
    environmentId: config.apiUrl,
    onIdentityChange: async () => {
      await queries.cancelQueries();
      queries.clear();
    },
  });
  return { client, session, queries, config };
}

const RuntimeContext = createContext<MobileRuntime | null>(null);

export function RuntimeProvider({
  runtime,
  children,
}: {
  readonly runtime: MobileRuntime;
  readonly children: ReactNode;
}): ReactElement {
  return <RuntimeContext value={runtime}>{children}</RuntimeContext>;
}

export function useMobileRuntime(): MobileRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error("RuntimeProvider is required");
  return runtime;
}
