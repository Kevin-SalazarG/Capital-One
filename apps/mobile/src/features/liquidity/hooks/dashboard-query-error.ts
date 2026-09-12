import { MirrorApiError } from "@mirror/api-client";

export function deniesDashboardAccess(error: Error | null): boolean {
  return error instanceof MirrorApiError && (error.status === 401 || error.status === 403);
}

export function resolveDashboardError(
  businessError: Error | null,
  dashboardError: Error | null,
): Error | null {
  if (deniesDashboardAccess(businessError)) return businessError;
  if (deniesDashboardAccess(dashboardError)) return dashboardError;
  return businessError ?? dashboardError;
}
