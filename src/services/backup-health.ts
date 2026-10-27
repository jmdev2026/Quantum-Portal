import { buildUnavailableBackupHealth } from "@/mocks/backup-health";
import {
  isCount,
  isRecord,
  parseScope,
  sameScope,
  textOrNull,
  timestampOrNull,
  type DashboardScope,
} from "@/services/dashboard-response";

// Display categories from the Datto Endpoint Backup v2 reference dashboard; Laravel defines the exact boundaries.
export const FRESHNESS_BUCKETS = [
  { key: "less_than_1_hour", label: "Less than 1 hour" },
  { key: "1_to_3_hours", label: "1–3 hours" },
  { key: "4_to_24_hours", label: "4–24 hours" },
  { key: "more_than_24_hours", label: "More than 24 hours" },
  { key: "no_successful_backup", label: "No successful backup reported" },
] as const;

export type FreshnessBucket = (typeof FRESHNESS_BUCKETS)[number]["key"];
export type FreshnessCounts = Record<FreshnessBucket, number | null>;

// Provider-normalized categories; Laravel maps Datto Endpoint Backup outcomes onto these.
export const JOB_OUTCOMES = [
  { key: "successful", label: "Successful" },
  { key: "partially_successful", label: "Partially Successful" },
  { key: "degraded_or_failed", label: "Degraded / Failed" },
  { key: "not_available", label: "Not Available" },
] as const;

// Laravel must confirm which basis Datto actually supplies; the two are not interchangeable.
export const OUTCOME_BASES = {
  job_executions: "Backup job executions",
  asset_statuses: "Asset-level reporting statuses",
} as const;

export const OUTCOME_PERIODS = { last_24_hours: "Last 24 Hours" } as const;

export type JobOutcome = (typeof JOB_OUTCOMES)[number]["key"];
export type OutcomeBasis = keyof typeof OUTCOME_BASES;
export type OutcomePeriod = keyof typeof OUTCOME_PERIODS;
export type JobOutcomeCounts = Record<JobOutcome, number | null>;

export type JobOutcomesResource = {
  period: OutcomePeriod;
  basis: OutcomeBasis;
  window_start?: string | null;
  window_end?: string | null;
  counts: Partial<Record<JobOutcome, number | null>> | null;
};

export type JobOutcomes = {
  period: OutcomePeriod;
  basis: OutcomeBasis;
  windowStart: string | null;
  windowEnd: string | null;
  counts: JobOutcomeCounts;
};

export type BackupHealthStatus = "ready" | "stale" | "empty" | "unavailable" | "error";

export type BackupHealthResource = {
  scope: DashboardScope;
  status: BackupHealthStatus;
  protected_assets: number | null;
  freshness: Partial<Record<FreshnessBucket, number | null>> | null;
  job_outcomes?: JobOutcomesResource | null;
  source: string | null;
  last_synced_at?: string | null;
  message?: string | null;
};

export type BackupHealthResponse = { data: BackupHealthResource };

type SyncInfo = { source: string | null; lastSyncedAt: string | null };

export type BackupHealthState =
  | { kind: "loading" }
  | ({
      kind: "ready" | "stale";
      protectedAssets: number | null;
      freshness: FreshnessCounts | null;
      jobOutcomes: JobOutcomes | null;
    } & SyncInfo)
  | ({ kind: "empty" | "unavailable" } & SyncInfo)
  | { kind: "error"; message: string };

// Proposed Quantum Shield Laravel route — not a Datto API endpoint. Laravel authenticates, authorizes the requested
// customer, enforces tenant isolation, talks to Datto Endpoint Backup, normalizes data and aggregates MSP-wide when authorized.
// TODO(api): GET /api/dashboard/backup-health — protected endpoint assets, last successful backup freshness and last-24-hour job outcomes for the requested view
// request: { customer_id?: number }  (omit customer_id for the All Customers view)
// response: { data: { scope: { type: "all" } | { type: "customer", customer_id }, status, protected_assets: number | null, freshness: { less_than_1_hour, 1_to_3_hours, 4_to_24_hours, more_than_24_hours, no_successful_backup } | null, job_outcomes: { period: "last_24_hours", basis: "job_executions" | "asset_statuses", window_start?, window_end?, counts: { successful, partially_successful, degraded_or_failed, not_available } } | null, source, last_synced_at, message } }
export async function getBackupHealth(scope: DashboardScope): Promise<BackupHealthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildUnavailableBackupHealth(scope);
}

