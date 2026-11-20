import { darkWebFindingsResponse } from "@/mocks/dark-web-findings";
import { darkWebDomainsResponse } from "@/mocks/dark-web-domains";
import { darkWebAccountsResponse } from "@/mocks/dark-web-accounts";
import { isRecord, parseScope, sameScope, parseInstant, type DashboardScope } from "@/services/dashboard-response";
import type { KnownCustomer } from "@/services/security-detections";
import { SEVERITY_LEVELS } from "@/services/security-severity";
import { DARK_WEB_SOURCE, EXPOSURE_CATEGORIES, EXPOSURE_REVIEW_STATUSES, RESPONSE_CATEGORIES, type DarkWebResponse, type DarkWebState, type DarkWebData } from "@/services/dark-web-types";

// TODO(api): GET /api/security/dark-web — provisional application read seam; no provider or approved Laravel endpoint
// request: { scope }
// response: { data: { findings: [...], accounts: [...], domains: [...] }, meta: { scope, source, status, message } }
export async function getDemoDarkWeb(scope: DashboardScope): Promise<DarkWebResponse> {
  await new Promise(resolve => setTimeout(resolve, 250));
  const valid = scope.type === "all" || darkWebDomainsResponse.data.some(domain => domain.customer.id === scope.customer_id);
  const inScope = (record: { customer: { id: number } }) => valid && (scope.type === "all" || record.customer.id === scope.customer_id);
  return structuredClone({
    data: { findings: darkWebFindingsResponse.data.filter(inScope), accounts: darkWebAccountsResponse.data.filter(inScope), domains: darkWebDomainsResponse.data.filter(inScope) },
    meta: { scope, source: DARK_WEB_SOURCE, status: valid ? "ready" : "error", message: valid ? null : "The fictional customer scope is unavailable." },
  });
}

const exact = (value: Record<string, unknown>, fields: string[]) => Object.keys(value).sort().join() === [...fields].sort().join();
const safe = (value: unknown, length: number) => typeof value === "string" && value.trim().length > 0 && value.length <= length && !/[<>@]|https?:|www\.|\.onion|javascript:|\b\d{1,3}(\.\d{1,3}){3}\b/i.test(value);
const reference = (value: unknown): value is { id: string } => isRecord(value) && exact(value, ["id"]) && safe(value.id, 64);
const member = (value: unknown, options: readonly string[]) => typeof value === "string" && options.includes(value);
const invalid = (): DarkWebState => ({ kind: "error", message: "Dark Web examples were invalid or did not match the customer and relationship scope." });
const metadata = ["customer", "source", "is_demo", "created_at"];

