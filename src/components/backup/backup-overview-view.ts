import { BACKUP_PROVIDER_NAME } from "@/components/backup/backup-view";
import type { BackupHealthState } from "@/services/backup-health";

export const FRESHNESS_SEPARATE_NOTE =
  "Freshness counts are reported separately and are not expected to add up to the protected asset count.";

export const OUTCOMES_DEMO_NOTE =
  "These are illustrative counts of fictional backup job executions. They are not protected asset counts and do not describe actual activity during the last 24 hours.";

export type BackupOverviewStatus = "loading" | "simulated" | "reported" | "stale" | "not-connected" | "empty" | "error";

export type BackupOverviewView = { status: BackupOverviewStatus; badge: string; title: string; body: string };

export function backupOverviewView(state: BackupHealthState, simulated: boolean, scopeLabel: string): BackupOverviewView {
  switch (state.kind) {
    case "loading":
      return { status: "loading", badge: "Loading", title: "Loading backup summary…", body: `Preparing the backup summary for ${scopeLabel}.` };
    case "ready":
      return simulated
        ? {
            status: "simulated",
            badge: "Simulated",
            title: "Simulated demo data",
            body: `Fictional figures for ${scopeLabel}, matching the Dashboard's Backup Health summary. No provider connection exists and no sync time is shown.`,
          }
        : { status: "reported", badge: "Reported", title: "Reported by the backup provider", body: `Backup summary for ${scopeLabel}.` };
    case "stale":
      return {
        status: "stale",
        badge: simulated ? "Simulated · stale" : "Stale",
        title: "Data may be out of date",
        body: `The backup summary for ${scopeLabel} has not been refreshed recently.`,
      };
    case "unavailable":
      return {
        status: "not-connected",
        badge: "Not connected",
        title: "Awaiting integration",
        body: `${BACKUP_PROVIDER_NAME} is not connected, so no backup summary is available for ${scopeLabel}. This does not mean there are zero backup issues or that any backups have succeeded.`,
      };
    case "empty":
      return {
        status: "empty",
        badge: "No data yet",
        title: "No backup data reported yet",
        body: `The backup provider has not reported data for ${scopeLabel}. This does not indicate whether endpoints are backed up.`,
      };
    case "error":
      return { status: "error", badge: "Unavailable", title: "Backup summary could not be shown.", body: state.message };
  }
}
