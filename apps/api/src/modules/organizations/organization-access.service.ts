import { Inject, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { throwDatabaseError } from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import {
  roleHasPermission,
  type OrganizationRole,
  type Permission,
} from "../../common/authorization/permission";
import type { OrganizationAccessPort } from "../../common/authorization/organization-access.port";

function isOrganizationRole(value: string): value is OrganizationRole {
  return ["owner", "admin", "analyst", "viewer"].includes(value);
}

@Injectable()
export class OrganizationAccessService implements OrganizationAccessPort {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async requirePermissions(
    userId: string,
    organizationId: string,
    accessToken: string,
    permissions: readonly Permission[],
  ): Promise<void> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("organization_members")
      .select("role,status")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "check organization permissions");
    }

    if (
      data?.status !== "active" ||
      !data?.role ||
      !isOrganizationRole(data.role)
    ) {
      throw new AppError(
        "The user has no active membership in this organization",
        {
          code: "ORG_ACCESS_DENIED",
          status: 403,
        },
      );
    }

    const missingPermissions = permissions.filter(
      (permission) => !roleHasPermission(data.role, permission),
    );
    if (missingPermissions.length > 0) {
      throw new AppError(
        "The organization role does not grant the required permissions",
        {
          code: "FORBIDDEN",
          status: 403,
          details: {
            organizationId,
            role: data.role,
            missingPermissions,
          },
        },
      );
    }
  }
}
