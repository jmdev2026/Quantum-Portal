import type { DashboardScope } from "@/services/dashboard-response";
import type { DemoVisibilityRecordsResponse } from "@/services/security-visibility-records";
import { buildDemoVisibilityResponse, type DemoVisibilityFixture } from "@/demo/visibility-records";

const PROTECTION_NOT_VERIFIED = "Not verified. This fictional example makes no claim about device protection.";

const DEMO_ENDPOINTS: Readonly<Record<number, readonly DemoVisibilityFixture[]>> = {
  1: [
    {
      id: "demo-endpoint-a-01",
      name: "Demo Endpoint A-01",
      observation: "Fictional example: illustrative endpoint process review, showing how a note about an unfamiliar program would be listed.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
    {
      id: "demo-endpoint-a-02",
      name: "Demo Endpoint A-02",
      observation: "Fictional example: endpoint security visibility review, showing how a device note would appear.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
  ],
  2: [
    {
      id: "demo-endpoint-b-01",
      name: "Demo Endpoint B-01",
      observation: "Fictional example: illustrative endpoint investigation scenario. No real investigation took place.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
    {
      id: "demo-endpoint-b-02",
      name: "Demo Endpoint B-02",
      observation: "Fictional example: illustrative software update review, showing how an update note would be listed.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
  ],
  3: [
    {
      id: "demo-endpoint-c-01",
      name: "Demo Endpoint C-01",
      observation: "Fictional example: illustrative removable storage review, showing how a device usage note would appear.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
    {
      id: "demo-endpoint-c-02",
      name: "Demo Endpoint C-02",
      observation: "Fictional example: illustrative startup program review, showing how a configuration note would be listed.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
  ],
};

const DEMO_ALL_ENDPOINTS = [
  { customerId: 1, id: "demo-endpoint-a-01" },
  { customerId: 2, id: "demo-endpoint-b-01" },
  { customerId: 3, id: "demo-endpoint-c-01" },
  { customerId: 1, id: "demo-endpoint-a-02" },
  { customerId: 2, id: "demo-endpoint-b-02" },
  { customerId: 3, id: "demo-endpoint-c-02" },
] as const;

export function buildDemoSecurityEndpoints(scope: DashboardScope): DemoVisibilityRecordsResponse {
  return buildDemoVisibilityResponse({ kind: "endpoints", byCustomer: DEMO_ENDPOINTS, all: DEMO_ALL_ENDPOINTS }, scope);
}
