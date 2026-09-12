"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { useSession } from "@/features/auth/session";
import type { Organization } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { ErrorView } from "@/components/feedback";
import { AppShell } from "@/components/layout/app-shell";

interface Workspace {
  organization: Organization;
  organizations: Organization[];
  email: string | null;
  userId?: string;
  basePath: string;
  demoData?: Record<string, unknown>;
}
const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({
  value,
  children,
}: {
  value: Workspace;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      <AppShell>{children}</AppShell>
    </WorkspaceContext.Provider>
  );
}

export function LiveWorkspace({
  organizationId,
  children,
}: {
  organizationId: string;
  children: React.ReactNode;
}) {
  const session = useSession();
  const organization = session.organizations.find(
    (item) => item.id === organizationId,
  );
  if (!organization)
    return (
      <main className="page-container">
        <ErrorView error={new ApiError("ORG_ACCESS_DENIED", 403)} />
      </main>
    );
  return (
    <WorkspaceProvider
      key={organizationId}
      value={{
        organization,
        organizations: session.organizations,
        email: session.user.email,
        userId: session.user.id,
        basePath: `/app/${organizationId}`,
      }}
    >
      {children}
    </WorkspaceProvider>
  );
}

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("WorkspaceProvider is required");
  return {
    ...workspace,
    isDemo: Boolean(workspace.demoData),
    can: (permission: string) =>
      workspace.organization.permissions.includes(permission),
  };
}

export function useResource<T>(
  resource: string,
  schema: z.ZodType<T>,
  enabled = true,
) {
  const { organization, demoData } = useWorkspace();
  return useQuery({
    queryKey: [
      "organization",
      organization.id,
      demoData ? "demo" : "live",
      resource,
    ],
    queryFn: ({ signal }) =>
      demoData
        ? Promise.resolve(
            schema.parse(demoData[resource.split("?")[0] ?? resource]),
          )
        : apiRequest(`/organizations/${organization.id}/${resource}`, schema, {
            signal,
          }),
    enabled,
  });
}