const bucketKeys = new Set<string>(FRESHNESS_BUCKETS.map((bucket) => bucket.key));

const optionalCount = (value: unknown): number | null | undefined =>
  value === undefined || value === null ? null : isCount(value) ? value : undefined;

function parseFreshness(value: unknown): FreshnessCounts | null | undefined {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || Object.keys(value).some((key) => !bucketKeys.has(key))) return undefined;
  const counts = {} as FreshnessCounts;
  for (const { key } of FRESHNESS_BUCKETS) {
    const count = optionalCount(value[key]);
    if (count === undefined) return undefined;
    counts[key] = count;
  }
  return Object.values(counts).some((count) => count !== null) ? counts : null;
}

const outcomeKeys = new Set<string>(JOB_OUTCOMES.map((outcome) => outcome.key));
const outcomeFields = new Set(["period", "basis", "window_start", "window_end", "counts"]);

const optionalInstant = (value: unknown): number | null | undefined => {
  if (value === undefined || value === null) return null;
  const time = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? undefined : time;
};

function parseJobOutcomes(value: unknown): JobOutcomes | null | undefined {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || Object.keys(value).some((key) => !outcomeFields.has(key))) return undefined;

  const rawCounts = value.counts ?? {};
  if (!isRecord(rawCounts) || Object.keys(rawCounts).some((key) => !outcomeKeys.has(key))) return undefined;
  const counts = {} as JobOutcomeCounts;
  for (const { key } of JOB_OUTCOMES) {
    const count = optionalCount(rawCounts[key]);
    if (count === undefined) return undefined;
    counts[key] = count;
  }
  if (Object.values(counts).every((count) => count === null)) return null;

  if (typeof value.period !== "string" || !Object.hasOwn(OUTCOME_PERIODS, value.period)) return undefined;
  if (typeof value.basis !== "string" || !Object.hasOwn(OUTCOME_BASES, value.basis)) return undefined;

  const start = optionalInstant(value.window_start);
  const end = optionalInstant(value.window_end);
  if (start === undefined || end === undefined) return undefined;
  if (start !== null && end !== null && start >= end) return undefined;

  return {
    period: value.period as OutcomePeriod,
    basis: value.basis as OutcomeBasis,
    windowStart: start === null ? null : (value.window_start as string),
    windowEnd: end === null ? null : (value.window_end as string),
    counts,
  };
}

export function normalizeBackupHealth(response: unknown, requested: DashboardScope): BackupHealthState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data)) return { kind: "error", message: "Backup data came back in an unexpected format." };

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Backup data did not match the selected customer view." };
  }

  const sync = { source: textOrNull(data.source), lastSyncedAt: timestampOrNull(data.last_synced_at) };

  switch (data.status) {
    case "ready":
    case "stale": {
      const protectedAssets = optionalCount(data.protected_assets);
      if (protectedAssets === undefined) return { kind: "error", message: "Received an invalid protected asset count." };
      const freshness = parseFreshness(data.freshness);
      if (freshness === undefined) return { kind: "error", message: "Received invalid backup freshness counts." };
      const jobOutcomes = parseJobOutcomes(data.job_outcomes);
      if (jobOutcomes === undefined) return { kind: "error", message: "Received invalid backup job outcomes." };
      if (protectedAssets === null && !freshness && !jobOutcomes) {
        return { kind: "error", message: "Backup data was reported without any values." };
      }
      return { kind: data.status, protectedAssets, freshness, jobOutcomes, ...sync };
    }
    case "empty":
    case "unavailable":
      return { kind: data.status, ...sync };
    case "error":
      return { kind: "error", message: textOrNull(data.message) ?? "The backup provider reported an error." };
    default:
      return { kind: "error", message: "Received an unrecognized status." };
  }
}
