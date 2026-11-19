import { customersResponse } from "@/mocks/customers";
import { CAPABILITY_SOURCE, type CapabilityResource, type NewCapabilityId } from "@/services/security-capability-types";

type Example = Pick<CapabilityResource, "category" | "severity" | "observation">;
export function capabilityFixtures(kind: NewCapabilityId, label: string, examples: readonly Example[]): { data: CapabilityResource[] } {
  return { data: customersResponse.data.flatMap(customer => examples.map((example, index) => {
    const suffix = `${customer.name.slice(-1)}-0${index + 1}`;
    return {
      ...example,
      id: `fictional-${kind}-${suffix.toLowerCase()}`,
      name: `Fictional ${label} ${suffix}`,
      customer: { id: customer.id, name: customer.name },
      asset_label: kind === "external-footprint" ? `asset-${suffix.toLowerCase()}.example` : `Fictional ${kind === "email-protection" ? "message" : "workspace"} ${suffix}`,
      status: index === 0 ? "illustrative" : "not-assessed",
      protection_visibility: "Protection not verified",
      source: CAPABILITY_SOURCE,
      is_fictional: true,
      created_at: "2026-11-01T10:00:00Z",
    };
  })) };
}
