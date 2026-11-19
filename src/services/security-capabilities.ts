import { externalFootprintResponse } from "@/mocks/external-footprint";
import { emailProtectionResponse } from "@/mocks/email-protection";
import { cloudDataProtectionResponse } from "@/mocks/cloud-data-protection";
import { isRecord, parseScope, sameScope, parseInstant, type DashboardScope } from "@/services/dashboard-response";
import { getDemoSecurityDetections, normalizeDemoSecurityDetections, type KnownCustomer } from "@/services/security-detections";
import { getDemoVisibilityRecords, normalizeDemoVisibilityRecords } from "@/services/security-visibility-records";
import { CAPABILITY_CATEGORIES, CAPABILITY_SOURCE, ILLUSTRATIVE_STATUSES, type CapabilityId, type NewCapabilityId, type CapabilityResource, type CapabilityResponse, type CapabilityState } from "@/services/security-capability-types";
import { SEVERITY_LEVELS } from "@/services/security-severity";

async function scopedFixture(fixture: { data: CapabilityResource[] }, capability: NewCapabilityId, scope: DashboardScope): Promise<CapabilityResponse> {
  await new Promise(resolve => setTimeout(resolve, 250));
  const valid = scope.type === "all" || fixture.data.some(record => record.customer.id === scope.customer_id);
  return structuredClone({ data: valid ? fixture.data.filter(record => scope.type === "all" || record.customer.id === scope.customer_id) : [], meta: { scope, capability, source: CAPABILITY_SOURCE, status: valid ? "ready" : "error", message: valid ? null : "No fictional records exist for this customer scope." } });
}

// TODO(api): GET /api/security/external-footprint — proposed application read contract, not a verified provider API
// request: { scope }
// response: { data: [...], meta: { scope, capability, source, status, message } }
export function getExternalFootprint(scope: DashboardScope) { return scopedFixture(externalFootprintResponse, "external-footprint", scope); }

// TODO(api): GET /api/security/email-protection — proposed application read contract, email provider unverified
// request: { scope }
// response: { data: [...], meta: { scope, capability, source, status, message } }
export function getEmailProtection(scope: DashboardScope) { return scopedFixture(emailProtectionResponse, "email-protection", scope); }

// TODO(api): GET /api/security/cloud-data-protection — proposed application read contract, not a backup API
// request: { scope }
// response: { data: [...], meta: { scope, capability, source, status, message } }
export function getCloudDataProtection(scope: DashboardScope) { return scopedFixture(cloudDataProtectionResponse, "cloud-data-protection", scope); }

const keys = (value: Record<string, unknown>, expected: string[]) => Object.keys(value).sort().join() === [...expected].sort().join();
const text = (value: unknown, limit: number) => typeof value === "string" && value.trim().length > 0 && value.length <= limit && !/[<>]|javascript:|https?:|@|\b\d{1,3}(\.\d{1,3}){3}\b/i.test(value);
const error = (): CapabilityState => ({ kind: "error", message: "Fictional observations were invalid or did not match the customer scope." });

