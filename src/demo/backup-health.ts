import type { DashboardScope } from "@/services/dashboard-response";
import type { BackupHealthResponse, FreshnessBucket, JobOutcome } from "@/services/backup-health";

// Fictional Datto Endpoint Backup demonstration figures. No backup activity was measured, and nothing is sent to any backend.
export const DEMO_BACKUP_SOURCE = "Simulated demo data";

type DemoBackupHealth = {
  protectedAssets: number;
  freshness: Record<FreshnessBucket, number>;
  jobOutcomes: Record<JobOutcome, number>;
};

// Keyed by the IDs in src/mocks/customers.ts (Demo Customer A = 1, B = 2, C = 3).
export const DEMO_CUSTOMER_BACKUP_HEALTH: ReadonlyMap<number, DemoBackupHealth> = new Map([
  [
    1,
    {
      protectedAssets: 18,
      freshness: { less_than_1_hour: 2, "1_to_3_hours": 3, "4_to_24_hours": 9, more_than_24_hours: 3, no_successful_backup: 1 },
      jobOutcomes: { successful: 15, partially_successful: 1, degraded_or_failed: 1, not_available: 2 },
    },
  ],
  [
    2,
    {
      protectedAssets: 27,
      freshness: { less_than_1_hour: 1, "1_to_3_hours": 3, "4_to_24_hours": 11, more_than_24_hours: 9, no_successful_backup: 3 },
      jobOutcomes: { successful: 20, partially_successful: 1, degraded_or_failed: 3, not_available: 3 },
    },
  ],
  [
    3,
    {
      protectedAssets: 16,
      freshness: { less_than_1_hour: 1, "1_to_3_hours": 2, "4_to_24_hours": 8, more_than_24_hours: 3, no_successful_backup: 2 },
      jobOutcomes: { successful: 13, partially_successful: 1, degraded_or_failed: 1, not_available: 2 },
    },
  ],
]);

// Defined explicitly rather than summed in the browser.
export const DEMO_ALL_CUSTOMER_BACKUP_HEALTH: DemoBackupHealth = {
  protectedAssets: 61,
  freshness: { less_than_1_hour: 4, "1_to_3_hours": 8, "4_to_24_hours": 28, more_than_24_hours: 15, no_successful_backup: 6 },
  jobOutcomes: { successful: 48, partially_successful: 3, degraded_or_failed: 5, not_available: 7 },
};

// Unknown customers get an explicit error, never another customer's figures.
export function buildDemoBackupHealth(scope: DashboardScope): BackupHealthResponse {
  const fixture = scope.type === "all" ? DEMO_ALL_CUSTOMER_BACKUP_HEALTH : DEMO_CUSTOMER_BACKUP_HEALTH.get(scope.customer_id);
  if (!fixture) {
    return {
      data: {
        scope,
        status: "error",
        protected_assets: null,
        freshness: null,
        job_outcomes: null,
        source: DEMO_BACKUP_SOURCE,
        last_synced_at: null,
        message: "No demonstration data exists for this customer.",
      },
    };
  }
  return {
    data: {
      scope,
      status: "ready",
      protected_assets: fixture.protectedAssets,
      freshness: { ...fixture.freshness },
      // Illustrative period label only: no reporting window is claimed, so no window timestamps are sent.
      job_outcomes: {
        period: "last_24_hours",
        basis: "job_executions",
        window_start: null,
        window_end: null,
        counts: { ...fixture.jobOutcomes },
      },
      source: DEMO_BACKUP_SOURCE,
      last_synced_at: null,
      message: null,
    },
  };
}
