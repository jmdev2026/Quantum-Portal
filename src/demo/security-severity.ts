import type { DashboardScope } from "@/services/dashboard-response";
import type { SecuritySeverityResponse, SeverityCounts } from "@/services/security-severity";

// Fictional demonstration figures. Not Guardz findings, and never sent to or stored by any backend.
export const DEMO_SEVERITY_SOURCE = "Simulated demo data";

type DemoSeverity = { counts: SeverityCounts; total: number };

// Keyed by the IDs in src/mocks/customers.ts (Demo Customer A = 1, B = 2, C = 3).
export const DEMO_CUSTOMER_SEVERITY: ReadonlyMap<number, DemoSeverity> = new Map([
  [1, { counts: { critical: 1, high: 7, medium: 12, low: 4 }, total: 24 }],
  [2, { counts: { critical: 2, high: 9, medium: 16, low: 4 }, total: 31 }],
  [3, { counts: { critical: 1, high: 7, medium: 13, low: 4 }, total: 25 }],
]);

// Defined explicitly rather than summed in the browser.
export const DEMO_ALL_CUSTOMER_SEVERITY: DemoSeverity = {
  counts: { critical: 4, high: 23, medium: 41, low: 12 },
  total: 80,
};

// Unknown customers get an explicit error, never another customer's figures.
export function buildDemoSecuritySeverity(scope: DashboardScope): SecuritySeverityResponse {
  const fixture = scope.type === "all" ? DEMO_ALL_CUSTOMER_SEVERITY : DEMO_CUSTOMER_SEVERITY.get(scope.customer_id);
  if (!fixture) {
    return {
      data: {
        scope,
        status: "error",
        counts: null,
        total: null,
        source: DEMO_SEVERITY_SOURCE,
        last_synced_at: null,
        message: "No demonstration data exists for this customer.",
      },
    };
  }
  return {
    data: {
      scope,
      status: "ready",
      counts: { ...fixture.counts },
      total: fixture.total,
      source: DEMO_SEVERITY_SOURCE,
      last_synced_at: null,
      message: null,
    },
  };
}
