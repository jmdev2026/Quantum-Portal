import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { AssetSummaryState } from "@/components/dashboard/asset-summary-view";
import type { VisibilityRecord, VisibilityRecordKind, VisibilityRecordsState } from "@/services/security-visibility-records";

export const USERS_DEVICES_DESCRIPTION =
  "Visibility into customer user and device summaries, account security observations and endpoint information.";

export const USERS_DEVICES_LIVE_NOTICE =
  "User, device and endpoint reporting is not connected. No counts, accounts, endpoints or sync times are shown, and this does not mean there are no users or devices.";

export const USERS_DEVICES_DEMO_PAGE_NOTICE =
  "The Users and Devices figures are simulated Dashboard asset-summary counts. The account and endpoint examples below are a small fictional sample and are not counted from, or a complete list behind, those figures.";

export const SUMMARY_METRIC_KEYS = ["users", "devices"] as const;
export type SummaryMetricKey = (typeof SUMMARY_METRIC_KEYS)[number];

export const SUMMARY_LABELS: Record<SummaryMetricKey, string> = { users: "Users", devices: "Devices" };

export const SUMMARY_DEFINITION =
  "Simulated Dashboard asset-summary figure. Not a count of monitored, protected, licensed or healthy accounts or devices.";

export type SummaryCardView =
  | { status: "loading" }
  | { status: "unavailable"; text: string }
  | { status: "error"; text: string }
  | { status: "ready"; value: number; stale: boolean };

export function summaryCardView(state: AssetSummaryState, key: SummaryMetricKey): SummaryCardView {
  if (state.status === "loading") return { status: "loading" };
  if (state.status === "error") return { status: "error", text: state.message };
  const metric = state.metrics[key];
  switch (metric.kind) {
    case "loading":
      return { status: "loading" };
    case "error":
      return { status: "error", text: metric.message };
    case "ready":
    case "stale":
      return { status: "ready", value: metric.value, stale: metric.kind === "stale" };
    case "empty":
    case "unavailable":
      return { status: "unavailable", text: "Not connected" };
  }
}

export type RecordSection = {
  kind: VisibilityRecordKind;
  id: string;
  title: string;
  description: string;
  disclosure: string;
  listLabel: string;
  noun: string;
};

export const RECORD_SECTIONS: readonly RecordSection[] = [
  {
    kind: "identities",
    id: "user-account-visibility",
    title: "User Account Visibility",
    description: "Illustrative account security observations for the selected customer.",
    disclosure:
      "Illustrative account examples only. This is not a complete user directory or verified identity-protection inventory.",
    listLabel: "Example user accounts",
    noun: "account",
  },
  {
    kind: "endpoints",
    id: "device-endpoint-visibility",
    title: "Device & Endpoint Visibility",
    description: "Illustrative endpoint security observations for the selected customer.",
    disclosure:
      "Illustrative endpoint examples only. This is not a complete device inventory and does not verify endpoint security or backup protection.",
    listLabel: "Example endpoints",
    noun: "endpoint",
  },
];

export type RecordSectionView =
  | { status: "not-connected" | "loading" | "empty"; title: string; body: string }
  | { status: "error"; title: string; body: string }
  | { status: "simulated"; records: VisibilityRecord[] };

export function recordSectionView(state: VisibilityRecordsState, section: RecordSection): RecordSectionView {
  switch (state.kind) {
    case "unavailable":
      return {
        status: "not-connected",
        title: "Not connected",
        body: `No ${section.noun} information is available. This does not mean there are no ${section.noun}s or risks.`,
      };
    case "loading":
      return { status: "loading", title: `Loading example ${section.noun}s…`, body: "Preparing fictional demonstration records." };
    case "error":
      return { status: "error", title: "Example records could not be shown.", body: state.message };
    case "ready":
      return state.records.length > 0
        ? { status: "simulated", records: state.records }
        : { status: "empty", title: `No example ${section.noun}s for this view.`, body: "This does not mean there are none." };
  }
}

// Never includes a customer name: the scope label is announced separately by the page intro.
export function usersDevicesAnnouncement(
  mode: DashboardMode,
  summary: AssetSummaryState,
  identities: VisibilityRecordsState,
  endpoints: VisibilityRecordsState,
) {
  if (mode === "live") return "Users and devices: reporting not connected.";
  if (summary.status === "loading" || identities.kind === "loading" || endpoints.kind === "loading") {
    return "Loading users and devices.";
  }
  if (summary.status === "error" || identities.kind === "error" || endpoints.kind === "error") {
    return "Users and devices: some information could not be shown.";
  }
  return "Users and devices: simulated figures and fictional example records shown.";
}
