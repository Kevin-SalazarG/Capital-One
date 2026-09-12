import { roleHasPermission } from "./permission";

describe("organization permissions", () => {
  it("keeps viewer read-only", () => {
    expect(roleHasPermission("viewer", "dashboard:read")).toBe(true);
    expect(roleHasPermission("viewer", "bank-account:read")).toBe(false);
    expect(roleHasPermission("viewer", "forecast:run")).toBe(false);
  });

  it("allows analysts to run forecasts without managing connections", () => {
    expect(roleHasPermission("analyst", "forecast:run")).toBe(true);
    expect(roleHasPermission("analyst", "forecast:configure")).toBe(true);
    expect(roleHasPermission("analyst", "connection:sync")).toBe(false);
  });

  it("keeps organization deletion exclusive to the owner", () => {
    expect(roleHasPermission("owner", "organization:delete")).toBe(true);
    expect(roleHasPermission("admin", "organization:delete")).toBe(false);
  });

  it("keeps connection revocation exclusive to the owner", () => {
    expect(roleHasPermission("owner", "connection:revoke")).toBe(true);
    expect(roleHasPermission("admin", "connection:revoke")).toBe(false);
  });
});
