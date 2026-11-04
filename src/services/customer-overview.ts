import { buildUnavailableCustomerOverview } from "@/mocks/customer-overview";
import {
  isRecord,
  parseScope,
  sameScope,
  textOrNull,
  timestampOrNull,
  type DashboardScope,
} from "@/services/dashboard-response";

// Availability of reporting data only. It never says whether a customer is secure or backed up.
export const REPORTING_STATUSES = ["available", "unavailable", "stale", "unknown"] as const;
export type ReportingStatus = (typeof REPORTING_STATUSES)[number];

export const CUSTOMER_TEXT_LIMITS = { name: 120, source: 60, message: 200 } as const;
export const MAX_DISPLAYED_CUSTOMERS = 100;

export type CustomerOverviewStatus = "ready" | "stale" | "empty" | "unavailable" | "error";

export type CustomerPortfolioResource = {
  id: number;
  name: string;
  security_reporting: ReportingStatus;
  backup_reporting: ReportingStatus;
  last_synced_at?: string | null;
};

export type CustomerOverviewResource = {
  scope: DashboardScope;
  status: CustomerOverviewStatus;
  customers: CustomerPortfolioResource[] | null;
  source: string | null;
  last_synced_at?: string | null;
  message?: string | null;
};

export type CustomerOverviewResponse = { data: CustomerOverviewResource };

export type CustomerPortfolioRecord = {
  id: number;
  name: string;
  securityReporting: ReportingStatus;
  backupReporting: ReportingStatus;
  lastSyncedAt: string | null;
};

type SyncInfo = { source: string | null; lastSyncedAt: string | null };

export type CustomerOverviewState =
  | { kind: "loading" }
  | ({ kind: "ready" | "stale"; customers: CustomerPortfolioRecord[]; hiddenCount: number } & SyncInfo)
  | ({ kind: "empty" | "unavailable" } & SyncInfo)
  | { kind: "error"; message: string };

// Proposed Quantum Shield Laravel route — not a Guardz or Datto endpoint. Laravel authenticates the request, authorizes
// customer access, enforces tenant isolation, maps provider customer IDs to canonical IDs and aggregates the portfolio.
// TODO(api): GET /api/dashboard/customer-overview — security and backup reporting availability per customer for the requested view
// request: { customer_id?: number }  (omit customer_id for the All Customers view)
// response: { data: { scope: { type: "all" } | { type: "customer", customer_id }, status: "ready" | "stale" | "empty" | "unavailable" | "error", customers: [{ id, name, security_reporting: "available" | "unavailable" | "stale" | "unknown", backup_reporting: "available" | "unavailable" | "stale" | "unknown", last_synced_at }] | null, source, last_synced_at, message } }
export async function getCustomerOverview(scope: DashboardScope): Promise<CustomerOverviewResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildUnavailableCustomerOverview(scope);
}

const reportingStatuses = new Set<unknown>(REPORTING_STATUSES);
const recordKeys = new Set(["id", "name", "security_reporting", "backup_reporting", "last_synced_at"]);

const boundedText = (value: unknown, limit: number) => {
  const text = textOrNull(value)?.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
};

const isoTimestamp = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) ? timestampOrNull(value) : null;

// Returns undefined when the field is present but malformed, so the record is rejected rather than shown as unsynced.
function optionalTimestamp(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  return isoTimestamp(value) ?? undefined;
}

function parseCustomer(value: unknown): CustomerPortfolioRecord | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !recordKeys.has(key))) return null;
  if (!Number.isSafeInteger(value.id) || (value.id as number) <= 0) return null;
  const name = boundedText(value.name, CUSTOMER_TEXT_LIMITS.name);
  if (!name) return null;
  if (!reportingStatuses.has(value.security_reporting) || !reportingStatuses.has(value.backup_reporting)) return null;
  const lastSyncedAt = optionalTimestamp(value.last_synced_at);
  if (lastSyncedAt === undefined) return null;
  return {
    id: value.id as number,
    name,
    securityReporting: value.security_reporting as ReportingStatus,
    backupReporting: value.backup_reporting as ReportingStatus,
    lastSyncedAt,
  };
}

function parseCustomers(value: unknown): CustomerPortfolioRecord[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const seen = new Set<number>();
  const customers: CustomerPortfolioRecord[] = [];
  for (const entry of value) {
    const customer = parseCustomer(entry);
    if (!customer || seen.has(customer.id)) return null;
    seen.add(customer.id);
    customers.push(customer);
  }
  return customers;
}

export function normalizeCustomerOverview(response: unknown, requested: DashboardScope): CustomerOverviewState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data)) return { kind: "error", message: "Customer overview came back in an unexpected format." };

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Customer overview did not match the selected customer view." };
  }

  const sync = {
    source: boundedText(data.source, CUSTOMER_TEXT_LIMITS.source),
    lastSyncedAt: isoTimestamp(data.last_synced_at),
  };

  switch (data.status) {
    case "ready":
    case "stale": {
      const customers = parseCustomers(data.customers);
      if (!customers) return { kind: "error", message: "Received missing, invalid or duplicate customer records." };
      if (requested.type === "customer" && (customers.length !== 1 || customers[0].id !== requested.customer_id)) {
        return { kind: "error", message: "Customer overview did not match the selected customer view." };
      }
      return {
        kind: data.status,
        customers: customers.slice(0, MAX_DISPLAYED_CUSTOMERS),
        hiddenCount: Math.max(0, customers.length - MAX_DISPLAYED_CUSTOMERS),
        ...sync,
      };
    }
    case "empty":
    case "unavailable":
      return { kind: data.status, ...sync };
    case "error":
      return {
        kind: "error",
        message: boundedText(data.message, CUSTOMER_TEXT_LIMITS.message) ?? "The customer overview reported an error.",
      };
    default:
      return { kind: "error", message: "Received an unrecognized status." };
  }
}
