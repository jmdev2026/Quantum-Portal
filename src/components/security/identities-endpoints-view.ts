import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { VisibilityRecord, VisibilityRecordKind, VisibilityRecordsState } from "@/services/security-visibility-records";

export type VisibilityAreaId = VisibilityRecordKind;

// Provisional, display-only concepts. Not a Laravel or Guardz contract.
export type VisibilityArea = {
  id: VisibilityAreaId;
  title: string;
  description: string;
  noun: string;
  recordLabel: string;
  fields: readonly string[];
};

export const VISIBILITY_AREAS: readonly VisibilityArea[] = [
  {
    id: "identities",
    title: "Identities",
    description: "User accounts and the security observations reported about them.",
    noun: "identity",
    recordLabel: "Example identities",
    fields: ["Account name", "Customer", "Security observation", "Protection visibility"],
  },
  {
    id: "endpoints",
    title: "Endpoints",
    description: "Devices and the endpoint security observations reported about them.",
    noun: "endpoint",
    recordLabel: "Example endpoints",
    fields: ["Device name", "Customer", "Security observation", "Protection visibility"],
  },
];

export type LoadedVisibilityRecords = { mode: DashboardMode; customerId: number | null; state: VisibilityRecordsState };

export const visibleVisibilityRecords = (
  loaded: LoadedVisibilityRecords,
  mode: DashboardMode,
  customerId: number | null,
): VisibilityRecordsState => {
  if (mode === "live") return { kind: "unavailable" };
  return loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" };
};

export type VisibilityAreaStatus = "not-connected" | "loading" | "simulated" | "demo-empty" | "error";

export type VisibilityAreaView =
  | { status: "simulated"; badge: string; sampleNote: string; records: VisibilityRecord[] }
  | { status: Exclude<VisibilityAreaStatus, "simulated">; badge: string; title: string; body: string };

const LIVE_TITLES: Record<VisibilityAreaId, string> = {
  identities: "Identity security information is not connected.",
  endpoints: "Endpoint security information is not connected.",
};

const UNAVAILABLE_MEANING: Record<VisibilityAreaId, string> = {
  identities: "This does not mean there are no accounts or identity risks.",
  endpoints: "This does not mean there are no devices or endpoint risks.",
};

const SAMPLE_NOTES: Record<VisibilityAreaId, string> = {
  identities: "Illustrative sample only. Not a complete list of accounts and not a count of users.",
  endpoints: "Illustrative sample only. Not a complete list of devices and not a count of devices.",
};

export function visibilityAreaView(state: VisibilityRecordsState, area: VisibilityArea, scopeLabel: string): VisibilityAreaView {
  switch (state.kind) {
    case "unavailable":
      return {
        status: "not-connected",
        badge: "Not connected",
        title: LIVE_TITLES[area.id],
        body: `No provider ${area.noun} feed is available for ${scopeLabel}. ${UNAVAILABLE_MEANING[area.id]}`,
      };
    case "loading":
      return {
        status: "loading",
        badge: "Loading",
        title: `Loading example ${area.noun} records…`,
        body: `Preparing fictional demonstration records for ${scopeLabel}.`,
      };
    case "error":
      return { status: "error", badge: "Unavailable", title: "Example records could not be shown.", body: state.message };
    case "ready":
      return state.records.length > 0
        ? { status: "simulated", badge: "Simulated", sampleNote: SAMPLE_NOTES[area.id], records: state.records }
        : {
            status: "demo-empty",
            badge: "Simulated",
            title: `No example ${area.noun} records for ${scopeLabel}.`,
            body: UNAVAILABLE_MEANING[area.id],
          };
  }
}

export function identitiesEndpointsAnnouncement(
  mode: DashboardMode,
  identities: VisibilityRecordsState,
  endpoints: VisibilityRecordsState,
  scopeLabel: string,
) {
  if (mode === "live") return `Identities and endpoints for ${scopeLabel}: security information not connected.`;
  if (identities.kind === "loading" || endpoints.kind === "loading") return `Loading example identities and endpoints for ${scopeLabel}.`;
  if (identities.kind === "error" || endpoints.kind === "error") {
    return `Identities and endpoints for ${scopeLabel}: example records could not be shown.`;
  }
  return `Identities and endpoints for ${scopeLabel}: simulated, fictional example records shown. Illustrative samples, not complete inventories.`;
}
