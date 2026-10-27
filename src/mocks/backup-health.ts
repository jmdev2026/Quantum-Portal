import type { DashboardScope } from "@/services/dashboard-response";
import type { BackupHealthResponse } from "@/services/backup-health";

export function buildUnavailableBackupHealth(scope: DashboardScope): BackupHealthResponse {
  return {
    data: {
      scope,
      status: "unavailable",
      protected_assets: null,
      freshness: null,
      job_outcomes: null,
      source: null,
      last_synced_at: null,
      message: "Backup integration not connected.",
    },
  };
}
