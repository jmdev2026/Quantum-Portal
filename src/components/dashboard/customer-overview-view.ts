import type { CustomerView } from "@/components/customer-view/customer-view-state";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  getCustomerOverview,
  getDemoCustomerOverview,
  type CustomerOverviewResponse,
  type CustomerOverviewState,
} from "@/services/customer-overview";

export type OverviewMode = CustomerView["mode"];
export type LoadedOverview = { mode: DashboardMode; customerId: number | null; state: CustomerOverviewState };

export const overviewMode = (customerId: number | null): OverviewMode => (customerId === null ? "all" : "customer");

// Layout follows the selected view, never the number of records returned.
export const portfolioLayout = (mode: OverviewMode) => (mode === "customer" ? "detail" : "list");

export const customerOverviewSource = (mode: DashboardMode): ((scope: DashboardScope) => Promise<CustomerOverviewResponse>) =>
  mode === "demo" ? getDemoCustomerOverview : getCustomerOverview;

// Data loaded for another dashboard mode or customer view is never shown, even for a single render.
export const visibleOverview = (
  loaded: LoadedOverview,
  mode: DashboardMode,
  customerId: number | null,
): CustomerOverviewState => (loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" });
