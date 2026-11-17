import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { OverviewMode } from "@/components/dashboard/customer-overview-view";
import type { CustomerOverviewState, CustomerPortfolioRecord } from "@/services/customer-overview";

export const CUSTOMERS_DESCRIPTION =
  "Customer portfolio visibility, reporting availability and access to customer-specific security and backup information.";

export const CUSTOMERS_LIVE_NOTICE =
  "Customer reporting integrations are not connected. No customer records, reporting availability or sync times are shown.";

export const CUSTOMERS_DEMO_PAGE_NOTICE =
  "This page lists the fictional demonstration customers. \u201cDemo data present\u201d only means demonstration fixtures exist for that area. It does not mean the customer is protected, monitored or backed up, and no Guardz or Datto integration is connected.";

export const CUSTOMER_SCOPE_NOTICE =
  "All Customers is a demonstration, MSP-level view. In the connected product, the Quantum Shield backend will decide which customers each signed-in user may see. Choosing a customer here is a viewing preference, not a permission.";

export type CustomersPageView =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "portfolio"; customers: CustomerPortfolioRecord[]; stale: boolean }
  | { kind: "detail"; customer: CustomerPortfolioRecord; stale: boolean };

// Layout follows the selected view; a single-customer view never renders portfolio rows.
export function customersPageView(state: CustomerOverviewState, layout: OverviewMode): CustomersPageView {
  switch (state.kind) {
    case "loading":
    case "unavailable":
    case "empty":
      return { kind: state.kind };
    case "error":
      return { kind: "error", message: state.message };
    case "ready":
    case "stale": {
      const stale = state.kind === "stale";
      if (layout === "all") return { kind: "portfolio", customers: state.customers, stale };
      return { kind: "detail", customer: state.customers[0], stale };
    }
  }
}

export function customersAnnouncement(view: CustomersPageView, mode: DashboardMode) {
  switch (view.kind) {
    case "loading":
      return "Loading customers";
    case "unavailable":
      return "Customer reporting integrations are not connected.";
    case "empty":
      return "No customer reporting data yet.";
    case "error":
      return "";
    case "portfolio":
      return `${mode === "demo" ? "Demonstration customer portfolio" : "Customer portfolio"} loaded for All Customers.`;
    case "detail":
      return `${mode === "demo" ? "Demonstration customer details" : "Customer details"} loaded for ${view.customer.name}.`;
  }
}
