import { buildDemoBackupJobActivity } from "@/demo/backup-job-activity";
import { DEMO_BACKUP_SOURCE } from "@/demo/backup-health";
import { plainDemoText } from "@/services/backup-assets";
import { JOB_OUTCOMES, type JobOutcome } from "@/services/backup-health";
import { isRecord, parseScope, sameScope, type DashboardScope } from "@/services/dashboard-response";
import type { KnownCustomer } from "@/services/security-detections";

// Frontend demonstration feed only. Provisional display structure, not a Datto Endpoint Backup or Laravel
// contract. Records are illustrative examples, never execution history and never a source for outcome totals.
export const BACKUP_JOB_TEXT_LIMITS = { id: 64, title: 40, customerName: 80, description: 240 } as const;
export const MAX_DEMO_BACKUP_JOBS = 25;

export type DemoBackupJobResource = {
  id: string;
  title: string;
  customer: { id: number; name: string };
  outcome: JobOutcome;
  description: string;
  source: string;
};

export type DemoBackupJobsResponse = {
  data: {
    scope: DashboardScope;
    status: "ready" | "error";
    records: DemoBackupJobResource[] | null;
    source: string;
    message: string | null;
  };
};

export type BackupJob = {
  id: string;
  title: string;
  customerId: number;
  customerName: string;
  outcome: JobOutcome;
  description: string;
  source: string;
};

export type BackupJobsState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; records: BackupJob[] }
  | { kind: "error"; message: string };

// Frontend demonstration only: fictional fixtures, no network request.
export async function getDemoBackupJobActivity(scope: DashboardScope): Promise<DemoBackupJobsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildDemoBackupJobActivity(scope);
}

const TITLE_PATTERN = /^Demo Backup Job ([A-Z])-\d{2}$/;
const CUSTOMER_PATTERN = /^Demo Customer ([A-Z])$/;
const RESPONSE_KEYS = ["message", "records", "scope", "source", "status"].join();
const RECORD_KEYS = ["customer", "description", "id", "outcome", "source", "title"].join();
const CUSTOMER_KEYS = ["id", "name"].join();
const OUTCOMES = new Set<string>(JOB_OUTCOMES.map((outcome) => outcome.key));
const FICTIONAL = /^Fictional example:/;
const TIME_REFERENCE = new RegExp(
  [
    "\\b\\d{1,2}:\\d{2}\\b",
    "\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b",
    "\\b(19|20)\\d{2}\\b",
    "\\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.? \\d{1,2}\\b",
    "\\b\\d+ ?(seconds?|minutes?|hours?|days?|weeks?) ago\\b",
    "\\b(today|yesterday|tonight|last night|this morning|recently|last 24 hours)\\b",
  ].join("|"),
  "i",
);
const PROVIDER_IDENTIFIER = /\b(job|policy|agent|device|asset|restore|snapshot)[ _-]?(id|uuid|ref)\b|\b[0-9a-f]{12,}\b|\b[A-Z]{2,}-\d{4,}\b/i;
// Wording an example must never use: it would claim real backup evidence or recoverability.
const UNSUPPORTED_CLAIM =
  /\b(backed up|backup (was |is )?(completed|succeeded|successful|verified)|data (is|was) (safe|protected)|restor(e|ed|able|ing)|recover(y|able|ed)|recovery point|snapshot|healthy|is protected|verified)\b/i;

const keysOf = (value: Record<string, unknown>) => Object.keys(value).sort().join();
const exampleText = (value: unknown, limit: number) => {
  const text = plainDemoText(value, limit);
  return text && !TIME_REFERENCE.test(text) && !PROVIDER_IDENTIFIER.test(text) && !UNSUPPORTED_CLAIM.test(text) ? text : null;
};

function parseJob(value: unknown, requested: DashboardScope, customers: ReadonlyMap<number, string>): BackupJob | null {
  if (!isRecord(value) || keysOf(value) !== RECORD_KEYS) return null;
  if (!isRecord(value.customer) || keysOf(value.customer) !== CUSTOMER_KEYS) return null;
  const id = plainDemoText(value.id, BACKUP_JOB_TEXT_LIMITS.id);
  const title = exampleText(value.title, BACKUP_JOB_TEXT_LIMITS.title);
  const customerName = plainDemoText(value.customer.name, BACKUP_JOB_TEXT_LIMITS.customerName);
  const description = exampleText(value.description, BACKUP_JOB_TEXT_LIMITS.description);
  const customerId = value.customer.id;
  if (!id || !title || !customerName || !description || !FICTIONAL.test(description)) return null;
  if (typeof value.outcome !== "string" || !OUTCOMES.has(value.outcome) || value.source !== DEMO_BACKUP_SOURCE) return null;
  if (!Number.isSafeInteger(customerId) || (customerId as number) <= 0) return null;
  if (customers.get(customerId as number) !== customerName) return null;
  if (requested.type === "customer" && requested.customer_id !== customerId) return null;
  const letter = TITLE_PATTERN.exec(title)?.[1];
  if (!letter || CUSTOMER_PATTERN.exec(customerName)?.[1] !== letter) return null;
  return {
    id,
    title,
    customerId: customerId as number,
    customerName,
    outcome: value.outcome as JobOutcome,
    description,
    source: DEMO_BACKUP_SOURCE,
  };
}

export function normalizeDemoBackupJobActivity(
  response: unknown,
  requested: DashboardScope,
  knownCustomers: readonly KnownCustomer[],
): BackupJobsState {
  const requestedScope = parseScope(requested);
  if (!requestedScope || (requestedScope.type === "customer" && !knownCustomers.some(customer => customer.id === requestedScope.customer_id))) return { kind: "error", message: "No demonstration data exists for this customer." };
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data) || keysOf(data) !== RESPONSE_KEYS) {
    return { kind: "error", message: "Example job activity came back in an unexpected format." };
  }
  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Example job activity did not match the selected customer view." };
  }
  if (data.status === "error") {
    return { kind: "error", message: plainDemoText(data.message, 200) ?? "Example job activity could not be shown." };
  }
  if (data.status !== "ready" || data.source !== DEMO_BACKUP_SOURCE || !Array.isArray(data.records)) {
    return { kind: "error", message: "Example job activity came back in an unexpected format." };
  }
  if (data.records.length > MAX_DEMO_BACKUP_JOBS) {
    return { kind: "error", message: "Too many example jobs were returned." };
  }

  const customers = new Map(knownCustomers.map((customer) => [customer.id, customer.name]));
  const seen = new Set<string>();
  const records: BackupJob[] = [];
  for (const entry of data.records) {
    const record = parseJob(entry, requested, customers);
    if (!record || seen.has(`id:${record.id}`) || seen.has(`title:${record.title}`)) {
      return { kind: "error", message: "Received invalid, duplicate or out-of-scope example jobs." };
    }
    seen.add(`id:${record.id}`).add(`title:${record.title}`);
    records.push(record);
  }
  return { kind: "ready", records };
}
