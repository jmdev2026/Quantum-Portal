import type { DashboardScope } from "@/services/dashboard-response";
import type { DemoVisibilityRecordsResponse } from "@/services/security-visibility-records";
import { buildDemoVisibilityResponse, type DemoVisibilityFixture } from "@/demo/visibility-records";

const PROTECTION_NOT_VERIFIED = "Not verified. This fictional example makes no claim about account protection.";

const DEMO_IDENTITIES: Readonly<Record<number, readonly DemoVisibilityFixture[]>> = {
  1: [
    {
      id: "demo-identity-a-01",
      name: "Demo Account A-01",
      observation: "Fictional example: illustrative sign-in activity review, showing how a note about unusual sign-in timing would be listed.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
    {
      id: "demo-identity-a-02",
      name: "Demo Account A-02",
      observation: "Fictional example: identity security visibility review, showing how a note about account settings would appear.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
  ],
  2: [
    {
      id: "demo-identity-b-01",
      name: "Demo Account B-01",
      observation: "Fictional example: illustrative account risk assessment scenario. It does not describe a real account or a real risk.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
    {
      id: "demo-identity-b-02",
      name: "Demo Account B-02",
      observation: "Fictional example: illustrative sign-in prompt review, showing how an authentication note would be listed.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
  ],
  3: [
    {
      id: "demo-identity-c-01",
      name: "Demo Account C-01",
      observation: "Fictional example: illustrative mailbox access review, showing how an access note would appear.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
    {
      id: "demo-identity-c-02",
      name: "Demo Account C-02",
      observation: "Fictional example: illustrative inactive account review, showing how an inactivity note would be listed.",
      protection_visibility: PROTECTION_NOT_VERIFIED,
    },
  ],
};

const DEMO_ALL_IDENTITIES = [
  { customerId: 1, id: "demo-identity-a-01" },
  { customerId: 2, id: "demo-identity-b-01" },
  { customerId: 3, id: "demo-identity-c-01" },
  { customerId: 1, id: "demo-identity-a-02" },
  { customerId: 2, id: "demo-identity-b-02" },
  { customerId: 3, id: "demo-identity-c-02" },
] as const;

export function buildDemoSecurityIdentities(scope: DashboardScope): DemoVisibilityRecordsResponse {
  return buildDemoVisibilityResponse({ kind: "identities", byCustomer: DEMO_IDENTITIES, all: DEMO_ALL_IDENTITIES }, scope);
}
