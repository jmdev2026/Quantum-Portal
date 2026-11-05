import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import { getDemoInsights, getInsights, type InsightsResponse, type InsightsState } from "@/services/insights";

export type LoadedInsights = { mode: DashboardMode; customerId: number | null; state: InsightsState };

export const insightsSource = (mode: DashboardMode): ((scope: DashboardScope) => Promise<InsightsResponse>) =>
  mode === "demo" ? getDemoInsights : getInsights;

// Data loaded for another mode or customer is never shown, even for a single render.
export const visibleInsights = (loaded: LoadedInsights, mode: DashboardMode, customerId: number | null): InsightsState =>
  loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" };
