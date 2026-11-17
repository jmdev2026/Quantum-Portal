import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { BACKUP_PROVIDER_NAME } from "@/components/backup/backup-view";
import type { BackupAsset, BackupAssetsState } from "@/services/backup-assets";

export const PROTECTED_ASSETS_DISCLOSURE =
  "Illustrative asset samples only. This list is not a complete endpoint backup inventory, and protection has not been verified.";

export const PROTECTION_LABEL = "Protection not verified";

export type LoadedBackupAssets = { mode: DashboardMode; customerId: number | null; state: BackupAssetsState };

// Records loaded for another mode or customer are never shown, even for a single render.
export const visibleBackupAssets = (loaded: LoadedBackupAssets, mode: DashboardMode, customerId: number | null): BackupAssetsState => {
  if (mode === "live") return { kind: "unavailable" };
  return loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" };
};

export type ProtectedAssetsStatus = "not-connected" | "loading" | "simulated" | "demo-empty" | "error";

export type ProtectedAssetsView =
  | { status: "simulated"; badge: string; records: BackupAsset[] }
  | { status: Exclude<ProtectedAssetsStatus, "simulated">; badge: string; title: string; body: string };

export function protectedAssetsView(state: BackupAssetsState, scopeLabel: string): ProtectedAssetsView {
  switch (state.kind) {
    case "unavailable":
      return {
        status: "not-connected",
        badge: "Not connected",
        title: "Protected asset information is not connected.",
        body: `${BACKUP_PROVIDER_NAME} is not connected, so no assets are listed for ${scopeLabel}. This does not mean there are no assets, and it does not indicate whether any endpoint is protected.`,
      };
    case "loading":
      return { status: "loading", badge: "Loading", title: "Loading example assets…", body: `Preparing fictional asset samples for ${scopeLabel}.` };
    case "error":
      return { status: "error", badge: "Unavailable", title: "Example assets could not be shown.", body: state.message };
    case "ready":
      return state.records.length > 0
        ? { status: "simulated", badge: "Simulated", records: state.records }
        : {
            status: "demo-empty",
            badge: "Simulated",
            title: `No example assets for ${scopeLabel}.`,
            body: "This does not mean the customer has no assets.",
          };
  }
}