export function normalizeDemoDarkWeb(response: unknown, requested: DashboardScope, knownCustomers: readonly KnownCustomer[]): DarkWebState {
  const registry = new Map(knownCustomers.map(customer => [customer.id, customer.name]));
  if (requested.type === "customer" && (!Number.isSafeInteger(requested.customer_id) || requested.customer_id <= 0 || !registry.has(requested.customer_id))) return invalid();
  if (!isRecord(response) || !exact(response, ["data", "meta"]) || !isRecord(response.meta) || !isRecord(response.data)) return invalid();
  const meta = response.meta;
  if (!exact(meta, ["scope", "source", "status", "message"]) || meta.source !== DARK_WEB_SOURCE || meta.status !== "ready" || meta.message !== null) return invalid();
  const scope = parseScope(meta.scope);
  if (!scope || !sameScope(scope, requested) || !isRecord(meta.scope) || !exact(meta.scope, scope.type === "all" ? ["type"] : ["type", "customer_id"])) return invalid();
  const data = response.data;
  if (!exact(data, ["findings", "accounts", "domains"]) || !Array.isArray(data.findings) || !Array.isArray(data.accounts) || !Array.isArray(data.domains) || [data.findings, data.accounts, data.domains].some(list => list.length > 25)) return invalid();
  const seen = new Set<string>();
  function base(entry: unknown, fields: string[]): entry is Record<string, unknown> {
    if (!isRecord(entry) || !exact(entry, [...metadata, ...fields]) || !isRecord(entry.customer) || !exact(entry.customer, ["id", "name"])) return false;
    const id = entry.customer.id;
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0 || registry.get(id) !== entry.customer.name || (requested.type === "customer" && requested.customer_id !== id)) return false;
    if (!safe(entry.id, 64) || typeof entry.id !== "string" || seen.has(entry.id) || entry.source !== DARK_WEB_SOURCE || entry.is_demo !== true || parseInstant(entry.created_at) === null || entry.created_at !== "2026-11-01T10:00:00Z") return false;
    seen.add(entry.id);
    return true;
  }
  const domains = new Map<string, Record<string, unknown>>();
  const accounts = new Map<string, Record<string, unknown>>();
  for (const domain of data.domains) {
    if (!base(domain, ["id", "label", "domain", "monitoring_status"]) || !safe(domain.label, 80) || domain.monitoring_status !== "demo-preview") return invalid();
    const customer = domain.customer as KnownCustomer;
    const letter = customer.name.slice(-1);
    if (domain.id !== `dw-domain-${letter.toLowerCase()}` || domain.label !== `Fictional Domain ${letter}` || typeof domain.domain !== "string" || !/^demo-[a-c]\.example\.(com|net|org)$/.test(domain.domain) || !domain.domain.startsWith(`demo-${letter.toLowerCase()}.`)) return invalid();
    if ([...domains.values()].some(item => item.domain === domain.domain)) return invalid();
    domains.set(domain.id as string, domain);
  }
  for (const account of data.accounts) {
    if (!base(account, ["id", "label", "domain", "finding_ids"]) || !reference(account.domain) || !Array.isArray(account.finding_ids) || account.finding_ids.length > 25 || account.finding_ids.some(id => !safe(id, 64)) || new Set(account.finding_ids).size !== account.finding_ids.length) return invalid();
    const customer = account.customer as KnownCustomer;
    const letter = customer.name.slice(-1);
    const domain = domains.get(account.domain.id);
    if (account.id !== `dw-account-${letter.toLowerCase()}-01` || account.label !== `Fictional Exposure Account ${letter}-01` || !domain || (domain.customer as KnownCustomer).id !== customer.id) return invalid();
    accounts.set(account.id as string, account);
  }
  for (const finding of data.findings) {
    if (!base(finding, ["id", "title", "domain", "account", "category", "severity", "review_status", "observation", "response_category"]) || !reference(finding.domain) || !reference(finding.account)) return invalid();
    if (!member(finding.category, EXPOSURE_CATEGORIES) || !member(finding.severity, SEVERITY_LEVELS) || !member(finding.review_status, EXPOSURE_REVIEW_STATUSES) || !member(finding.response_category, RESPONSE_CATEGORIES) || !safe(finding.observation, 400) || typeof finding.observation !== "string" || !finding.observation.startsWith("Fictional ")) return invalid();
    const customer = finding.customer as KnownCustomer;
    const letter = customer.name.slice(-1);
    if (typeof finding.id !== "string" || !new RegExp(`^dw-finding-${letter.toLowerCase()}-0[12]$`).test(finding.id) || finding.title !== `Fictional exposure scenario ${letter}-${finding.id.slice(-2)}` || finding.observation !== darkWebFindingsResponse.data.find(record => record.id === finding.id)?.observation) return invalid();
    const domain = domains.get(finding.domain.id);
    const account = accounts.get(finding.account.id);
    if (!domain || !account || (domain.customer as KnownCustomer).id !== customer.id || (account.customer as KnownCustomer).id !== customer.id || (account.domain as { id: string }).id !== finding.domain.id || !(account.finding_ids as string[]).includes(finding.id)) return invalid();
  }
  for (const account of accounts.values()) {
    const linked = data.findings.filter(finding => (finding.account as { id: string }).id === account.id).map(finding => finding.id).sort();
    if (linked.join() !== [...account.finding_ids as string[]].sort().join()) return invalid();
  }
  return { kind: "ready", data: structuredClone(data) as DarkWebData };
}
