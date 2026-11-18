import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { CustomerView } from "@/components/customer-view/customer-view-state";
import type { SecurityCoverageState } from "@/services/security-coverage";
import { securityControlsView } from "@/components/security/security-controls-view";

export const NIST_REFERENCE = "https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20";
export const FRAMEWORK_FUNCTIONS = [
  { name: "GOVERN", description: "Cybersecurity risk strategy, oversight, responsibilities and policies." },
  { name: "IDENTIFY", description: "Understanding organizational assets, risks and dependencies." },
  { name: "PROTECT", description: "Safeguards used to manage cybersecurity risks." },
  { name: "DETECT", description: "Recognizing potentially adverse cybersecurity events." },
  { name: "RESPOND", description: "Managing actions associated with cybersecurity incidents." },
  { name: "RECOVER", description: "Restoring capabilities affected by cybersecurity incidents." },
] as const;

export const EVIDENCE_CATEGORIES = [
  "Security policies and procedures",
  "Asset and system inventory records",
  "Risk assessment documentation",
  "Security awareness and training records",
  "Incident response procedures and exercise records",
  "Backup and recovery test documentation",
] as const;

export const FRAMEWORK_DISCLAIMER = "NIST CSF 2.0 is presented as a cybersecurity risk-management reference. This view is not a formal assessment, audit, certification or determination of compliance.";
export const CONTROL_DISCLOSURE = "These control indicators are simulated security-reporting signals. They are not validated compliance evidence or formal assessments of NIST CSF outcomes.";

export function complianceScope(mode: DashboardMode, view: CustomerView, name?: string) {
  return mode === "live" ? "Customer scope unavailable" : view.mode === "all" ? "All Customers" : name ?? "Customer unavailable";
}

export function complianceControls(state: SecurityCoverageState, mode: DashboardMode, scope: string) {
  return securityControlsView(mode === "live" ? { kind: "unavailable", source: null, lastSyncedAt: null } : state, mode === "demo", scope);
}
