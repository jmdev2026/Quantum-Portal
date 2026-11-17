import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { BACKUP_PROVIDER_NAME } from "@/components/backup/backup-view";
import type { BackupJob, BackupJobsState } from "@/services/backup-job-activity";

export const JOB_ACTIVITY_DISCLOSURE =
  "Illustrative backup job examples only. These records are separate from the Backup Overview job-execution summaries and do not represent actual backup activity.";

export const JOB_ACTIVITY_PLANNED_LABEL = "Planned job details";
export const JOB_ACTIVITY_PLANNED = ["Job outcome", "Associated customer", "Reporting period", "Further details once confirmed by the provider"] as const;

export type LoadedBackupJobs = { mode: DashboardMode; customerId: number | null; state: BackupJobsState };

// Records loaded for another mode or customer are never shown, even for a single render.
export const visibleBackupJobs = (loaded: LoadedBackupJobs, mode: DashboardMode, customerId: number | null): BackupJobsState => {
  if (mode === "live") return { kind: "unavailable" };
  return loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" };
};

export type JobActivityStatus = "not-connected" | "loading" | "simulated" | "demo-empty" | "error";

export type JobActivityView =
  | { status: "simulated"; badge: string; records: BackupJob[] }
  | { status: Exclude<JobActivityStatus, "simulated">; badge: string; title: string; body: string };

export function jobActivityView(state: BackupJobsState, scopeLabel: string): JobActivityView {
  switch (state.kind) {
    case "unavailable":
      return {
        status: "not-connected",
        badge: "Not connected",
        title: "Backup job activity is not connected.",
        body: `${BACKUP_PROVIDER_NAME} is not connected, so no job activity is shown for ${scopeLabel}. This does not mean there are no failed jobs, and it does not indicate that backups are working.`,
      };
    case "loading":
      return { status: "loading", badge: "Loading", title: "Loading example jobs…", body: `Preparing fictional job examples for ${scopeLabel}.` };
    case "error":
      return { status: "error", badge: "Unavailable", title: "Example jobs could not be shown.", body: state.message };
    case "ready":
      return state.records.length > 0
        ? { status: "simulated", badge: "Simulated", records: state.records }
        : {
            status: "demo-empty",
            badge: "Simulated",
            title: `No example jobs for ${scopeLabel}.`,
            body: "This does not mean the customer has no backup jobs.",
          };
  }
}
