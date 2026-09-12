"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import { type Session, meSchema } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/errors";
import { ErrorView, LoadingView } from "@/components/feedback";

const SessionContext = createContext<Session | null>(null);

export function SessionBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: ({ signal }) => apiRequest("/me", meSchema, { signal }),
  });
  useEffect(() => {
    function expireSession() {
      void client.cancelQueries();
      client.clear();
      router.replace("/auth/sign-in");
    }
    window.addEventListener("colchon:session-expired", expireSession);
    return () =>
      window.removeEventListener("colchon:session-expired", expireSession);
  }, [client, router]);
  useEffect(() => {
    if (session.error instanceof ApiError && session.error.status === 401)
      router.replace("/auth/sign-in");
  }, [session.error, router]);
  if (
    session.isPending ||
    (session.error instanceof ApiError && session.error.status === 401)
  )
    return <LoadingView />;
  if (!session.data || session.isError)
    return (
      <main className="page-container">
        <ErrorView error={session.error} retry={() => void session.refetch()} />
      </main>
    );
  return (
    <SessionContext.Provider value={session.data}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionBoundary is required");
  return session;
}

export function OrganizationRedirect() {
  const { organizations } = useSession();
  const router = useRouter();
  useEffect(() => {
    router.replace(
      organizations[0] ? `/app/${organizations[0].id}/dashboard` : "/app/new",
    );
  }, [organizations, router]);
  return <LoadingView />;
}
