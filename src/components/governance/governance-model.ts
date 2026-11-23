import { EVIDENCE_CATEGORIES } from "@/components/compliance/compliance-view";
import { PROPOSED_ROLES, INTEGRATION_PLANS } from "@/components/administration/administration-view";
import { TIME_ZONES, REVIEW_CADENCES } from "@/components/customer-workflows/preview-model";
import { isRecord } from "@/services/dashboard-response";
import { scopeValid, type GovernanceData } from "@/services/governance";
import type { KnownCustomer } from "@/services/security-detections";
export const ASSESSMENT_NOTICE = "Demonstration only. This assessment has not been saved, verified, submitted or certified.";
export const EVIDENCE_NOTICE = "Demonstration only. No evidence has been uploaded, stored, submitted or verified.";
export const ACCESS_NOTICE = "Demonstration only. No portal access or permissions have been changed.";
export const INTEGRATION_NOTICE = "Configuration preview only. No provider integration has been connected or modified.";
export const REVIEW_STATES = ["Not Reviewed", "Review Needed", "Evidence Needed", "Reviewed for Demonstration"] as const;
export const safeNotes = (text: string, required = false) => typeof text === "string" && ((!required && text === "") || (text.length >= 12 && text.length <= 240 && /^Demo: [A-Za-z][A-Za-z ,.'()-]*$/.test(text) && !/password|credential|token|secret|api key|www\.|[a-z]\.[a-z]/i.test(text)));
export const uniqueChoices = (values: string[], choices: readonly string[], required = false) => Array.isArray(values) && (!required || values.length > 0) && new Set(values).size === values.length && values.every(value => choices.includes(value));
export type ControlReview = { control: string; state: string; notes: string; categories: string[] };
export type AssessmentDraft = { customer: number | null; framework: string; entries: ControlReview[] };
export const emptyAssessment = (customer: number | null): AssessmentDraft => ({ customer, framework: "NIST CSF 2.0", entries: [] });
export function validateAssessment(draft: AssessmentDraft, data: GovernanceData, selected: number | null, registry: readonly KnownCustomer[]): string | null {
  if (!isRecord(draft) || !Array.isArray(draft.entries) || draft.entries.some(entry => !isRecord(entry))) return "Malformed assessment draft rejected.";
  if (!scopeValid(draft.customer, selected, registry) || draft.framework !== "NIST CSF 2.0") return "Choose a valid fictional customer in the current scope and the supplied framework.";
  if (!draft.entries.length || new Set(draft.entries.map(entry => entry.control)).size !== draft.entries.length) return "Include at least one unique existing control.";
  if (draft.entries.some(entry => !data.controls.some(control => control.key === entry.control) || !REVIEW_STATES.includes(entry.state as typeof REVIEW_STATES[number]) || !safeNotes(entry.notes) || !uniqueChoices(entry.categories, EVIDENCE_CATEGORIES))) return "Use existing controls, local review states, supported evidence categories and safe Demo-prefixed notes.";
  return null;
}
export const assessmentProgress = (entries: ControlReview[]) => ({ reviewed: entries.filter(entry => entry.state === "Reviewed for Demonstration").length, included: entries.length });
export type EvidenceDraft = { customer: number | null; control: string; category: string; description: string; notes: string };
export const emptyEvidence = (customer: number | null): EvidenceDraft => ({ customer, control: "", category: "", description: "", notes: "" });
export function validateEvidence(draft: EvidenceDraft, data: GovernanceData, selected: number | null, registry: readonly KnownCustomer[]) {
  if (!isRecord(draft)) return "Malformed evidence draft rejected.";
  if (!scopeValid(draft.customer, selected, registry) || !data.controls.some(control => control.key === draft.control) || !EVIDENCE_CATEGORIES.includes(draft.category as typeof EVIDENCE_CATEGORIES[number])) return "Choose a current fictional customer, existing control and supplied category.";
  if (!safeNotes(draft.description, true) || !safeNotes(draft.notes)) return "Use 12–240-character Demo-prefixed descriptions/notes without sensitive information or links.";
  return null;
}
export const PERMISSIONS = [
  { name: "Assigned dashboards", category: "Reporting", description: "Assigned tenant summaries only; never unrestricted portfolio access.", proposed: ["Assigned tenants", "Own tenant", "Own tenant"] },
  { name: "Security findings", category: "Reporting", description: "Sensitive findings require separately approved field-level policy.", proposed: ["Policy review", "Policy review", "Summary only"] },
  { name: "Backup information", category: "Reporting", description: "Read-only information; no recovery authority.", proposed: ["Assigned tenants", "Own tenant", "Summary only"] },
  { name: "Reports", category: "Reporting", description: "Generation/download permissions must be checked independently.", proposed: ["Assigned tenants", "Own tenant", "Approved summaries"] },
  { name: "Identity/device details", category: "Sensitive data", description: "Personal and security fields require explicit grants.", proposed: ["Policy review", "Policy review", "Not proposed"] },
  { name: "Configure reports", category: "Configuration", description: "Separate configuration and delivery rights.", proposed: ["Policy review", "Policy review", "Not proposed"] },
  { name: "Manage portal members", category: "Access", description: "Cannot grant beyond authorized tenant and actor privilege.", proposed: ["Policy review", "Policy review", "Not proposed"] },
  { name: "Review evidence", category: "Sensitive data", description: "Reviewer permission is separate from evidence read access.", proposed: ["Policy review", "Policy review", "Not proposed"] },
  { name: "Manage integrations", category: "Configuration", description: "Server-owned secrets and verified provider scopes required.", proposed: ["Policy review", "Not proposed", "Not proposed"] },
  { name: "View audit events", category: "Sensitive data", description: "Tenant-scoped restricted logs, not broad event enumeration.", proposed: ["Policy review", "Policy review", "Not proposed"] },
  { name: "Privileged actions", category: "Access", description: "No privileged action allowed by this proposed matrix.", proposed: ["Not proposed", "Not proposed", "Not proposed"] },
] as const;
export type AccessDraft = { customer: number | null; identity: string; role: string; recipients: string; explanation: string };
export const emptyAccess = (customer: number | null): AccessDraft => ({ customer, identity: "", role: "Client Viewer", recipients: "", explanation: "" });
export function validateAccess(draft: AccessDraft, data: GovernanceData, selected: number | null, registry: readonly KnownCustomer[], invitation: boolean) {
  if (!isRecord(draft) || typeof draft.recipients !== "string") return "Malformed access draft rejected.";
  if (!scopeValid(draft.customer, selected, registry) || !PROPOSED_ROLES.some(role => role.name === draft.role) || draft.role === "MSP Administrator") return "Choose a current customer and a client role. Portfolio-level role assignment requires separate backend policy review.";
  if (!safeNotes(draft.explanation)) return "Use safe Demo-prefixed notes without personal or sensitive information.";
  if (!invitation && !data.identities.some(identity => identity.id === draft.identity && identity.customerId === draft.customer)) return "Choose a canonical fictional identity belonging to the selected customer.";
  const emails = draft.recipients.split(",").map(value => value.trim());
  if (invitation && (emails.length > 5 || new Set(emails).size !== emails.length || emails.some(value => value.length > 80 || !/^[a-z]+(?:[.-][a-z]+)*@demo\.example\.(com|net|org)$/.test(value)))) return "Use up to five unique reserved fictional email addresses, separated by commas.";
  return null;
}
export const INTEGRATION_CATEGORIES = ["Security reporting", "Identity and endpoint visibility", "Backup reporting", "Reporting aggregation"] as const;
export const INTEGRATION_PERMISSIONS = ["Proposed read-only data", "Tenant mapping review", "Provider scope verification"] as const;
export type IntegrationDraft = { customer: number | null; provider: string; categories: string[]; permissions: string[] };
export const emptyIntegration = (customer: number | null): IntegrationDraft => ({ customer, provider: INTEGRATION_PLANS[0].name, categories: [], permissions: [] });
export function validateIntegration(draft: IntegrationDraft, selected: number | null, registry: readonly KnownCustomer[]) {
  return isRecord(draft) && scopeValid(draft.customer, selected, registry) && INTEGRATION_PLANS.some(provider => provider.name === draft.provider) && uniqueChoices(draft.categories, INTEGRATION_CATEGORIES, true) && uniqueChoices(draft.permissions, INTEGRATION_PERMISSIONS, true) ? null : "Choose a current customer, planned provider and supported unique categories/permission-review options.";
}
export const NOTIFICATION_CATEGORIES = ["Critical security alerts", "Dark Web exposure alerts", "Backup attention notifications", "Training reminders", "Report-ready notifications", "Compliance evidence review reminders"] as const;
export type PortalDraft = { density: string; presentation: string; cadence: string; zone: string; notifications: string[] };
export const emptyPortal = (): PortalDraft => ({ density: "Comfortable", presentation: "Detailed", cadence: "Monthly", zone: "UTC", notifications: [] });
export function validatePortal(draft: PortalDraft) { return isRecord(draft) && ["Comfortable", "Compact"].includes(draft.density) && ["Detailed", "Summary"].includes(draft.presentation) && REVIEW_CADENCES.includes(draft.cadence as typeof REVIEW_CADENCES[number]) && TIME_ZONES.includes(draft.zone as typeof TIME_ZONES[number]) && uniqueChoices(draft.notifications, NOTIFICATION_CATEGORIES) ? null : "Choose supplied display, report, cadence, zone and notification values."; }
