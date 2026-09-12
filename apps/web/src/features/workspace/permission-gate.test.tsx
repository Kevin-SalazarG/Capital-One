import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PermissionGate } from "@/features/workspace/permission-gate";

const permissions = vi.hoisted(() => ({ allowed: false }));
vi.mock("@/features/workspace/workspace", () => ({
  useWorkspace: () => ({
    can: () => permissions.allowed,
    basePath: "/app/test",
    isDemo: false,
  }),
}));

describe("permission boundaries", () => {
  it("does not mount privileged children for a viewer", () => {
    permissions.allowed = false;
    const PrivilegedAction = vi.fn(() => (
      <button type="button">Privileged action</button>
    ));
    const html = renderToStaticMarkup(
      <PermissionGate permission="member:invite">
        <PrivilegedAction />
      </PermissionGate>,
    );
    expect(PrivilegedAction).not.toHaveBeenCalled();
    expect(html).toContain("Esta vista necesita otro acceso");
    expect(html).not.toContain("Privileged action");
  });
  it("renders authorized controls", () => {
    permissions.allowed = true;
    const html = renderToStaticMarkup(
      <PermissionGate permission="member:invite">
        <button type="button">Invitar persona</button>
      </PermissionGate>,
    );
    expect(html).toContain("Invitar persona");
  });
});
