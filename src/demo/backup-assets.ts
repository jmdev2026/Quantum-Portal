import type { DashboardScope } from "@/services/dashboard-response";
import type { DemoBackupAssetResource, DemoBackupAssetsResponse } from "@/services/backup-assets";
import { DEMO_BACKUP_SOURCE } from "@/demo/backup-health";
import { customersResponse } from "@/mocks/customers";

// Literal rather than imported so the service, not the fixture, decides what wording is acceptable.
const NOT_VERIFIED = "Not verified";

type DemoBackupAssetFixture = Omit<DemoBackupAssetResource, "customer" | "source">;

const DEMO_BACKUP_ASSETS: Readonly<Record<number, readonly DemoBackupAssetFixture[]>> = {
  1: [
    {
      id: "demo-backup-asset-a-01",
      name: "Demo Backup Asset A-01",
      visibility_note: "Fictional example: endpoint backup visibility would be reviewed here when provider data becomes available.",
      protection_state: NOT_VERIFIED,
    },
    {
      id: "demo-backup-asset-a-02",
      name: "Demo Backup Asset A-02",
      visibility_note: "Fictional example: shows where backup reporting notes for a workstation would appear once provider data is available.",
      protection_state: NOT_VERIFIED,
    },
  ],
  2: [
    {
      id: "demo-backup-asset-b-01",
      name: "Demo Backup Asset B-01",
      visibility_note: "Fictional example: shows how backup visibility for a laptop would be summarized for this customer.",
      protection_state: NOT_VERIFIED,
    },
    {
      id: "demo-backup-asset-b-02",
      name: "Demo Backup Asset B-02",
      visibility_note: "Fictional example: endpoint backup visibility would be reviewed here when provider data becomes available.",
      protection_state: NOT_VERIFIED,
    },
  ],
  3: [
    {
      id: "demo-backup-asset-c-01",
      name: "Demo Backup Asset C-01",
      visibility_note: "Fictional example: shows where a backup reporting note for a shared office computer would be listed.",
      protection_state: NOT_VERIFIED,
    },
    {
      id: "demo-backup-asset-c-02",
      name: "Demo Backup Asset C-02",
      visibility_note: "Fictional example: endpoint backup visibility would be reviewed here when provider data becomes available.",
      protection_state: NOT_VERIFIED,
    },
  ],
};

// Explicit All Customers fixture; never derived by combining the per-customer lists.
const DEMO_ALL_BACKUP_ASSETS = [
  { customerId: 1, id: "demo-backup-asset-a-01" },
  { customerId: 2, id: "demo-backup-asset-b-01" },
  { customerId: 3, id: "demo-backup-asset-c-01" },
  { customerId: 1, id: "demo-backup-asset-a-02" },
  { customerId: 2, id: "demo-backup-asset-b-02" },
  { customerId: 3, id: "demo-backup-asset-c-02" },
] as const;

const customerName = (id: number) => customersResponse.data.find((customer) => customer.id === id)?.name ?? null;

function withCustomer(customerId: number, fixture: DemoBackupAssetFixture | undefined): DemoBackupAssetResource | null {
  const name = customerName(customerId);
  return fixture && name ? { ...fixture, customer: { id: customerId, name }, source: DEMO_BACKUP_SOURCE } : null;
}

function records(scope: DashboardScope): DemoBackupAssetResource[] | null {
  const resolved =
    scope.type === "all"
      ? DEMO_ALL_BACKUP_ASSETS.map((ref) => withCustomer(ref.customerId, DEMO_BACKUP_ASSETS[ref.customerId]?.find((item) => item.id === ref.id)))
      : (DEMO_BACKUP_ASSETS[scope.customer_id]?.map((fixture) => withCustomer(scope.customer_id, fixture)) ?? null);
  if (!resolved || resolved.some((record) => record === null)) return null;
  return resolved as DemoBackupAssetResource[];
}

export function buildDemoBackupAssets(scope: DashboardScope): DemoBackupAssetsResponse {
  const list = records(scope);
  return {
    data: {
      scope,
      status: list ? "ready" : "error",
      records: list,
      source: DEMO_BACKUP_SOURCE,
      message: list ? null : "No demonstration data exists for this customer.",
    },
  };
}
