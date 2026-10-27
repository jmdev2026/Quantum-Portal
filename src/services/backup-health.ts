import { buildUnavailableBackupHealth } from "@/mocks/backup-health";
import {
  isCount,
  isRecord,
  parseScope,
  sameScope,
  textOrNull,
  timestampOrNull,
  type DashboardScope,
} from "@/services/dashboard-response";

// Display categories from the Datto Endpoint Backup v2 reference dashboard; Laravel defines the exact boundaries.
export const FRESHNESS_BUCKETS = [
  { key: "less_than_1_hour", label: "Less than 1 hour" },
  { key: "1_to_3_hours", label: "1–3 hours" },
  { key: "4_to_24_hours", label: "4–24 hours" },
  { key: "more_than_24_hours", label: "More than 24 hours" },
  { key: "no_successful_backup", label: "No successful backup reported" },
] as const;

export type FreshnessBucket = (typeof FRESHNESS_BUCKETS)[number]["key"];
export type FreshnessCounts = Record<FreshnessBucket, number | null>;

export type BackupHealthStatus = "ready" | "stale" | "empty" | "unavailable" | "error";

export type BackupHealthResource = {
  scope: DashboardScope;
  status: BackupHealthStatus;
  protected_assets: number | null;
  freshness: Partial<Record<FreshnessBucket, number | null>> | null;
  source: string | null;
  last_synced_at?: string | null;
  message?: string | null;
};

export type BackupHealthResponse = { data: BackupHealthResource };

type SyncInfo = { source: string | null; lastSyncedAt: string | null };

export type BackupHealthState =
  | { kind: "loading" }
  | ({ kind: "ready" | "stale"; protectedAssets: number | null; freshness: FreshnessCounts | null } & SyncInfo)
  | ({ kind: "empty" | "unavailable" } & SyncInfo)
  | { kind: "error"; message: string };

// Proposed Quantum Shield Laravel route — not a Datto API endpoint. Laravel authenticates, authorizes the requested
// customer, enforces tenant isolation, talks to Datto Endpoint Backup, normalizes data and aggregates MSP-wide when authorized.
// TODO(api): GET /api/dashboard/backup-health — protected endpoint assets and last successful backup freshness for the requested view
// request: { customer_id?: number }  (omit customer_id for the All Customers view)
// response: { data: { scope: { type: "all" } | { type: "customer", customer_id }, status, protected_assets: number | null, freshness: { less_than_1_hour, 1_to_3_hours, 4_to_24_hours, more_than_24_hours, no_successful_backup } | null, source, last_synced_at, message } }
export async function getBackupHealth(scope: DashboardScope): Promise<BackupHealthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildUnavailableBackupHealth(scope);
}

const bucketKeys = new Set<string>(FRESHNESS_BUCKETS.map((bucket) => bucket.key));

const optionalCount = (value: unknown): number | null | undefined =>
  value === undefined || value === null ? null : isCount(value) ? value : undefined;

function parseFreshness(value: unknown): FreshnessCounts | null | undefined {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || Object.keys(value).some((key) => !bucketKeys.has(key))) return undefined;
  const counts = {} as FreshnessCounts;
  for (const { key } of FRESHNESS_BUCKETS) {
    const count = optionalCount(value[key]);
    if (count === undefined) return undefined;
    counts[key] = count;
  }
  return Object.values(counts).some((count) => count !== null) ? counts : null;
}

export function normalizeBackupHealth(response: unknown, requested: DashboardScope): BackupHealthState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data)) return { kind: "error", message: "Backup data came back in an unexpected format." };

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Backup data did not match the selected customer view." };
  }

  const sync = { source: textOrNull(data.source), lastSyncedAt: timestampOrNull(data.last_synced_at) };

  switch (data.status) {
    case "ready":
    case "stale": {
      const protectedAssets = optionalCount(data.protected_assets);
      if (protectedAssets === undefined) return { kind: "error", message: "Received an invalid protected asset count." };
      const freshness = parseFreshness(data.freshness);
      if (freshness === undefined) return { kind: "error", message: "Received invalid backup freshness counts." };
      if (protectedAssets === null && !freshness) {
        return { kind: "error", message: "Backup data was reported without any values." };
      }
      return { kind: data.status, protectedAssets, freshness, ...sync };
    }
    case "empty":
    case "unavailable":
      return { kind: data.status, ...sync };
    case "error":
      return { kind: "error", message: textOrNull(data.message) ?? "The backup provider reported an error." };
    default:
      return { kind: "error", message: "Received an unrecognized status." };
  }
}
