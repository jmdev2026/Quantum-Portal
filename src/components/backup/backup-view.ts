import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";

export type BackupSectionId = "backup-overview" | "protected-assets" | "backup-job-activity" | "recovery-information";

// Provisional presentation shape for page copy only; not a provider or Laravel contract.
export type BackupSection = {
  id: BackupSectionId;
  title: string;
  description: string;
};

export const BACKUP_PROVIDER_NAME = "Datto Endpoint Backup";

export const BACKUP_SECTIONS: readonly BackupSection[] = [
  {
    id: "backup-overview",
    title: "Backup Overview",
    description: "Summary of endpoint backup reporting for the selected scope.",
  },
  {
    id: "protected-assets",
    title: "Protected Assets",
    description: "Endpoint assets reported by the backup system for the selected customer view.",
  },
  {
    id: "backup-job-activity",
    title: "Backup Job Activity",
    description: "Review illustrative backup job outcomes and reporting information for the selected customer.",
  },
  {
    id: "recovery-information",
    title: "Recovery Information",
    description: "Recovery visibility and restore capability information for the selected customer.",
  },
];

export const BACKUP_LIVE_NOTICE = `${BACKUP_PROVIDER_NAME} is not connected. No protected assets, backup jobs, recovery points or sync times are shown.`;

export const BACKUP_DEMO_PAGE_NOTICE =
  "This page shows a simulated backup overview, illustrative asset samples and illustrative job examples. The overview uses the same fictional figures as the Dashboard's Backup Health summary. No actual recovery information is available.";

export function backupAnnouncement(mode: DashboardMode, scopeLabel: string) {
  return mode === "demo"
    ? `Backup and Recovery demonstration view for ${scopeLabel}. Simulated overview, illustrative asset samples and illustrative job examples shown; no recovery information is available.`
    : `Backup and Recovery for ${scopeLabel}. Backup integration not connected.`;
}
