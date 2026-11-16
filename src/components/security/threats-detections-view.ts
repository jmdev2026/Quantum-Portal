import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { Detection, DetectionsState } from "@/services/security-detections";
import type { SeverityLevel } from "@/services/security-severity";

// Provisional, frontend-only display shape for a detection row. Not a provider or backend schema;
// it will be revised once a real detection contract exists.
export type DetectionDisplayItem = {
  id: string;
  title: string;
  severity: SeverityLevel;
  customerId: number;
  scopeLabel: string;
  summary: string;
  sourceLabel: string;
};

export const DETECTION_DISPLAY_FIELDS = ["Detection title", "Severity", "Affected scope", "Short summary", "Source"] as const;

export const DETECTIONS_SEPARATION_NOTICE =
  "Example detection records only. This illustrative feed is separate from the Security Overview issue totals.";

export type LoadedDetections = { mode: DashboardMode; customerId: number | null; state: DetectionsState };

// Live Mode has no detection feed, and data loaded for another mode or customer is never shown, even for a single render.
export const visibleDetections = (loaded: LoadedDetections, mode: DashboardMode, customerId: number | null): DetectionsState => {
  if (mode === "live") return { kind: "unavailable" };
  return loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" };
};

export const toDetectionDisplayItem = (detection: Detection): DetectionDisplayItem => ({
  id: detection.id,
  title: detection.title,
  severity: detection.severity,
  customerId: detection.customerId,
  scopeLabel: detection.customerName,
  summary: detection.summary,
  sourceLabel: detection.source,
});

export type DetectionFeedStatus = "not-connected" | "loading" | "simulated" | "demo-empty" | "error";

export type DetectionFeedView = {
  status: DetectionFeedStatus;
  badge: string;
  announcement: string;
  emptyTitle: string;
  emptyBody: string;
};

export function detectionFeedView(state: DetectionsState, scopeLabel: string): DetectionFeedView {
  switch (state.kind) {
    case "unavailable":
      return {
        status: "not-connected",
        badge: "Not connected",
        announcement: "Threats and detections feed not connected. No detection records are shown.",
        emptyTitle: "Detection feed not connected",
        emptyBody: `No provider detection feed is available for ${scopeLabel}, so detections cannot be shown. An unavailable feed does not mean no threats exist.`,
      };
    case "loading":
      return {
        status: "loading",
        badge: "Loading",
        announcement: "Loading example detections",
        emptyTitle: "Loading example detections",
        emptyBody: "Preparing the demonstration feed for this view.",
      };
    case "error":
      return {
        status: "error",
        badge: "Error",
        announcement: "Example detections could not be shown",
        emptyTitle: "Example detections could not be shown",
        emptyBody: `${state.message} Nothing from another customer view is shown in its place.`,
      };
    case "ready":
      return state.detections.length > 0
        ? {
            status: "simulated",
            badge: "Simulated",
            announcement: `Simulated example detections for ${scopeLabel} loaded. Fictional records, separate from Security Overview issue totals.`,
            emptyTitle: "",
            emptyBody: "",
          }
        : {
            status: "demo-empty",
            badge: "Simulated",
            announcement: "No example detections are defined for this demonstration view.",
            emptyTitle: "No example detections for this view",
            emptyBody: "This demonstration view has no example records. This is not a statement about real security activity.",
          };
  }
}
