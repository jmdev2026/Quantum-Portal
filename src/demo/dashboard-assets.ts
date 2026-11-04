import type { AssetMetricKey, AssetScope, AssetSummaryResponse } from "@/services/dashboard-assets";

// Fictional demonstration figures. Not Guardz or Datto data, and never sent to or stored by any backend.
type DemoAssetCounts = Record<AssetMetricKey, number>;

// Keyed by the IDs in src/mocks/customers.ts (Demo Customer A = 1, B = 2, C = 3).
export const DEMO_CUSTOMER_ASSETS: ReadonlyMap<number, DemoAssetCounts> = new Map([
  [1, { users: 62, devices: 35, mailboxes: 61, cloud_drives: 64, internet_assets: 14 }],
  [2, { users: 48, devices: 27, mailboxes: 47, cloud_drives: 50, internet_assets: 12 }],
  [3, { users: 36, devices: 21, mailboxes: 36, cloud_drives: 38, internet_assets: 9 }],
]);

// Defined explicitly rather than summed in the browser; equals the sum of Demo Customers A–C.
export const DEMO_ALL_CUSTOMER_ASSETS: DemoAssetCounts = {
  users: 146,
  devices: 83,
  mailboxes: 144,
  cloud_drives: 152,
  internet_assets: 35,
};

const metricKeys: AssetMetricKey[] = ["users", "devices", "mailboxes", "cloud_drives", "internet_assets"];

// Unknown customers get an explicit error per metric, never another customer's figures.
export function buildDemoAssetSummary(scope: AssetScope): AssetSummaryResponse {
  const counts = scope.type === "all" ? DEMO_ALL_CUSTOMER_ASSETS : DEMO_CUSTOMER_ASSETS.get(scope.customer_id);
  return {
    data: {
      scope,
      metrics: metricKeys.map((key) =>
        counts
          ? { key, status: "ready", value: counts[key], issue_count: null, source: null, last_synced_at: null, message: null }
          : {
              key,
              status: "error",
              value: null,
              issue_count: null,
              source: null,
              last_synced_at: null,
              message: "No demonstration data exists for this customer.",
            },
      ),
    },
  };
}
