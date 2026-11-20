import { buildDemoBackupAssets } from "@/demo/backup-assets";
import { DEMO_BACKUP_SOURCE } from "@/demo/backup-health";
import { isRecord, parseScope, sameScope, textOrNull, type DashboardScope } from "@/services/dashboard-response";
import type { KnownCustomer } from "@/services/security-detections";

// Frontend demonstration list only. Provisional display structure, not a Datto Endpoint Backup or Laravel
// contract; no live endpoint exists for it. Records are illustrative samples, never an inventory or a count.
export const BACKUP_ASSET_TEXT_LIMITS = { id: 64, name: 40, customerName: 80, visibilityNote: 240, protectionState: 40 } as const;
export const MAX_DEMO_BACKUP_ASSETS = 25;
export const UNVERIFIED_PROTECTION = "Not verified";

export type DemoBackupAssetResource = {
  id: string;
  name: string;
  customer: { id: number; name: string };
  visibility_note: string;
  protection_state: string;
  source: string;
};

export type DemoBackupAssetsResponse = {
  data: {
    scope: DashboardScope;
    status: "ready" | "error";
    records: DemoBackupAssetResource[] | null;
    source: string;
    message: string | null;
  };
};

export type BackupAsset = {
  id: string;
  name: string;
  customerId: number;
  customerName: string;
  visibilityNote: string;
  protectionState: typeof UNVERIFIED_PROTECTION;
  source: string;
};

export type BackupAssetsState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; records: BackupAsset[] }
  | { kind: "error"; message: string };

// Frontend demonstration only: fictional fixtures, no network request.
export async function getDemoBackupAssets(scope: DashboardScope): Promise<DemoBackupAssetsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildDemoBackupAssets(scope);
}

const NAME_PATTERN = /^Demo Backup Asset ([A-Z])-\d{2}$/;
const CUSTOMER_PATTERN = /^Demo Customer ([A-Z])$/;
const RESPONSE_KEYS = ["message", "records", "scope", "source", "status"].join();
const RECORD_KEYS = ["customer", "id", "name", "protection_state", "source", "visibility_note"].join();
const CUSTOMER_KEYS = ["id", "name"].join();
const MARKUP = /[<>]|javascript:|&#?\w+;/i;
const REAL_IDENTIFIER = new RegExp(
  [
    "@",
    "https?:",
    "www\\.",
    "\\b\\d{1,3}(\\.\\d{1,3}){3}\\b",
    "\\b([0-9a-f]{2}[:-]){5}[0-9a-f]{2}\\b",
    "\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b",
    "\\b[a-z0-9-]+\\.(com|net|org|io|local|lan|corp|internal)\\b",
    "\\b(DESKTOP|LAPTOP|WIN|SRV)-[A-Z0-9]{4,}\\b",
    "\\+?\\d[\\d ()-]{8,}\\d",
    "\\b\\d{4}-\\d{2}-\\d{2}",
  ].join("|"),
  "i",
);
// Wording a fictional sample must never use: it would imply verified protection or provider evidence.
const PROTECTION_CLAIM =
  /\b(backed up|backup (exists|completed|succeeded|successful)|agent (is )?installed|polic(y|ies) (is |are )?assigned|restored?( was| is)? (verified|tested|successful)|recoverable|recovery is possible|can be recovered|healthy|fully protected|is protected)\b/i;
const FICTIONAL = /^Fictional example:/;

const keysOf = (value: Record<string, unknown>) => Object.keys(value).sort().join();

// Rejects markup and anything resembling a real identifier; shared by the backup demonstration validators.
export function plainDemoText(value: unknown, limit: number): string | null {
  if (typeof value !== "string" || value.length > limit) return null;
  const text = textOrNull(value)?.replace(/\s+/g, " ").trim();
  if (!text || MARKUP.test(text) || REAL_IDENTIFIER.test(text)) return null;
  return text;
}

function parseAsset(value: unknown, requested: DashboardScope, customers: ReadonlyMap<number, string>): BackupAsset | null {
  if (!isRecord(value) || keysOf(value) !== RECORD_KEYS) return null;
  if (!isRecord(value.customer) || keysOf(value.customer) !== CUSTOMER_KEYS) return null;
  const id = plainDemoText(value.id, BACKUP_ASSET_TEXT_LIMITS.id);
  const name = plainDemoText(value.name, BACKUP_ASSET_TEXT_LIMITS.name);
  const customerName = plainDemoText(value.customer.name, BACKUP_ASSET_TEXT_LIMITS.customerName);
  const visibilityNote = plainDemoText(value.visibility_note, BACKUP_ASSET_TEXT_LIMITS.visibilityNote);
  const customerId = value.customer.id;
  if (!id || !name || !customerName || !visibilityNote) return null;
  if (value.protection_state !== UNVERIFIED_PROTECTION || value.source !== DEMO_BACKUP_SOURCE) return null;
  if (!FICTIONAL.test(visibilityNote) || PROTECTION_CLAIM.test(visibilityNote) || PROTECTION_CLAIM.test(name)) return null;
  if (!Number.isSafeInteger(customerId) || (customerId as number) <= 0) return null;
  if (customers.get(customerId as number) !== customerName) return null;
  if (requested.type === "customer" && requested.customer_id !== customerId) return null;
  const letter = NAME_PATTERN.exec(name)?.[1];
  if (!letter || CUSTOMER_PATTERN.exec(customerName)?.[1] !== letter) return null;
  return {
    id,
    name,
    customerId: customerId as number,
    customerName,
    visibilityNote,
    protectionState: UNVERIFIED_PROTECTION,
    source: DEMO_BACKUP_SOURCE,
  };
}

export function normalizeDemoBackupAssets(
  response: unknown,
  requested: DashboardScope,
  knownCustomers: readonly KnownCustomer[],
): BackupAssetsState {
  const requestedScope = parseScope(requested);
  if (!requestedScope || (requestedScope.type === "customer" && !knownCustomers.some(customer => customer.id === requestedScope.customer_id))) return { kind: "error", message: "No demonstration data exists for this customer." };
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data) || keysOf(data) !== RESPONSE_KEYS) {
    return { kind: "error", message: "Example assets came back in an unexpected format." };
  }
  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Example assets did not match the selected customer view." };
  }
  if (data.status === "error") {
    return { kind: "error", message: plainDemoText(data.message, 200) ?? "Example assets could not be shown." };
  }
  if (data.status !== "ready" || data.source !== DEMO_BACKUP_SOURCE || !Array.isArray(data.records)) {
    return { kind: "error", message: "Example assets came back in an unexpected format." };
  }
  if (data.records.length > MAX_DEMO_BACKUP_ASSETS) {
    return { kind: "error", message: "Too many example assets were returned." };
  }

  const customers = new Map(knownCustomers.map((customer) => [customer.id, customer.name]));
  const seen = new Set<string>();
  const records: BackupAsset[] = [];
  for (const entry of data.records) {
    const record = parseAsset(entry, requested, customers);
    if (!record || seen.has(`id:${record.id}`) || seen.has(`name:${record.name}`)) {
      return { kind: "error", message: "Received invalid, duplicate or out-of-scope example assets." };
    }
    seen.add(`id:${record.id}`).add(`name:${record.name}`);
    records.push(record);
  }
  return { kind: "ready", records };
}
