import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { SeverityLevel } from "@/services/security-severity";

// Provisional, frontend-only display shape for a detection row. Not a provider or backend schema;
// it will be revised once a real detection contract exists.
export type DetectionDisplayItem = {
  id: string;
  title: string;
  severity: SeverityLevel;
  scopeLabel: string;
  summary: string;
  sourceLabel: string;
};

export const DETECTION_DISPLAY_FIELDS = ["Detection title", "Severity", "Affected scope", "Short summary", "Source"] as const;

export type DetectionFeedStatus = "not-connected" | "demo-placeholder";

export type DetectionFeedView = {
  status: DetectionFeedStatus;
  badge: string;
  announcement: string;
  emptyTitle: string;
  emptyBody: string;
  fieldsIntro: string;
};

export const DEMO_DETECTIONS_PLACEHOLDER =
  "Individual demonstration detections have not been populated yet. Security Overview metrics are separate simulated summaries.";

export function detectionFeedView(mode: DashboardMode, scopeLabel: string): DetectionFeedView {
  if (mode === "demo") {
    return {
      status: "demo-placeholder",
      badge: "Demo · Placeholder",
      announcement: "Threats and detections: demonstration placeholder. No detection records are shown.",
      emptyTitle: "Demonstration detections not populated",
      emptyBody: DEMO_DETECTIONS_PLACEHOLDER,
      fieldsIntro: "Example detections will show",
    };
  }
  return {
    status: "not-connected",
    badge: "Not connected",
    announcement: "Threats and detections feed not connected. No detection records are shown.",
    emptyTitle: "Detection feed not connected",
    emptyBody: `No provider detection feed is available for ${scopeLabel}, so detections cannot be shown. An unavailable feed does not mean no threats exist.`,
    fieldsIntro: "Once connected, each detection will show",
  };
}
