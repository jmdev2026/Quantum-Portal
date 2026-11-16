import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";

export type SecuritySectionId = "security-overview" | "threats-detections" | "identities-endpoints" | "security-controls";

export type SecuritySection = {
  id: SecuritySectionId;
  title: string;
  description: string;
};

export const SECURITY_SECTIONS: readonly SecuritySection[] = [
  {
    id: "security-overview",
    title: "Security Overview",
    description: "Overall security posture and finding totals for the selected scope.",
  },
  {
    id: "threats-detections",
    title: "Threats & Detections",
    description: "Detected threats, alerts and their severity.",
  },
  {
    id: "identities-endpoints",
    title: "Identities & Endpoints",
    description: "Protected user identities and managed endpoints.",
  },
  {
    id: "security-controls",
    title: "Security Controls",
    description: "Status of the security controls applied to protected environments.",
  },
];

export const SECURITY_LIVE_NOTICE =
  "Security integrations are not connected. No findings, detections, identities, endpoints or sync times are shown.";

export function securitySectionStatus(mode: DashboardMode) {
  return mode === "demo"
    ? ({ label: "Demo · No data yet", tone: "pending" } as const)
    : ({ label: "Not connected", tone: "disconnected" } as const);
}

export function securitySectionMessage(mode: DashboardMode) {
  return mode === "demo"
    ? {
        title: "No demonstration data for this section yet",
        body: "Demo Mode is on, but simulated security figures have not been added to this section. Nothing shown here reflects real customer activity.",
      }
    : {
        title: "Security integration not connected",
        body: "This section will show reported information once a security integration is connected. No data is shown until then.",
      };
}

export function securityScopeLabel(viewMode: "all" | "customer", customerName: string | undefined) {
  return viewMode === "all" ? "All Customers" : (customerName ?? "Selected customer");
}
