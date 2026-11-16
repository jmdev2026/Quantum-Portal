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
    description: "Summary of reported security figures for the selected scope.",
  },
  {
    id: "threats-detections",
    title: "Threats & Detections",
    description: "Review security detections and investigation information for the selected customer view.",
  },
  {
    id: "identities-endpoints",
    title: "Identities & Endpoints",
    description: "Review identity and endpoint security visibility for the selected customer.",
  },
  {
    id: "security-controls",
    title: "Security Controls",
    description: "Review security control reporting and visibility for the selected customer.",
  },
];

export const SECURITY_LIVE_NOTICE =
  "Security integrations are not connected. No findings, detections, identities, endpoints or sync times are shown.";

export function securityScopeLabel(viewMode: "all" | "customer", customerName: string | undefined) {
  return viewMode === "all" ? "All Customers" : (customerName ?? "Selected customer");
}
