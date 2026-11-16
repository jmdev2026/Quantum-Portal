import { buildDemoSecurityEndpoints } from "@/demo/security-endpoints";
import { buildDemoSecurityIdentities } from "@/demo/security-identities";
import { DEMO_VISIBILITY_SOURCE } from "@/demo/visibility-records";
import { isRecord, parseScope, sameScope, textOrNull, type DashboardScope } from "@/services/dashboard-response";
import type { KnownCustomer } from "@/services/security-detections";

// Frontend demonstration lists only. Provisional display structures, not Guardz or Laravel contracts;
// no live endpoint exists for them. Records are illustrative samples, never an inventory or a count.
export type VisibilityRecordKind = "identities" | "endpoints";

export const VISIBILITY_TEXT_LIMITS = { id: 64, name: 40, customerName: 80, observation: 300, protectionVisibility: 200 } as const;
export const MAX_DEMO_VISIBILITY_RECORDS = 25;

export type DemoVisibilityRecordResource = {
  id: string;
  name: string;
  customer: { id: number; name: string };
  observation: string;
  protection_visibility: string;
  source: string;
};

export type DemoVisibilityRecordsResponse = {
  data: {
    scope: DashboardScope;
    kind: VisibilityRecordKind;
    status: "ready" | "error";
    records: DemoVisibilityRecordResource[] | null;
    source: string;
    message: string | null;
  };
};

export type VisibilityRecord = {
  id: string;
  name: string;
  customerId: number;
  customerName: string;
  observation: string;
  protectionVisibility: string;
  source: string;
};

export type VisibilityRecordsState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; records: VisibilityRecord[] }
  | { kind: "error"; message: string };

const builders: Record<VisibilityRecordKind, (scope: DashboardScope) => DemoVisibilityRecordsResponse> = {
  identities: buildDemoSecurityIdentities,
  endpoints: buildDemoSecurityEndpoints,
};

// Frontend demonstration only: fictional fixtures, no network request.
export async function getDemoVisibilityRecords(kind: VisibilityRecordKind, scope: DashboardScope): Promise<DemoVisibilityRecordsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return builders[kind](scope);
}

const NAME_PATTERN: Record<VisibilityRecordKind, RegExp> = {
  identities: /^Demo Account [A-Z]-\d{2}$/,
  endpoints: /^Demo Endpoint [A-Z]-\d{2}$/,
};
const RESPONSE_KEYS = ["kind", "message", "records", "scope", "source", "status"].join();
const RECORD_KEYS = ["customer", "id", "name", "observation", "protection_visibility", "source"].join();
const CUSTOMER_KEYS = ["id", "name"].join();
const MARKUP = /[<>]|javascript:/i;
const PRIVATE_IDENTIFIER = /@|https?:|www\.|\b\d{1,3}(\.\d{1,3}){3}\b|\b\d{4}-\d{2}-\d{2}/i;
const UNVERIFIED = /\b(not verified|unverified)\b/i;
const FICTIONAL = /\bfictional\b/i;

const keysOf = (value: Record<string, unknown>) => Object.keys(value).sort().join();

function plainText(value: unknown, limit: number): string | null {
  const text = textOrNull(value)?.replace(/\s+/g, " ").trim();
  if (!text || text.length > limit || MARKUP.test(text) || PRIVATE_IDENTIFIER.test(text)) return null;
  return text;
}

function parseRecord(
  value: unknown,
  kind: VisibilityRecordKind,
  requested: DashboardScope,
  customers: ReadonlyMap<number, string>,
): VisibilityRecord | null {
  if (!isRecord(value) || keysOf(value) !== RECORD_KEYS) return null;
  if (!isRecord(value.customer) || keysOf(value.customer) !== CUSTOMER_KEYS) return null;
  const id = plainText(value.id, VISIBILITY_TEXT_LIMITS.id);
  const name = plainText(value.name, VISIBILITY_TEXT_LIMITS.name);
  const customerName = plainText(value.customer.name, VISIBILITY_TEXT_LIMITS.customerName);
  const observation = plainText(value.observation, VISIBILITY_TEXT_LIMITS.observation);
  const protectionVisibility = plainText(value.protection_visibility, VISIBILITY_TEXT_LIMITS.protectionVisibility);
  const customerId = value.customer.id;
  if (!id || !name || !customerName || !observation || !protectionVisibility) return null;
  if (!NAME_PATTERN[kind].test(name) || !FICTIONAL.test(observation) || !UNVERIFIED.test(protectionVisibility)) return null;
  if (!Number.isSafeInteger(customerId) || (customerId as number) <= 0) return null;
  if (customers.get(customerId as number) !== customerName) return null;
  if (requested.type === "customer" && requested.customer_id !== customerId) return null;
  if (value.source !== DEMO_VISIBILITY_SOURCE) return null;
  return { id, name, customerId: customerId as number, customerName, observation, protectionVisibility, source: DEMO_VISIBILITY_SOURCE };
}

export function normalizeDemoVisibilityRecords(
  response: unknown,
  kind: VisibilityRecordKind,
  requested: DashboardScope,
  knownCustomers: readonly KnownCustomer[],
): VisibilityRecordsState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data) || keysOf(data) !== RESPONSE_KEYS || data.kind !== kind) {
    return { kind: "error", message: "Demonstration records came back in an unexpected format." };
  }
  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Demonstration records did not match the selected customer view." };
  }
  if (data.status === "error") {
    return { kind: "error", message: plainText(data.message, 200) ?? "Demonstration records could not be shown." };
  }
  if (data.status !== "ready" || data.source !== DEMO_VISIBILITY_SOURCE || !Array.isArray(data.records)) {
    return { kind: "error", message: "Demonstration records came back in an unexpected format." };
  }
  if (data.records.length > MAX_DEMO_VISIBILITY_RECORDS) {
    return { kind: "error", message: "Too many demonstration records were returned." };
  }

  const customers = new Map(knownCustomers.map((customer) => [customer.id, customer.name]));
  const seen = new Set<string>();
  const records: VisibilityRecord[] = [];
  for (const entry of data.records) {
    const record = parseRecord(entry, kind, requested, customers);
    if (!record || seen.has(`id:${record.id}`) || seen.has(`name:${record.name}`)) {
      return { kind: "error", message: "Received invalid, duplicate or out-of-scope demonstration records." };
    }
    seen.add(`id:${record.id}`).add(`name:${record.name}`);
    records.push(record);
  }
  return { kind: "ready", records };
}
