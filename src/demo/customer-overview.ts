import { customersResponse } from "@/mocks/customers";
import type { CustomerOverviewResponse, CustomerPortfolioResource, ReportingStatus } from "@/services/customer-overview";
import type { DashboardScope } from "@/services/dashboard-response";

// "available" means a demonstration fixture exists for that panel, not that Guardz or Datto is connected or that the customer is protected.
export const DEMO_OVERVIEW_SOURCE = "Simulated demo data";

type DemoReporting = { security: ReportingStatus; backup: ReportingStatus };

// Keyed by the IDs in src/mocks/customers.ts (Demo Customer A = 1, B = 2, C = 3).
export const DEMO_CUSTOMER_REPORTING: ReadonlyMap<number, DemoReporting> = new Map([
  [1, { security: "available", backup: "available" }],
  [2, { security: "available", backup: "available" }],
  [3, { security: "available", backup: "available" }],
]);

export const DEMO_ALL_CUSTOMER_IDS: readonly number[] = [1, 2, 3];

// Names come from the canonical customer list so the portfolio always matches the customer selector.
function demoRecord(id: number): CustomerPortfolioResource | null {
  const customer = customersResponse.data.find((entry) => entry.id === id);
  const reporting = DEMO_CUSTOMER_REPORTING.get(id);
  if (!customer || !reporting) return null;
  return {
    id: customer.id,
    name: customer.name,
    security_reporting: reporting.security,
    backup_reporting: reporting.backup,
    last_synced_at: null,
  };
}

// Unknown customers get an explicit error, never another customer's record.
export function buildDemoCustomerOverview(scope: DashboardScope): CustomerOverviewResponse {
  const records = (scope.type === "all" ? DEMO_ALL_CUSTOMER_IDS : [scope.customer_id]).map(demoRecord);
  if (records.some((record) => record === null)) {
    return {
      data: {
        scope,
        status: "error",
        customers: null,
        source: DEMO_OVERVIEW_SOURCE,
        last_synced_at: null,
        message: "No demonstration data exists for this customer.",
      },
    };
  }
  return {
    data: {
      scope,
      status: "ready",
      customers: records as CustomerPortfolioResource[],
      source: DEMO_OVERVIEW_SOURCE,
      last_synced_at: null,
      message: null,
    },
  };
}
