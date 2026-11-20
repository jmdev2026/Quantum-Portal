import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { BackupAsset, BackupAssetsState } from "@/services/backup-assets";
import type { BackupJob, BackupJobsState } from "@/services/backup-job-activity";
import { JOB_OUTCOMES, type JobOutcome } from "@/services/backup-health";
import type { KnownCustomer } from "@/services/security-detections";

export type BackupExplorerKind = "assets" | "jobs";
export type BackupExample = BackupAsset | BackupJob;
export type BackupExampleState = BackupAssetsState | BackupJobsState;
export type BackupFilters = { search: string; status: string; sort: string };
export const isBackupJob = (record: BackupExample): record is BackupJob => "outcome" in record;
export const backupExampleLabel = (record: BackupExample) => isBackupJob(record) ? record.title : record.name;
export const backupExampleStatus = (record: BackupExample) => isBackupJob(record) ? record.outcome : record.protectionState;
export const backupOutcomeLabel = (outcome: JobOutcome) => JOB_OUTCOMES.find(item => item.key === outcome)!.label;
export const backupStatusOptions = (kind: BackupExplorerKind): readonly string[] => kind === "assets" ? ["Not verified"] : JOB_OUTCOMES.map(item => item.key);
export const backupSortOptions = ["name-asc", "name-desc", "customer", "status"] as const;
export const emptyBackupFilters = (): BackupFilters => ({ search: "", status: "all", sort: "name-asc" });
export function updateBackupFilters(filters: BackupFilters, key: keyof BackupFilters, value: string, kind: BackupExplorerKind): BackupFilters {
  if (key === "search") return { ...filters, search: value.slice(0, 200) };
  if (key === "status" && (value === "all" || backupStatusOptions(kind).includes(value))) return { ...filters, status: value };
  if (key === "sort" && backupSortOptions.some(option => option === value)) return { ...filters, sort: value };
  return filters;
}
export function filterBackupExamples(records: readonly BackupExample[], filters: BackupFilters): BackupExample[] {
  const query = filters.search.trim().toLowerCase();
  return records.filter(record => {
    const text = [backupExampleLabel(record), record.customerName, backupExampleStatus(record), isBackupJob(record) ? backupOutcomeLabel(record.outcome) : record.protectionState, isBackupJob(record) ? record.description : record.visibilityNote].join(" ").toLowerCase();
    return text.includes(query) && (filters.status === "all" || backupExampleStatus(record) === filters.status);
  }).sort((a, b) => {
    const name = backupExampleLabel(a).localeCompare(backupExampleLabel(b));
    const primary = filters.sort === "name-desc" ? -name : filters.sort === "customer" ? a.customerName.localeCompare(b.customerName) : filters.sort === "status" ? backupExampleStatus(a).localeCompare(backupExampleStatus(b)) : name;
    return primary || a.id.localeCompare(b.id);
  });
}
export type LoadedBackupExamples = { kind: BackupExplorerKind; mode: DashboardMode; customerId: number | null; registry: readonly KnownCustomer[] | null; attempt: number; state: BackupExampleState };
export function visibleBackupExamples(loaded: LoadedBackupExamples, kind: BackupExplorerKind, mode: DashboardMode, customerId: number | null, registry: readonly KnownCustomer[] | null, attempt: number): BackupExampleState {
  if (mode === "live") return { kind: "unavailable" };
  if (!registry) return { kind: "loading" };
  if (customerId !== null && !registry.some(customer => customer.id === customerId)) return { kind: "error", message: "Selected customer is unavailable. No broader scope was loaded." };
  if (loaded.kind !== kind || loaded.mode !== mode || loaded.customerId !== customerId || loaded.registry !== registry || loaded.attempt !== attempt) return { kind: "loading" };
  if (loaded.state.kind === "ready" && loaded.state.records.some(record => registry.find(customer => customer.id === record.customerId)?.name !== record.customerName || (customerId !== null && record.customerId !== customerId) || isBackupJob(record) !== (kind === "jobs"))) return { kind: "error", message: "Example records do not match the current customer context." };
  return loaded.state;
}
export function selectBackupExample(state: BackupExampleState | { kind: "ready"; records: readonly BackupExample[] }, id: string): BackupExample | null {
  return state.kind === "ready" ? state.records.find(record => record.id === id) ?? null : null;
}
export const BACKUP_OUTCOME_EXPLANATIONS: Record<JobOutcome, string> = {
  successful: "An illustrative successful execution category. It does not verify data integrity, restore testing, recovery points or recoverability.",
  partially_successful: "An illustrative partial execution category requiring provider-specific interpretation. It does not establish full workload coverage or a recoverable backup.",
  degraded_or_failed: "An illustrative degraded or failed execution category. Provider evidence and authorized investigation are required; it is not a verified recoverability result.",
  not_available: "Execution outcome information is not available in this category. Missing reporting is not automatically a failed job, a successful backup or a safe workload.",
};
