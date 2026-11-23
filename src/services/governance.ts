import { evidenceRegisterResponse } from "@/mocks/evidence-register";
import { auditSchemaResponse } from "@/mocks/audit-schema";
import { SECURITY_CONTROLS, getDemoSecurityCoverage, normalizeSecurityCoverage, type ControlStatuses } from "@/services/security-coverage";
import { getDemoVisibilityRecords, normalizeDemoVisibilityRecords, type VisibilityRecord } from "@/services/security-visibility-records";
import { EVIDENCE_CATEGORIES } from "@/components/compliance/compliance-view";
import { AUDIT_EVENT_TYPES } from "@/components/administration/administration-view";
import { isRecord, parseScope, type DashboardScope } from "@/services/dashboard-response";
import type { KnownCustomer } from "@/services/security-detections";
export type EvidenceExample = typeof evidenceRegisterResponse.data[number];
export type AuditExample = typeof auditSchemaResponse.data[number];
export type GovernanceData = { controls: typeof SECURITY_CONTROLS; statuses: ControlStatuses; identities: VisibilityRecord[]; evidence: EvidenceExample[]; audit: AuditExample[] };
export type GovernanceState = { kind: "loading" | "unavailable" } | { kind: "error"; message: string } | { kind: "ready"; data: GovernanceData };
export function scopeValid(customer: number | null, selected: number | null, registry: readonly KnownCustomer[]) { return customer !== null && Number.isSafeInteger(customer) && registry.some(row => row.id === customer) && (selected === null || customer === selected); }
export function normalizeGovernanceExamples(response: unknown, kind: "evidence" | "audit", scope: DashboardScope, registry: readonly KnownCustomer[]): boolean {
  if (!parseScope(scope) || (scope.type === "customer" && !registry.some(row => row.id === scope.customer_id)) || !isRecord(response) || !Array.isArray(response.data) || Object.keys(response).join() !== "data" || response.data.length > 30) return false;
  const originals = kind === "evidence" ? evidenceRegisterResponse.data : auditSchemaResponse.data;
  const ids = new Set<string>();
  return response.data.every(row => {
    if (!isRecord(row) || !isRecord(row.customer) || typeof row.id !== "string" || ids.has(row.id) || row.is_demo !== true) return false;
    const customerRecord = row.customer;
    if (!registry.some(customer => customer.id === customerRecord.id && customer.name === customerRecord.name) || (scope.type === "customer" && scope.customer_id !== customerRecord.id)) return false;
    ids.add(row.id);
    if (kind === "evidence") {
      if (!isRecord(row.control)) return false;
      const reference = row.control;
      if (!SECURITY_CONTROLS.some(control => control.key === reference.key) || !EVIDENCE_CATEGORIES.includes(row.category as typeof EVIDENCE_CATEGORIES[number])) return false;
    }
    if (kind === "audit" && !AUDIT_EVENT_TYPES.includes(row.category as typeof AUDIT_EVENT_TYPES[number])) return false;
    return originals.some(original => original.id === row.id && JSON.stringify(original) === JSON.stringify(row));
  });
}
// TODO(api): GET /governance/preview — provisional local read seam, not an approved backend endpoint
// request: { scope, mode }
// response: { kind, data?: { controls, statuses, identities, evidence, audit }, message? }
export async function getGovernanceData(scope: DashboardScope, registry: readonly KnownCustomer[], mode: "demo" | "live"): Promise<GovernanceState> {
  if (mode === "live") return { kind: "unavailable" };
  if (!parseScope(scope) || (scope.type === "customer" && !registry.some(row => row.id === scope.customer_id))) return { kind: "error", message: "Invalid customer context. No All Customers fallback is permitted." };
  const [coverageRaw, identitiesRaw] = await Promise.all([getDemoSecurityCoverage(scope), getDemoVisibilityRecords("identities", scope)]);
  const coverage = normalizeSecurityCoverage(coverageRaw, scope), identities = normalizeDemoVisibilityRecords(identitiesRaw, "identities", scope, registry);
  if (coverage.kind !== "ready" || !coverage.controls || identities.kind !== "ready") return { kind: "error", message: "Governance examples failed canonical source validation." };
  const inScope = (row: { customer: KnownCustomer }) => scope.type === "all" || row.customer.id === scope.customer_id;
  const evidence = structuredClone({ data: evidenceRegisterResponse.data.filter(inScope) }), audit = structuredClone({ data: auditSchemaResponse.data.filter(inScope) });
  if (!normalizeGovernanceExamples(evidence, "evidence", scope, registry) || !normalizeGovernanceExamples(audit, "audit", scope, registry)) return { kind: "error", message: "Evidence or audit schema relationships are invalid." };
  return { kind: "ready", data: { controls: SECURITY_CONTROLS, statuses: coverage.controls, identities: identities.records, evidence: evidence.data, audit: audit.data } };
}
