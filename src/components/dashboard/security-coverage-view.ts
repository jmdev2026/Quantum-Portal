import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  getDemoSecurityCoverage,
  getSecurityCoverage,
  type SecurityCoverageResponse,
  type SecurityCoverageState,
} from "@/services/security-coverage";

export type LoadedSecurityCoverage = { mode: DashboardMode; customerId: number | null; state: SecurityCoverageState };

export const securityCoverageSource = (mode: DashboardMode): ((scope: DashboardScope) => Promise<SecurityCoverageResponse>) =>
  mode === "demo" ? getDemoSecurityCoverage : getSecurityCoverage;

// Data loaded for another mode or customer is never shown, even for a single render.
export const visibleSecurityCoverage = (
  loaded: LoadedSecurityCoverage,
  mode: DashboardMode,
  customerId: number | null,
): SecurityCoverageState => (loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" });
