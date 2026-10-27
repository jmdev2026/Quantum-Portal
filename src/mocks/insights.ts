import type { DashboardScope } from "@/services/dashboard-response";
import type { InsightsResponse } from "@/services/insights";

export function buildUnavailableInsights(scope: DashboardScope): InsightsResponse {
  return {
    data: {
      scope,
      status: "unavailable",
      insights: null,
      source: null,
      last_synced_at: null,
      message: null,
    },
  };
}
