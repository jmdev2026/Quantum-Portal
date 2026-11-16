"use client";

import { IdentitiesEndpointsPanel } from "@/components/security/identities-endpoints-panel";
import { SecurityControlsPanel } from "@/components/security/security-controls-panel";
import { ThreatsDetectionsPanel } from "@/components/security/threats-detections-panel";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { SecurityOverviewPanel } from "@/components/security/security-overview-panel";
import { SECURITY_SECTIONS } from "@/components/security/security-overview-view";

export function SecuritySections() {
  const { mode } = useDashboardMode();

  return (
    <div className="grid gap-6 md:grid-cols-2" data-mode={mode}>
      {SECURITY_SECTIONS.map((section) => {
        if (section.id === "security-overview") return <SecurityOverviewPanel key={section.id} />;
        if (section.id === "threats-detections") return <ThreatsDetectionsPanel key={section.id} />;
        if (section.id === "identities-endpoints") return <IdentitiesEndpointsPanel key={section.id} />;
        if (section.id === "security-controls") return <SecurityControlsPanel key={section.id} />;
        return null;
      })}
    </div>
  );
}
