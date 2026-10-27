import type { DashboardScope } from "@/services/dashboard-response";
import type { SecurityCoverageResponse } from "@/services/security-coverage";

export function buildUnavailableSecurityCoverage(scope: DashboardScope): SecurityCoverageResponse {
  return {
    data: {
      scope,
      status: "unavailable",
      coverage_percentage: null,
      coverage_basis: null,
      controls: null,
      source: null,
      last_synced_at: null,
      message: null,
    },
  };
}
