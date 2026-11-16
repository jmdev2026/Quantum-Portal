import type { DashboardScope } from "@/services/dashboard-response";
import type {
  DemoVisibilityRecordResource,
  DemoVisibilityRecordsResponse,
  VisibilityRecordKind,
} from "@/services/security-visibility-records";
import { customersResponse } from "@/mocks/customers";

// Kept here rather than in the service so fixtures import only types from services (no runtime cycle).
export const DEMO_VISIBILITY_SOURCE = "Simulated demo data";

export type DemoVisibilityFixture = Omit<DemoVisibilityRecordResource, "customer" | "source">;
export type DemoVisibilityRef = { readonly customerId: number; readonly id: string };

type FixtureSet = {
  kind: VisibilityRecordKind;
  byCustomer: Readonly<Record<number, readonly DemoVisibilityFixture[]>>;
  // Explicit All Customers fixture; never derived by summing per-customer lists.
  all: readonly DemoVisibilityRef[];
};

const customerName = (id: number) => customersResponse.data.find((customer) => customer.id === id)?.name ?? null;

function withCustomer(customerId: number, fixture: DemoVisibilityFixture): DemoVisibilityRecordResource | null {
  const name = customerName(customerId);
  return name ? { ...fixture, customer: { id: customerId, name }, source: DEMO_VISIBILITY_SOURCE } : null;
}

function records(set: FixtureSet, scope: DashboardScope): DemoVisibilityRecordResource[] | null {
  const resolved =
    scope.type === "all"
      ? set.all.map((ref) => {
          const fixture = set.byCustomer[ref.customerId]?.find((item) => item.id === ref.id);
          return fixture ? withCustomer(ref.customerId, fixture) : null;
        })
      : (set.byCustomer[scope.customer_id]?.map((fixture) => withCustomer(scope.customer_id, fixture)) ?? null);
  if (!resolved || resolved.some((record) => record === null)) return null;
  return resolved as DemoVisibilityRecordResource[];
}

export function buildDemoVisibilityResponse(set: FixtureSet, scope: DashboardScope): DemoVisibilityRecordsResponse {
  const list = records(set, scope);
  return {
    data: {
      scope,
      kind: set.kind,
      status: list ? "ready" : "error",
      records: list,
      source: DEMO_VISIBILITY_SOURCE,
      message: list ? null : "No demonstration data exists for this customer.",
    },
  };
}
