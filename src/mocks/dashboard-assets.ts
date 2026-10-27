import type { AssetMetricKey, AssetScope, AssetSummaryResponse } from "@/services/dashboard-assets";

const metricKeys: AssetMetricKey[] = ["users", "devices", "mailboxes", "cloud_drives", "internet_assets"];

export function buildUnavailableAssetSummary(scope: AssetScope): AssetSummaryResponse {
  return {
    data: {
      scope,
      metrics: metricKeys.map((key) => ({
        key,
        status: "unavailable",
        value: null,
        issue_count: null,
        source: null,
        last_synced_at: null,
        message: null,
      })),
    },
  };
}
