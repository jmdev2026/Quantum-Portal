import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { BACKUP_PROVIDER_NAME } from "@/components/backup/backup-view";

export const RESTORE_UNAVAILABLE = "Restore operations are not available in Quantum Shield Command.";

export type RecoveryAreaId = "recovery-visibility" | "recovery-points" | "restore-operations" | "integration-verification";

export type RecoveryArea = { id: RecoveryAreaId; title: string; status: string; body: string };

export type RecoveryInformation = { badge: string; areas: readonly RecoveryArea[] };

// Informational copy only: no recovery records, dates or restore capability exist in this application.
export function recoveryInformation(mode: DashboardMode, scopeLabel: string): RecoveryInformation {
  const demo = mode === "demo";
  return {
    badge: demo ? "Demo · informational" : "Not connected",
    areas: [
      {
        id: "recovery-visibility",
        title: "Recovery Visibility",
        status: demo ? "No recovery data" : "Not connected",
        body: demo
          ? `No actual recovery-point data is available for ${scopeLabel}. Demo Mode does not include recovery records, and the example assets on this page are not restorable through this application.`
          : `Live recovery information is not connected for ${scopeLabel}. This does not indicate whether data can or cannot be recovered.`,
      },
      {
        id: "recovery-points",
        title: "Recovery Points",
        status: "Not shown",
        body: "Recovery-point inventory and available restore dates cannot be shown until supported provider functionality is verified and integrated. No recovery points or dates are displayed.",
      },
      {
        id: "restore-operations",
        title: "Restore Operations",
        status: "Not available",
        body: `${RESTORE_UNAVAILABLE} Restores cannot be requested, scheduled or approved through this interface.`,
      },
      {
        id: "integration-verification",
        title: "Integration Verification",
        status: "Pending verification",
        body: `Any future recovery features depend on confirming the capabilities and permissions actually supported by the ${BACKUP_PROVIDER_NAME} API and implementing them securely through the Laravel backend. No recovery capability has been confirmed.`,
      },
    ],
  };
}
