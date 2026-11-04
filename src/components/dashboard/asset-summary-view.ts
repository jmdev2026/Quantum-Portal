import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  getAssetSummary,
  getDemoAssetSummary,
  type AssetMetricKey,
  type AssetMetricState,
  type AssetScope,
  type AssetSummaryResponse,
} from "@/services/dashboard-assets";

export type AssetSummaryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; metrics: Record<AssetMetricKey, AssetMetricState> };

export type LoadedAssetSummary = { mode: DashboardMode; customerId: number | null; state: AssetSummaryState };

export const assetSummarySource = (mode: DashboardMode): ((scope: AssetScope) => Promise<AssetSummaryResponse>) =>
  mode === "demo" ? getDemoAssetSummary : getAssetSummary;

// Data loaded for another mode or customer is never shown, even for a single render.
export const visibleAssetSummary = (
  loaded: LoadedAssetSummary,
  mode: DashboardMode,
  customerId: number | null,
): AssetSummaryState => (loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { status: "loading" });
