import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";

export type BackupSectionId = "backup-overview" | "protected-assets" | "backup-job-activity" | "recovery-information";

// Provisional presentation shape for page copy only; not a provider or Laravel contract.
export type BackupSection = {
  id: BackupSectionId;
  title: string;
  description: string;
  plannedLabel: string;
  planned: readonly string[];
};

export const BACKUP_PROVIDER_NAME = "Datto Endpoint Backup";

export const BACKUP_SECTIONS: readonly BackupSection[] = [
  {
    id: "backup-overview",
    title: "Backup Overview",
    description: "Summary of endpoint backup reporting for the selected scope.",
    plannedLabel: "Planned summary information",
    planned: ["Protected assets", "Backup freshness", "Backup job outcomes", "Reporting availability"],
  },
  {
    id: "protected-assets",
    title: "Protected Assets",
    description: "Endpoint assets reported by the backup system for the selected customer view.",
    plannedLabel: "Planned asset details",
    planned: ["Asset display name", "Associated customer", "Backup reporting visibility", "Backup status when supported"],
  },
  {
    id: "backup-job-activity",
    title: "Backup Job Activity",
    description: "Read-only visibility into reported backup executions and their outcomes.",
    plannedLabel: "Planned job details",
    planned: ["Job outcome", "Associated customer or asset", "Reporting period", "Further details once confirmed by the provider"],
  },
  {
    id: "recovery-information",
    title: "Recovery Information",
    description: "Reserved for recovery and restore visibility, subject to verified provider capabilities.",
    plannedLabel: "Pending provider verification",
    planned: ["Restore visibility", "Recovery points", "Retention visibility"],
  },
];

export const BACKUP_LIVE_NOTICE = `${BACKUP_PROVIDER_NAME} is not connected. No protected assets, backup jobs, recovery points or sync times are shown.`;

export const BACKUP_DEMO_PAGE_NOTICE =
  "Detailed backup demonstration information has not been added to this page yet. The main Dashboard contains separate simulated Backup Health summaries.";

export const RECOVERY_DISCLAIMER = `This application does not restore data. Restore features, recovery points and retention visibility depend on verified ${BACKUP_PROVIDER_NAME} capabilities and are not available.`;

export type BackupSectionState = {
  badge: string;
  title: string;
  body: string;
};

export function backupSectionState(mode: DashboardMode, scopeLabel: string): BackupSectionState {
  if (mode === "demo") {
    return {
      badge: "Demo · not yet populated",
      title: "Demonstration details coming later",
      body: `Detailed records and visualizations for ${scopeLabel} will be introduced in later updates. No provider connection exists.`,
    };
  }
  return {
    badge: "Not connected",
    title: "Backup integration not connected",
    body: `No backup information is available for ${scopeLabel}. An unavailable backup feed does not mean there are zero backup issues or that any backups have succeeded.`,
  };
}

export function backupAnnouncement(mode: DashboardMode, scopeLabel: string) {
  return mode === "demo"
    ? `Backup and Recovery demonstration view for ${scopeLabel}. Sections are not yet populated.`
    : `Backup and Recovery for ${scopeLabel}. Backup integration not connected.`;
}
