import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactElement, ReactNode } from "react";
import type { SessionController, SessionState } from "./session-controller";

const SessionContext = createContext<SessionController | null>(null);

export interface SessionProviderProps {
  readonly controller: SessionController;
  readonly children: ReactNode;
}

export function SessionProvider({ controller, children }: SessionProviderProps): ReactElement {
  useEffect(() => {
    void controller.restore();
  }, [controller]);
  return <SessionContext value={controller}>{children}</SessionContext>;
}

export interface SessionContextValue {
  readonly controller: SessionController;
  readonly session: SessionState;
}

export function useSession(): SessionContextValue {
  const controller = useContext(SessionContext);
  if (!controller) throw new Error("SessionProvider is required.");
  const session = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return { controller, session };
}
