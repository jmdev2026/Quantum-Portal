import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  getBackupHealth,
  getDemoBackupHealth,
  type BackupHealthResponse,
  type BackupHealthState,
} from "@/services/backup-health";

export type LoadedBackupHealth = { mode: DashboardMode; customerId: number | null; state: BackupHealthState };

export const backupHealthSource = (mode: DashboardMode): ((scope: DashboardScope) => Promise<BackupHealthResponse>) =>
  mode === "demo" ? getDemoBackupHealth : getBackupHealth;

// Data loaded for another mode or customer is never shown, even for a single render.
export const visibleBackupHealth = (
  loaded: LoadedBackupHealth,
  mode: DashboardMode,
  customerId: number | null,
): BackupHealthState => (loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" });
