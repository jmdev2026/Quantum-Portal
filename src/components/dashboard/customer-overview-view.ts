import type { CustomerView } from "@/components/customer-view/customer-view-state";
import type { CustomerOverviewState } from "@/services/customer-overview";

export type OverviewMode = CustomerView["mode"];
export type LoadedOverview = { customerId: number | null; state: CustomerOverviewState };

export const overviewMode = (customerId: number | null): OverviewMode => (customerId === null ? "all" : "customer");

// Layout follows the selected view, never the number of records returned.
export const portfolioLayout = (mode: OverviewMode) => (mode === "customer" ? "detail" : "list");

// Data loaded for a previous view is never shown under the current one, even for a single render.
export const visibleOverview = (loaded: LoadedOverview, customerId: number | null): CustomerOverviewState =>
  loaded.customerId === customerId ? loaded.state : { kind: "loading" };
