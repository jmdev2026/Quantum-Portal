import { SECURITY_CONTROLS, type ControlStatus, type SecurityControlKey, type SecurityCoverageState } from "@/services/security-coverage";

export const CONTROL_STATUS_LABELS: Record<ControlStatus, string> = {
  covered: "Covered",
  needs_attention: "Needs Attention",
  unknown: "Unknown",
};

export const SIMULATED_CONTROLS_EXPLANATION =
  "Control statuses are simulated examples. They do not represent verified Guardz protection, configuration or security effectiveness.";

export const SIMULATED_STATUS_MEANINGS: readonly { status: ControlStatus; meaning: string }[] = [
  { status: "covered", meaning: "Illustrative status only. It does not establish that protection is active or effective." },
  { status: "needs_attention", meaning: "Fictional status. It is not a verified security incident." },
  { status: "unknown", meaning: "The fictional status is unknown. It does not mean healthy or unhealthy." },
];

export type ControlRowValue =
  | { kind: "status"; status: ControlStatus; label: string }
  | { kind: "placeholder"; label: string }
  | { kind: "loading" };

export type ControlRow = { key: SecurityControlKey; label: string; abbreviation: string | null; value: ControlRowValue };

export type SecurityControlsStatus = "loading" | "not-connected" | "simulated" | "reported" | "stale" | "empty" | "error";

export type SecurityControlsView = {
  status: SecurityControlsStatus;
  badge: string;
  announcement: string;
  message: { title: string; body: string } | null;
  rows: ControlRow[];
  source: string | null;
  lastSyncedAt: string | null;
};

const rows = (value: (key: SecurityControlKey) => ControlRowValue): ControlRow[] =>
  SECURITY_CONTROLS.map((control) => ({ key: control.key, label: control.label, abbreviation: control.abbreviation, value: value(control.key) }));

const placeholder = (label: string) => () => ({ kind: "placeholder", label }) as const;

const NO_INFERENCE = "This does not indicate whether any control is active, inactive or effective.";

export function securityControlsView(state: SecurityCoverageState, simulated: boolean, scopeLabel: string): SecurityControlsView {
  const base = { source: null, lastSyncedAt: null };
  switch (state.kind) {
    case "loading":
      return {
        ...base,
        status: "loading",
        badge: "Loading",
        announcement: `Loading security control statuses for ${scopeLabel}.`,
        message: null,
        rows: rows(() => ({ kind: "loading" })),
      };
    case "unavailable":
      return {
        ...base,
        status: "not-connected",
        badge: "Not connected",
        announcement: `Security controls for ${scopeLabel}: not connected. No statuses are shown.`,
        message: {
          title: "Security control information is not connected.",
          body: `No provider control statuses are available for ${scopeLabel}. ${NO_INFERENCE}`,
        },
        rows: rows(placeholder("Not connected")),
      };
    case "empty":
      return {
        ...base,
        status: "empty",
        badge: "No data yet",
        announcement: `Security controls for ${scopeLabel}: no statuses reported yet.`,
        message: { title: "No control statuses have been reported yet.", body: NO_INFERENCE },
        rows: rows(placeholder("No data yet")),
      };
    case "error":
      return {
        ...base,
        status: "error",
        badge: "Unavailable",
        announcement: `Security controls for ${scopeLabel}: statuses could not be shown.`,
        message: { title: "Security control statuses could not be shown.", body: state.message },
        rows: rows(placeholder("Unavailable")),
      };
    case "ready":
    case "stale": {
      const controls = state.controls;
      const status: SecurityControlsStatus = simulated ? "simulated" : state.kind === "stale" ? "stale" : "reported";
      const badge = simulated ? "Simulated" : state.kind === "stale" ? "Stale" : "Reported";
      return {
        status,
        badge,
        source: state.source,
        lastSyncedAt: state.lastSyncedAt,
        announcement: simulated
          ? `Security controls for ${scopeLabel}: simulated example statuses shown.`
          : `Security controls for ${scopeLabel}: reported statuses shown${state.kind === "stale" ? ", data may be out of date" : ""}.`,
        message: controls ? null : { title: "Individual control statuses were not reported for this view.", body: NO_INFERENCE },
        rows: rows((key) => {
          const value = controls?.[key];
          return value ? { kind: "status", status: value, label: CONTROL_STATUS_LABELS[value] } : { kind: "placeholder", label: "Not reported" };
        }),
      };
    }
  }
}
