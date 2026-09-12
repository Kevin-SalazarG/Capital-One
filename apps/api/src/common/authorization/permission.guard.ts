import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AppError } from "../errors/app-error";
import { REQUIRED_PERMISSIONS_KEY } from "./require-permissions.decorator";
import {
  ORGANIZATION_ACCESS_PORT,
  type OrganizationAccessPort,
} from "./organization-access.port";
import type { Permission } from "./permission";
import type { AuthenticatedRequest } from "../auth/request-context";

interface OrganizationRouteParams {
  readonly organizationId?: string;
  readonly organizationID?: string;
  readonly orgId?: string;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  public constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(ORGANIZATION_ACCESS_PORT)
    private readonly organizationAccess: OrganizationAccessPort,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      readonly Permission[]
    >(REQUIRED_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const organizationId = this.readOrganizationId(
      request.params as OrganizationRouteParams,
    );
    if (!request.user || !request.accessToken || !organizationId) {
      throw new AppError("Organization access context is incomplete", {
        code: "FORBIDDEN",
        status: 403,
      });
    }

    await this.organizationAccess.requirePermissions(
      request.user.id,
      organizationId,
      request.accessToken,
      requiredPermissions,
    );
    return true;
  }

  private readOrganizationId(
    params: OrganizationRouteParams,
  ): string | undefined {
    return params.organizationId ?? params.organizationID ?? params.orgId;
  }
}
