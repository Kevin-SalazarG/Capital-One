import { SetMetadata } from "@nestjs/common";

import type { Permission } from "./permission";

export const REQUIRED_PERMISSIONS_KEY = "colchon:required-permissions";

export const RequirePermissions = (
  ...permissions: readonly Permission[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