export function normalizeCapabilityRecords(response: unknown, kind: NewCapabilityId, requested: DashboardScope, customers: readonly KnownCustomer[]): CapabilityState {
  const registry = new Map(customers.map(customer => [customer.id, customer.name]));
  if (requested.type === "customer" && (!Number.isSafeInteger(requested.customer_id) || requested.customer_id <= 0 || !registry.has(requested.customer_id))) return error();
  if (!isRecord(response) || !keys(response, ["data", "meta"]) || !isRecord(response.meta)) return error();
  const meta = response.meta;
  if (!keys(meta, ["scope", "capability", "source", "status", "message"]) || meta.capability !== kind || meta.source !== CAPABILITY_SOURCE || meta.status !== "ready" || meta.message !== null) return error();
  const scope = parseScope(meta.scope);
  if (!scope || !sameScope(scope, requested) || !isRecord(meta.scope) || !keys(meta.scope, scope.type === "all" ? ["type"] : ["type", "customer_id"])) return error();
  if (!Array.isArray(response.data) || response.data.length > 25) return error();
  const seen = new Set<string>();
  const records: Extract<CapabilityState, { kind: "ready" }>["records"] = [];
  for (const entry of response.data) {
    if (!isRecord(entry) || !keys(entry, ["id", "name", "customer", "asset_label", "category", "status", "severity", "observation", "protection_visibility", "source", "is_fictional", "created_at"])) return error();
    if (!isRecord(entry.customer) || !keys(entry.customer, ["id", "name"])) return error();
    const customerId = entry.customer.id;
    if (typeof customerId !== "number" || !Number.isSafeInteger(customerId) || registry.get(customerId) !== entry.customer.name || (requested.type === "customer" && requested.customer_id !== customerId)) return error();
    if (!text(entry.id, 90) || !text(entry.name, 120) || !text(entry.asset_label, 100) || !text(entry.observation, 400) || typeof entry.observation !== "string" || !entry.observation.startsWith("Fictional ")) return error();
    if (entry.source !== CAPABILITY_SOURCE || entry.is_fictional !== true || entry.protection_visibility !== "Protection not verified" || parseInstant(entry.created_at) === null || entry.created_at !== "2026-11-01T10:00:00Z") return error();
    if (!(CAPABILITY_CATEGORIES[kind] as readonly unknown[]).includes(entry.category) || !(ILLUSTRATIVE_STATUSES as readonly unknown[]).includes(entry.status)) return error();
    if (kind === "external-footprint" ? !(SEVERITY_LEVELS as readonly unknown[]).includes(entry.severity) : entry.severity !== null) return error();
    const suffix = `${String(entry.customer.name).slice(-1)}-0[12]`;
    const label = kind === "external-footprint" ? "exposure" : kind === "email-protection" ? "email finding" : "cloud observation";
    if (!new RegExp(`^Fictional ${label} ${suffix}$`).test(entry.name as string) || !new RegExp(`^fictional-${kind}-${suffix.toLowerCase()}$`).test(entry.id as string)) return error();
    const recordSuffix = (entry.name as string).slice(-4);
    if (entry.id !== `fictional-${kind}-${recordSuffix.toLowerCase()}`) return error();
    const assetPattern = kind === "external-footprint" ? `^asset-${suffix.toLowerCase()}\\.example$` : `^Fictional ${kind === "email-protection" ? "message" : "workspace"} ${suffix}$`;
    const expectedAsset = kind === "external-footprint" ? `asset-${recordSuffix.toLowerCase()}.example` : `Fictional ${kind === "email-protection" ? "message" : "workspace"} ${recordSuffix}`;
    if (entry.asset_label !== expectedAsset || !new RegExp(assetPattern).test(entry.asset_label as string) || seen.has(entry.id as string) || seen.has(entry.name as string) || seen.has(entry.asset_label as string)) return error();
    seen.add(entry.id as string).add(entry.name as string).add(entry.asset_label as string);
    const record = entry as CapabilityResource;
    records.push({ id: record.id, name: record.name, customerId, customerName: record.customer.name, observation: record.observation, source: record.source, assetLabel: record.asset_label, category: record.category, status: record.status, protectionVisibility: record.protection_visibility, ...(record.severity ? { severity: record.severity } : {}) });
  }
  return { kind: "ready", records };
}

// TODO(api): GET /api/security/{capability} — orchestrate provisional scoped reads; current services are fictional only
// request: { capability, scope }
// response: { kind: ready | error, records?: [...] }
export async function getCapabilityRecords(kind: CapabilityId, scope: DashboardScope, customers: readonly KnownCustomer[]): Promise<CapabilityState> {
  if (scope.type === "customer" && (!Number.isSafeInteger(scope.customer_id) || scope.customer_id <= 0 || !customers.some(customer => customer.id === scope.customer_id))) return error();
  if (kind === "mdr") {
    const state = normalizeDemoSecurityDetections(await getDemoSecurityDetections(scope), scope, customers);
    return state.kind === "ready" ? { kind: "ready", records: state.detections.map(record => ({ id: record.id, name: record.title, customerId: record.customerId, customerName: record.customerName, observation: record.summary, severity: record.severity, source: record.source })) } : state;
  }
  if (kind === "itdr" || kind === "endpoint-security") {
    const visibilityKind = kind === "itdr" ? "identities" : "endpoints";
    return normalizeDemoVisibilityRecords(await getDemoVisibilityRecords(visibilityKind, scope), visibilityKind, scope, customers);
  }
  const loaders = { "external-footprint": getExternalFootprint, "email-protection": getEmailProtection, "cloud-data-protection": getCloudDataProtection };
  return normalizeCapabilityRecords(await loaders[kind](scope), kind, scope, customers);
}
