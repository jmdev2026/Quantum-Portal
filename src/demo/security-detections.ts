import { customersResponse } from "@/mocks/customers";
import type { DashboardScope } from "@/services/dashboard-response";
import type { DemoDetectionResource, DemoDetectionsResponse } from "@/services/security-detections";
import type { SeverityLevel } from "@/services/security-severity";

// Fictional example detections that show how a detection feed would look. Not real security events, not Guardz
// findings, and unrelated to the simulated issue totals in src/demo/security-severity.ts.
export const DEMO_DETECTIONS_SOURCE = "Simulated demo data";

type DemoDetection = { id: string; title: string; severity: SeverityLevel; summary: string };

// Keyed by the IDs in src/mocks/customers.ts (Demo Customer A = 1, B = 2, C = 3).
const DEMO_CUSTOMER_DETECTION_FIXTURES: ReadonlyMap<number, readonly DemoDetection[]> = new Map([
  [
    1,
    [
      {
        id: "demo-detection-a-1",
        title: "Suspicious email link example",
        severity: "high",
        summary:
          "Fictional example of a message containing a link that a mail filter might flag as suspicious. Shown only to illustrate how an email-related detection would appear.",
      },
      {
        id: "demo-detection-a-2",
        title: "Unusual endpoint process example",
        severity: "medium",
        summary:
          "Fictional example of an endpoint running a process that does not match its usual behavior. Illustrates how an endpoint detection would be listed.",
      },
    ],
  ],
  [
    2,
    [
      {
        id: "demo-detection-b-1",
        title: "Illustrative sign-in anomaly",
        severity: "critical",
        summary:
          "Fictional example of a sign-in that differs from a user's normal pattern. Included to show how a high-priority identity detection would be presented.",
      },
      {
        id: "demo-detection-b-2",
        title: "Externally reachable service example",
        severity: "high",
        summary:
          "Fictional example of a service that appears reachable from outside the organization. Illustrates how an external exposure detection would be listed.",
      },
    ],
  ],
  [
    3,
    [
      {
        id: "demo-detection-c-1",
        title: "Unexpected mailbox forwarding rule example",
        severity: "medium",
        summary:
          "Fictional example of a mailbox rule that forwards messages somewhere unexpected. Shown to illustrate how a mailbox configuration detection would appear.",
      },
      {
        id: "demo-detection-c-2",
        title: "Unrecognized endpoint execution example",
        severity: "low",
        summary:
          "Fictional example of a program starting on an endpoint that has not been seen there before. Illustrates how a lower-priority endpoint detection would be listed.",
      },
    ],
  ],
]);

function withCustomer(customerId: number, detection: DemoDetection): DemoDetectionResource | null {
  const customer = customersResponse.data.find((entry) => entry.id === customerId);
  if (!customer) return null;
  return { ...detection, customer: { id: customer.id, name: customer.name }, source: DEMO_DETECTIONS_SOURCE };
}

// The All Customers feed is listed explicitly, in display order, rather than assembled from the per-customer map.
const DEMO_ALL_CUSTOMER_DETECTION_REFS: readonly { customerId: number; id: string }[] = [
  { customerId: 2, id: "demo-detection-b-1" },
  { customerId: 1, id: "demo-detection-a-1" },
  { customerId: 2, id: "demo-detection-b-2" },
  { customerId: 1, id: "demo-detection-a-2" },
  { customerId: 3, id: "demo-detection-c-1" },
  { customerId: 3, id: "demo-detection-c-2" },
];

function resolve(refs: readonly { customerId: number; id: string }[]): DemoDetectionResource[] | null {
  const records: DemoDetectionResource[] = [];
  for (const ref of refs) {
    const fixture = DEMO_CUSTOMER_DETECTION_FIXTURES.get(ref.customerId)?.find((entry) => entry.id === ref.id);
    const record = fixture && withCustomer(ref.customerId, fixture);
    if (!record) return null;
    records.push(record);
  }
  return records;
}

export function demoDetectionRecords(scope: DashboardScope): DemoDetectionResource[] | null {
  if (scope.type === "all") return resolve(DEMO_ALL_CUSTOMER_DETECTION_REFS);
  const fixtures = DEMO_CUSTOMER_DETECTION_FIXTURES.get(scope.customer_id);
  return fixtures ? resolve(fixtures.map((entry) => ({ customerId: scope.customer_id, id: entry.id }))) : null;
}

// Unknown customers get an explicit error, never another customer's detections.
export function buildDemoSecurityDetections(scope: DashboardScope): DemoDetectionsResponse {
  const detections = demoDetectionRecords(scope);
  if (!detections) {
    return {
      data: {
        scope,
        status: "error",
        detections: null,
        source: DEMO_DETECTIONS_SOURCE,
        message: "No demonstration data exists for this customer.",
      },
    };
  }
  return { data: { scope, status: "ready", detections, source: DEMO_DETECTIONS_SOURCE, message: null } };
}
