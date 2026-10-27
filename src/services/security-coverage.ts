import { buildUnavailableSecurityCoverage } from "@/mocks/security-coverage";
import {
  isRecord,
  parseScope,
  sameScope,
  textOrNull,
  timestampOrNull,
  type DashboardScope,
} from "@/services/dashboard-response";

export const SECURITY_CONTROLS = [
  { key: "mdr", label: "Managed Detection & Response", abbreviation: "MDR" },
  { key: "itdr", label: "Identity Threat Detection & Response", abbreviation: "ITDR" },
  { key: "external_footprint_scan", label: "External Footprint Scan", abbreviation: null },
  { key: "dark_web_monitoring", label: "Dark Web Monitoring", abbreviation: null },
  { key: "email_protection", label: "Email Protection", abbreviation: null },
  { key: "endpoint_security", label: "Endpoint Security", abbreviation: null },
  { key: "cloud_data_protection", label: "Cloud Data Protection", abbreviation: null },
  { key: "security_awareness_training", label: "Security Awareness Training", abbreviation: null },
  { key: "phishing_simulations", label: "Phishing Simulations", abbreviation: null },
] as const;

export type SecurityControlKey = (typeof SECURITY_CONTROLS)[number]["key"];

// Classifications Laravel maps provider data into; Guardz does not necessarily expose these directly.
export const CONTROL_STATUSES = ["covered", "needs_attention", "unknown"] as const;
export type ControlStatus = (typeof CONTROL_STATUSES)[number];

export type SecurityCoverageStatus = "ready" | "stale" | "empty" | "unavailable" | "error";

export type SecurityCoverageResource = {
  scope: DashboardScope;
  status: SecurityCoverageStatus;
  coverage_percentage?: number | null;
  coverage_basis?: string | null;
  controls?: { key: SecurityControlKey; status: ControlStatus }[] | null;
  source: string | null;
  last_synced_at?: string | null;
  message?: string | null;
};

export type SecurityCoverageResponse = { data: SecurityCoverageResource };

export type CoverageScore = { percentage: number; basis: string };
export type ControlStatuses = Partial<Record<SecurityControlKey, ControlStatus>>;

type SyncInfo = { source: string | null; lastSyncedAt: string | null };

export type SecurityCoverageState =
  | { kind: "loading" }
  | ({ kind: "ready" | "stale"; coverage: CoverageScore | null; controls: ControlStatuses | null } & SyncInfo)
  | ({ kind: "empty" | "unavailable" } & SyncInfo)
  | { kind: "error"; message: string };

// Proposed Quantum Shield Laravel route — not a Guardz endpoint. Laravel enforces organization access and
// computes any percentage; the provider fields and calculation method are still to be confirmed by the Laravel team.
// TODO(api): GET /api/dashboard/security-coverage — security control coverage for the requested view
// request: { customer_id?: number }  (omit customer_id for the All Customers view)
// response: { data: { scope: { type: "all" } | { type: "customer", customer_id }, status, coverage_percentage, coverage_basis, controls: [{ key, status: "covered" | "needs_attention" | "unknown" }] | null, source, last_synced_at, message } }
export async function getSecurityCoverage(scope: DashboardScope): Promise<SecurityCoverageResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildUnavailableSecurityCoverage(scope);
}

// Truncate rather than round so a value like 99.96 is never shown as 100%.
export const formatCoveragePercentage = (value: number) =>
  `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(Math.floor(value * 10 + 1e-9) / 10)}%`;

const controlKeys = new Set<unknown>(SECURITY_CONTROLS.map((control) => control.key));
const controlStatuses = new Set<unknown>(CONTROL_STATUSES);

function parseControls(value: unknown): ControlStatuses | null | undefined {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return undefined;
  const controls: ControlStatuses = {};
  for (const entry of value) {
    if (!isRecord(entry) || !controlKeys.has(entry.key) || !controlStatuses.has(entry.status)) return undefined;
    const key = entry.key as SecurityControlKey;
    if (key in controls) return undefined;
    controls[key] = entry.status as ControlStatus;
  }
  return Object.keys(controls).length > 0 ? controls : null;
}

function parseCoverage(percentage: unknown, basis: unknown): CoverageScore | null | undefined {
  if (percentage === undefined || percentage === null) return null;
  if (typeof percentage !== "number" || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) return undefined;
  const explanation = textOrNull(basis);
  return explanation ? { percentage, basis: explanation } : undefined;
}

export function normalizeSecurityCoverage(response: unknown, requested: DashboardScope): SecurityCoverageState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data)) return { kind: "error", message: "Coverage data came back in an unexpected format." };

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Coverage data did not match the selected customer view." };
  }

  const sync = { source: textOrNull(data.source), lastSyncedAt: timestampOrNull(data.last_synced_at) };

  switch (data.status) {
    case "ready":
    case "stale": {
      const coverage = parseCoverage(data.coverage_percentage, data.coverage_basis);
      if (coverage === undefined) {
        return { kind: "error", message: "Received an invalid coverage percentage or no explanation of what it measures." };
      }
      const controls = parseControls(data.controls);
      if (controls === undefined) return { kind: "error", message: "Received invalid security control statuses." };
      if (!coverage && !controls) return { kind: "error", message: "Coverage data was reported without any values." };
      return { kind: data.status, coverage, controls, ...sync };
    }
    case "empty":
    case "unavailable":
      return { kind: data.status, ...sync };
    case "error":
      return { kind: "error", message: textOrNull(data.message) ?? "The security provider reported an error." };
    default:
      return { kind: "error", message: "Received an unrecognized status." };
  }
}
