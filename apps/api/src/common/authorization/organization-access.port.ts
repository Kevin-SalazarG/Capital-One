import type { Permission } from "./permission";

export const ORGANIZATION_ACCESS_PORT = Symbol("ORGANIZATION_ACCESS_PORT");

export interface OrganizationAccessPort {
  requirePermissions(
    userId: string,
    organizationId: string,
    accessToken: string,
    permissions: readonly Permission[],
  ): Promise<void>;
}
