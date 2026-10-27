import { buildUnavailableAssetSummary } from "@/mocks/dashboard-assets";

export const ASSET_METRIC_KEYS = ["users", "devices", "mailboxes", "cloud_drives", "internet_assets"] as const;
export type AssetMetricKey = (typeof ASSET_METRIC_KEYS)[number];

// A viewing preference only. Laravel must authorize every requested organization.
export type AssetScope = { type: "all" } | { type: "customer"; customer_id: number };

export type AssetMetricStatus = "ready" | "empty" | "unavailable" | "stale" | "error";

export type AssetMetricResource = {
  key: AssetMetricKey;
  status: AssetMetricStatus;
  value: number | null;
  issue_count?: number | null;
  source: string | null;
  last_synced_at?: string | null;
  message?: string | null;
};

export type AssetSummaryResponse = {
  data: { scope: AssetScope; metrics: AssetMetricResource[] };
};

type SyncInfo = { source: string | null; lastSyncedAt: string | null };

export type AssetMetricState =
  | { kind: "loading" }
  | ({ kind: "ready" | "stale"; value: number; issueCount: number | null } & SyncInfo)
  | ({ kind: "empty" | "unavailable" } & SyncInfo)
  | { kind: "error"; message: string };

export type AssetSummaryResult =
  | { ok: true; metrics: Record<AssetMetricKey, AssetMetricState> }
  | { ok: false; message: string };

// TODO(api): GET /api/dashboard/asset-summary — asset totals for the requested view; Laravel enforces organization access
// request: { customer_id?: number }  (omit customer_id for the All Customers view)
// response: { data: { scope: { type: "all" } | { type: "customer", customer_id }, metrics: [{ key, status, value, issue_count, source, last_synced_at, message }] } }
export async function getAssetSummary(scope: AssetScope): Promise<AssetSummaryResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildUnavailableAssetSummary(scope);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

const textOrNull = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value : null);

const timestampOrNull = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;

function parseScope(value: unknown): AssetScope | null {
  if (!isRecord(value)) return null;
  if (value.type === "all") return { type: "all" };
  if (value.type === "customer" && Number.isSafeInteger(value.customer_id)) {
    return { type: "customer", customer_id: value.customer_id as number };
  }
  return null;
}

const sameScope = (a: AssetScope, b: AssetScope) =>
  a.type === b.type && (a.type === "all" || (b.type === "customer" && a.customer_id === b.customer_id));

export function normalizeAssetMetric(raw: unknown): AssetMetricState {
  if (!isRecord(raw)) return { kind: "error", message: "Received an unreadable metric." };
  const sync = { source: textOrNull(raw.source), lastSyncedAt: timestampOrNull(raw.last_synced_at) };

  switch (raw.status) {
    case "ready":
    case "stale":
      if (!isCount(raw.value)) return { kind: "error", message: "Received an invalid value." };
      return {
        kind: raw.status,
        value: raw.value,
        issueCount: isCount(raw.issue_count) ? raw.issue_count : null,
        ...sync,
      };
    case "empty":
    case "unavailable":
      return { kind: raw.status, ...sync };
    case "error":
      return { kind: "error", message: textOrNull(raw.message) ?? "The data source reported an error." };
    default:
      return { kind: "error", message: "Received an unrecognized status." };
  }
}

export function normalizeAssetSummary(response: unknown, requested: AssetScope): AssetSummaryResult {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data) || !Array.isArray(data.metrics)) {
    return { ok: false, message: "Asset data came back in an unexpected format." };
  }

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { ok: false, message: "Asset data did not match the selected customer view." };
  }

  const metrics = {} as Record<AssetMetricKey, AssetMetricState>;
  for (const key of ASSET_METRIC_KEYS) {
    const raw = data.metrics.find((metric) => isRecord(metric) && metric.key === key);
    metrics[key] = raw === undefined ? { kind: "unavailable", source: null, lastSyncedAt: null } : normalizeAssetMetric(raw);
  }
  return { ok: true, metrics };
}
