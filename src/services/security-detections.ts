import { buildDemoSecurityDetections, DEMO_DETECTIONS_SOURCE } from "@/demo/security-detections";
import { isRecord, parseScope, sameScope, textOrNull, type DashboardScope } from "@/services/dashboard-response";
import { SEVERITY_LEVELS, type SeverityLevel } from "@/services/security-severity";

// Frontend demonstration feed only. This is not a Guardz or Laravel contract and no live endpoint exists for it.
export const DETECTION_TEXT_LIMITS = { id: 64, title: 120, summary: 400, customerName: 80 } as const;
export const MAX_DEMO_DETECTIONS = 25;

export type DemoDetectionResource = {
  id: string;
  title: string;
  severity: SeverityLevel;
  customer: { id: number; name: string };
  summary: string;
  source: string;
};

export type DemoDetectionsResponse = {
  data: {
    scope: DashboardScope;
    status: "ready" | "error";
    detections: DemoDetectionResource[] | null;
    source: string;
    message: string | null;
  };
};

export type Detection = {
  id: string;
  title: string;
  severity: SeverityLevel;
  customerId: number;
  customerName: string;
  summary: string;
  source: string;
};

export type DetectionsState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; detections: Detection[] }
  | { kind: "error"; message: string };

export type KnownCustomer = { id: number; name: string };

// Frontend demonstration only: fictional fixtures, no network request.
export async function getDemoSecurityDetections(scope: DashboardScope): Promise<DemoDetectionsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildDemoSecurityDetections(scope);
}

const severities = new Set<unknown>(SEVERITY_LEVELS);
const MARKUP = /[<>]/;

function plainText(value: unknown, limit: number): string | null {
  const text = textOrNull(value)?.replace(/\s+/g, " ").trim();
  if (!text || text.length > limit || MARKUP.test(text)) return null;
  return text;
}

function parseDetection(value: unknown, requested: DashboardScope, customers: ReadonlyMap<number, string>): Detection | null {
  if (!isRecord(value) || !isRecord(value.customer)) return null;
  const id = plainText(value.id, DETECTION_TEXT_LIMITS.id);
  const title = plainText(value.title, DETECTION_TEXT_LIMITS.title);
  const summary = plainText(value.summary, DETECTION_TEXT_LIMITS.summary);
  const customerName = plainText(value.customer.name, DETECTION_TEXT_LIMITS.customerName);
  const customerId = value.customer.id;
  if (!id || !title || !summary || !customerName || !severities.has(value.severity)) return null;
  if (!Number.isSafeInteger(customerId) || (customerId as number) <= 0) return null;
  if (customers.get(customerId as number) !== customerName) return null;
  if (requested.type === "customer" && requested.customer_id !== customerId) return null;
  if (value.source !== DEMO_DETECTIONS_SOURCE) return null;
  return {
    id,
    title,
    severity: value.severity as SeverityLevel,
    customerId: customerId as number,
    customerName,
    summary,
    source: DEMO_DETECTIONS_SOURCE,
  };
}

export function normalizeDemoSecurityDetections(
  response: unknown,
  requested: DashboardScope,
  knownCustomers: readonly KnownCustomer[],
): DetectionsState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data)) return { kind: "error", message: "Demonstration detections came back in an unexpected format." };

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Demonstration detections did not match the selected customer view." };
  }
  if (data.status === "error") {
    return { kind: "error", message: plainText(data.message, 200) ?? "Demonstration detections could not be shown." };
  }
  if (data.status !== "ready" || data.source !== DEMO_DETECTIONS_SOURCE || !Array.isArray(data.detections)) {
    return { kind: "error", message: "Demonstration detections came back in an unexpected format." };
  }
  if (data.detections.length > MAX_DEMO_DETECTIONS) {
    return { kind: "error", message: "Too many demonstration detections were returned." };
  }

  const customers = new Map(knownCustomers.map((customer) => [customer.id, customer.name]));
  const seen = new Set<string>();
  const detections: Detection[] = [];
  for (const entry of data.detections) {
    const detection = parseDetection(entry, requested, customers);
    if (!detection || seen.has(detection.id)) {
      return { kind: "error", message: "Received invalid, duplicate or out-of-scope demonstration detections." };
    }
    seen.add(detection.id);
    detections.push(detection);
  }
  return { kind: "ready", detections };
}
