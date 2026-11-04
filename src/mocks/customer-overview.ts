import type { CustomerOverviewResponse } from "@/services/customer-overview";
import type { DashboardScope } from "@/services/dashboard-response";

export function buildUnavailableCustomerOverview(scope: DashboardScope): CustomerOverviewResponse {
  return {
    data: {
      scope,
      status: "unavailable",
      customers: null,
      source: null,
      last_synced_at: null,
      message: "Customer reporting integration not connected.",
    },
  };
}
