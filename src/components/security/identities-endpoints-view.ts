import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";

export type VisibilityAreaId = "identities" | "endpoints";

// Provisional, display-only concepts. Not a Laravel or Guardz contract.
export type VisibilityArea = {
  id: VisibilityAreaId;
  title: string;
  description: string;
  noun: string;
  fields: readonly string[];
};

export const VISIBILITY_AREAS: readonly VisibilityArea[] = [
  {
    id: "identities",
    title: "Identities",
    description: "User accounts and the security observations reported about them.",
    noun: "identity",
    fields: ["Account name", "Customer", "Security observation", "Protection visibility"],
  },
  {
    id: "endpoints",
    title: "Endpoints",
    description: "Devices and the endpoint security observations reported about them.",
    noun: "endpoint",
    fields: ["Device name", "Customer", "Security observation", "Protection visibility"],
  },
];

export type VisibilityAreaStatus = "not-connected" | "demo-placeholder";

export type VisibilityAreaView = {
  status: VisibilityAreaStatus;
  badge: string;
  title: string;
  body: string;
};

const LIVE_TITLES: Record<VisibilityAreaId, string> = {
  identities: "Identity security information is not connected.",
  endpoints: "Endpoint security information is not connected.",
};

const DEMO_TITLES: Record<VisibilityAreaId, string> = {
  identities: "Demonstration identity records have not been populated yet.",
  endpoints: "Demonstration endpoint records have not been populated yet.",
};

const UNAVAILABLE_MEANING: Record<VisibilityAreaId, string> = {
  identities: "This does not mean there are no accounts or identity risks.",
  endpoints: "This does not mean there are no devices or endpoint risks.",
};

export function visibilityAreaView(mode: DashboardMode, area: VisibilityArea, scopeLabel: string): VisibilityAreaView {
  if (mode === "demo") {
    return {
      status: "demo-placeholder",
      badge: "Demo · No records yet",
      title: DEMO_TITLES[area.id],
      body: `Fictional example ${area.noun} records for ${scopeLabel} will be added in the next development step. ${UNAVAILABLE_MEANING[area.id]}`,
    };
  }
  return {
    status: "not-connected",
    badge: "Not connected",
    title: LIVE_TITLES[area.id],
    body: `No provider ${area.noun} feed is available for ${scopeLabel}. ${UNAVAILABLE_MEANING[area.id]}`,
  };
}

export function identitiesEndpointsAnnouncement(mode: DashboardMode, scopeLabel: string) {
  return mode === "demo"
    ? `Identities and endpoints for ${scopeLabel}: demonstration placeholders, no example records yet.`
    : `Identities and endpoints for ${scopeLabel}: security information not connected.`;
}
