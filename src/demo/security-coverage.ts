import type { DashboardScope } from "@/services/dashboard-response";
import type { ControlStatus, SecurityControlKey, SecurityCoverageResponse } from "@/services/security-coverage";

// Fictional demonstration figures. Not Guardz data, and never sent to or stored by any backend.
export const DEMO_COVERAGE_SOURCE = "Simulated demo data";
export const DEMO_COVERAGE_BASIS =
  "Fictional demonstration indicator only. Not measured from any provider, not derived from the control statuses, and not a verified security rating.";

type DemoCoverage = { percentage: number; controls: Record<SecurityControlKey, ControlStatus> };

// Keyed by the IDs in src/mocks/customers.ts (Demo Customer A = 1, B = 2, C = 3).
export const DEMO_CUSTOMER_COVERAGE: ReadonlyMap<number, DemoCoverage> = new Map([
  [
    1,
    {
      percentage: 88,
      controls: {
        mdr: "covered",
        itdr: "covered",
        external_footprint_scan: "covered",
        dark_web_monitoring: "covered",
        email_protection: "covered",
        endpoint_security: "covered",
        cloud_data_protection: "covered",
        security_awareness_training: "covered",
        phishing_simulations: "needs_attention",
      },
    },
  ],
  [
    2,
    {
      percentage: 61,
      controls: {
        mdr: "covered",
        itdr: "needs_attention",
        external_footprint_scan: "needs_attention",
        dark_web_monitoring: "needs_attention",
        email_protection: "covered",
        endpoint_security: "covered",
        cloud_data_protection: "unknown",
        security_awareness_training: "needs_attention",
        phishing_simulations: "needs_attention",
      },
    },
  ],
  [
    3,
    {
      percentage: 70,
      controls: {
        mdr: "covered",
        itdr: "needs_attention",
        external_footprint_scan: "unknown",
        dark_web_monitoring: "covered",
        email_protection: "covered",
        endpoint_security: "covered",
        cloud_data_protection: "unknown",
        security_awareness_training: "needs_attention",
        phishing_simulations: "needs_attention",
      },
    },
  ],
]);

// Defined explicitly rather than computed in the browser.
export const DEMO_ALL_CUSTOMER_COVERAGE: DemoCoverage = {
  percentage: 73.5,
  controls: {
    mdr: "covered",
    itdr: "needs_attention",
    external_footprint_scan: "unknown",
    dark_web_monitoring: "needs_attention",
    email_protection: "covered",
    endpoint_security: "covered",
    cloud_data_protection: "unknown",
    security_awareness_training: "needs_attention",
    phishing_simulations: "needs_attention",
  },
};

// Unknown customers get an explicit error, never another customer's figures.
export function buildDemoSecurityCoverage(scope: DashboardScope): SecurityCoverageResponse {
  const fixture = scope.type === "all" ? DEMO_ALL_CUSTOMER_COVERAGE : DEMO_CUSTOMER_COVERAGE.get(scope.customer_id);
  if (!fixture) {
    return {
      data: {
        scope,
        status: "error",
        coverage_percentage: null,
        coverage_basis: null,
        controls: null,
        source: DEMO_COVERAGE_SOURCE,
        last_synced_at: null,
        message: "No demonstration data exists for this customer.",
      },
    };
  }
  return {
    data: {
      scope,
      status: "ready",
      coverage_percentage: fixture.percentage,
      coverage_basis: DEMO_COVERAGE_BASIS,
      controls: Object.entries(fixture.controls).map(([key, status]) => ({ key: key as SecurityControlKey, status })),
      source: DEMO_COVERAGE_SOURCE,
      last_synced_at: null,
      message: null,
    },
  };
}
