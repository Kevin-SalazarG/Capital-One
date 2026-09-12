import { describe, expect, it } from "@jest/globals";
import { MirrorApiError, MirrorTransportError } from "@mirror/api-client";
import { resolveDashboardError } from "./dashboard-query-error";

describe("dashboard access errors", () => {
  it("does not let a business network failure hide revoked dashboard access", () => {
    const networkError = new MirrorTransportError("NETWORK_ERROR");
    const forbidden = new MirrorApiError(403, "FORBIDDEN", "synthetic-request", "redacted");
    expect(resolveDashboardError(networkError, forbidden)).toBe(forbidden);
    expect(resolveDashboardError(forbidden, networkError)).toBe(forbidden);
  });

  it("prioritizes a confirmed invalid session over a missing-business or timeout error", () => {
    const unauthorized = new MirrorApiError(401, "UNAUTHORIZED", "synthetic-request", "redacted");
    expect(resolveDashboardError(new Error("No authorized business."), unauthorized)).toBe(
      unauthorized,
    );
    expect(resolveDashboardError(unauthorized, new MirrorTransportError("REQUEST_TIMEOUT"))).toBe(
      unauthorized,
    );
  });

  it("preserves useful missing-business and availability failures when access was not denied", () => {
    const missingBusiness = new Error("No authorized business.");
    const unavailable = new MirrorTransportError("NETWORK_ERROR");
    expect(resolveDashboardError(missingBusiness, unavailable)).toBe(missingBusiness);
    expect(resolveDashboardError(null, unavailable)).toBe(unavailable);
    expect(resolveDashboardError(null, null)).toBeNull();
  });
});
