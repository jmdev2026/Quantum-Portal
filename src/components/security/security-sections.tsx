"use client";

import Link from "next/link";
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
      <Link href="/security/detections" className="min-h-10 justify-self-start rounded-lg border border-ink-700 px-4 py-2 text-sm font-medium text-shield-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400 md:col-span-2">Open Detection Explorer</Link>
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
