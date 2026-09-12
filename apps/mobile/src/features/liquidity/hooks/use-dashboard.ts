import { useQuery } from "@tanstack/react-query";
import type { GetDashboardResult } from "@mirror/api-client";
import { useMobileRuntime } from "../../../platform/api/mirror-client";
import { useSession } from "../../../platform/session/session-provider";
import { deniesDashboardAccess, resolveDashboardError } from "./dashboard-query-error";

export class MissingDemoBusinessError extends Error {
  constructor() {
    super(
      "No hay un único negocio autorizado para esta demo. Revisa la identidad sintética preparada para la prueba.",
    );
    this.name = "MissingDemoBusinessError";
  }
}

export interface DashboardQueryState {
  readonly data: GetDashboardResult | undefined;
  readonly error: Error | null;
  readonly isError: boolean;
  readonly isPending: boolean;
  readonly isFetching: boolean;
  readonly fetchStatus: "fetching" | "paused" | "idle";
  readonly refetch: () => Promise<void>;
}

export function useDashboard(): DashboardQueryState {
  const { client } = useMobileRuntime();
  const { session, controller } = useSession();
  const scopeKey = session.status === "authenticated" ? session.scopeKey : "signed-out";
  const businessQuery = useQuery({
    queryKey: [scopeKey, "authorized-demo-business"],
    enabled: session.status === "authenticated",
    queryFn: async ({ signal }) => {
      try {
        await controller.ensureAccess(scopeKey);
        const businesses = await client.listBusinesses({ signal });
        const business = businesses[0];
        if (!business || businesses.length !== 1) throw new MissingDemoBusinessError();
        return business;
      } catch (error: unknown) {
        await controller.rejectInvalidAccess(error, scopeKey);
        throw error;
      }
    },
  });
  const business = businessQuery.data;
  const dashboardQuery = useQuery({
    queryKey: [scopeKey, business?.id ?? "unresolved", "dashboard"],
    enabled: session.status === "authenticated" && business !== undefined && !businessQuery.isError,
    queryFn: async ({ signal }) => {
      if (!business) throw new MissingDemoBusinessError();
      try {
        await controller.ensureAccess(scopeKey);
        return await client.getDashboard(business.id, {}, { signal });
      } catch (error: unknown) {
        await controller.rejectInvalidAccess(error, scopeKey);
        throw error;
      }
    },
  });
  const error = resolveDashboardError(businessQuery.error, dashboardQuery.error);
  const isFetching = businessQuery.isFetching || dashboardQuery.isFetching;
  return {
    data:
      deniesDashboardAccess(error) || error instanceof MissingDemoBusinessError
        ? undefined
        : dashboardQuery.data,
    error,
    isError: error !== null,
    isPending: error === null && (businessQuery.isPending || dashboardQuery.isPending),
    isFetching,
    fetchStatus: isFetching
      ? "fetching"
      : businessQuery.fetchStatus === "paused" || dashboardQuery.fetchStatus === "paused"
        ? "paused"
        : "idle",
    refetch: async () => {
      const refreshedBusiness = await businessQuery.refetch();
      if (!refreshedBusiness.error && refreshedBusiness.data?.id === business?.id)
        await dashboardQuery.refetch();
    },
  };
}
