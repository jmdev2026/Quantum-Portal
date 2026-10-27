import type { DashboardScope } from "@/services/dashboard-response";
import type { SecuritySeverityResponse } from "@/services/security-severity";

export function buildUnavailableSecuritySeverity(scope: DashboardScope): SecuritySeverityResponse {
  return {
    data: {
      scope,
      status: "unavailable",
      counts: null,
      total: null,
      source: null,
      last_synced_at: null,
      message: null,
    },
  };
}
