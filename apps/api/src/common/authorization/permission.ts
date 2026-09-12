export type Permission =
  | "dashboard:read"
  | "organization:create"
  | "organization:read"
  | "organization:update"
  | "organization:delete"
  | "member:read"
  | "member:invite"
  | "member:update"
  | "member:remove"
  | "connection:read"
  | "connection:create"
  | "connection:sync"
  | "connection:update"
  | "connection:revoke"
  | "bank-account:read"
  | "bank-transaction:read"
  | "bank-transaction:reconcile"
  | "cfdi:read"
  | "cfdi:import"
  | "cfdi:update"
  | "cfdi:download"
  | "forecast:read"
  | "forecast:run"
  | "forecast:configure"
  | "liquidity-gap:read"
  | "liquidity-gap:update"
  | "recommendation:read"
  | "recommendation:update"
  | "audit:read";

export const ALL_PERMISSIONS: readonly Permission[] = [
  "dashboard:read",
  "organization:create",
  "organization:read",
  "organization:update",
  "organization:delete",
  "member:read",
  "member:invite",
  "member:update",
  "member:remove",
  "connection:read",
  "connection:create",
  "connection:sync",
  "connection:update",
  "connection:revoke",
  "bank-account:read",
  "bank-transaction:read",
  "bank-transaction:reconcile",
  "cfdi:read",
  "cfdi:import",
  "cfdi:update",
  "cfdi:download",
  "forecast:read",
  "forecast:run",
  "forecast:configure",
  "liquidity-gap:read",
  "liquidity-gap:update",
  "recommendation:read",
  "recommendation:update",
  "audit:read",
];

export const ROLE_PERMISSIONS: Readonly<
  Record<"owner" | "admin" | "analyst" | "viewer", readonly Permission[]>
> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter(
    (permission) =>
      permission !== "organization:delete" &&
      permission !== "connection:revoke",
  ),
  analyst: [
    "dashboard:read",
    "organization:read",
    "member:read",
    "connection:read",
    "bank-account:read",
    "bank-transaction:read",
    "cfdi:read",
    "forecast:read",
    "forecast:run",
    "forecast:configure",
    "liquidity-gap:read",
    "recommendation:read",
  ],
  viewer: [
    "dashboard:read",
    "organization:read",
    "forecast:read",
    "liquidity-gap:read",
    "recommendation:read",
  ],
};

export type OrganizationRole = keyof typeof ROLE_PERMISSIONS;

export function roleHasPermission(
  role: OrganizationRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
