import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  getDemoSecuritySeverity,
  getSecuritySeverity,
  type SecuritySeverityResponse,
  type SecuritySeverityState,
} from "@/services/security-severity";

export type LoadedSecuritySeverity = { mode: DashboardMode; customerId: number | null; state: SecuritySeverityState };

export const securitySeveritySource = (mode: DashboardMode): ((scope: DashboardScope) => Promise<SecuritySeverityResponse>) =>
  mode === "demo" ? getDemoSecuritySeverity : getSecuritySeverity;

// Data loaded for another mode or customer is never shown, even for a single render.
export const visibleSecuritySeverity = (
  loaded: LoadedSecuritySeverity,
  mode: DashboardMode,
  customerId: number | null,
): SecuritySeverityState => (loaded.mode === mode && loaded.customerId === customerId ? loaded.state : { kind: "loading" });
