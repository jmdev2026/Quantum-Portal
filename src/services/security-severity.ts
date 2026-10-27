import { buildUnavailableSecuritySeverity } from "@/mocks/security-severity";
import {
  isCount,
  isRecord,
  parseScope,
  sameScope,
  textOrNull,
  timestampOrNull,
  type DashboardScope,
} from "@/services/dashboard-response";

export const SEVERITY_LEVELS = ["critical", "high", "medium", "low"] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
export type SeverityCounts = Record<SeverityLevel, number>;

export type SecuritySeverityStatus = "ready" | "stale" | "empty" | "unavailable" | "error";

export type SecuritySeverityResource = {
  scope: DashboardScope;
  status: SecuritySeverityStatus;
  counts: Record<SeverityLevel, number | null> | null;
  total?: number | null;
  source: string | null;
  last_synced_at?: string | null;
  message?: string | null;
};

export type SecuritySeverityResponse = { data: SecuritySeverityResource };

type SyncInfo = { source: string | null; lastSyncedAt: string | null };

export type SecuritySeverityState =
  | { kind: "loading" }
  | ({ kind: "ready" | "stale"; counts: SeverityCounts; total: number | null } & SyncInfo)
  | ({ kind: "empty" | "unavailable" } & SyncInfo)
  | { kind: "error"; message: string };

// Proposed Quantum Shield Laravel route — not a Guardz endpoint. Laravel enforces organization access.
// TODO(api): GET /api/dashboard/security-severity — open security issue counts by severity for the requested view
// request: { customer_id?: number }  (omit customer_id for the All Customers view)
// response: { data: { scope: { type: "all" } | { type: "customer", customer_id }, status, counts: { critical, high, medium, low } | null, total, source, last_synced_at, message } }
export async function getSecuritySeverity(scope: DashboardScope): Promise<SecuritySeverityResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildUnavailableSecuritySeverity(scope);
}

function parseCounts(value: unknown): SeverityCounts | null {
  if (!isRecord(value)) return null;
  const counts = {} as SeverityCounts;
  for (const level of SEVERITY_LEVELS) {
    const count = value[level];
    if (!isCount(count)) return null;
    counts[level] = count;
  }
  return counts;
}

export function normalizeSecuritySeverity(response: unknown, requested: DashboardScope): SecuritySeverityState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data)) return { kind: "error", message: "Issue data came back in an unexpected format." };

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Issue data did not match the selected customer view." };
  }

  const sync = { source: textOrNull(data.source), lastSyncedAt: timestampOrNull(data.last_synced_at) };

  switch (data.status) {
    case "ready":
    case "stale": {
      const counts = parseCounts(data.counts);
      if (!counts) return { kind: "error", message: "Received invalid issue counts." };
      if (data.total === undefined || data.total === null) return { kind: data.status, counts, total: null, ...sync };
      const sum = SEVERITY_LEVELS.reduce((total, level) => total + counts[level], 0);
      if (!isCount(data.total) || data.total !== sum) {
        return { kind: "error", message: "Issue total did not match the severity breakdown." };
      }
      return { kind: data.status, counts, total: data.total, ...sync };
    }
    case "empty":
    case "unavailable":
      return { kind: data.status, ...sync };
    case "error":
      return { kind: "error", message: textOrNull(data.message) ?? "The security provider reported an error." };
    default:
      return { kind: "error", message: "Received an unrecognized status." };
  }
}
