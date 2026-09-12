import type { AuthenticatedRequest } from "../../modules/auth/auth-guard.js";
import { requestIdentity } from "../../modules/auth/auth-guard.js";
import type { DatabaseScope } from "../database/database.service.js";
import { parseIdentifier } from "./http-schemas.js";

export function requestScope(request: AuthenticatedRequest, businessId: string): DatabaseScope {
  return { userId: requestIdentity(request).userId, businessId: parseIdentifier(businessId) };
}
