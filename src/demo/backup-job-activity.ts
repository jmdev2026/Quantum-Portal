import type { DashboardScope } from "@/services/dashboard-response";
import type { DemoBackupJobResource, DemoBackupJobsResponse } from "@/services/backup-job-activity";
import { DEMO_BACKUP_SOURCE } from "@/demo/backup-health";
import { customersResponse } from "@/mocks/customers";

// Illustrative examples only. Independent of the Backup Health job-outcome totals and the example assets.
type DemoBackupJobFixture = Omit<DemoBackupJobResource, "customer" | "source">;

const DEMO_BACKUP_JOBS: Readonly<Record<number, readonly DemoBackupJobFixture[]>> = {
  1: [
    {
      id: "demo-backup-job-a-01",
      title: "Demo Backup Job A-01",
      outcome: "successful",
      description: "Fictional example: a successful backup job outcome would appear here after integration and validation.",
    },
    {
      id: "demo-backup-job-a-02",
      title: "Demo Backup Job A-02",
      outcome: "partially_successful",
      description: "Fictional example: shows how a partially successful job outcome would be listed for review.",
    },
  ],
  2: [
    {
      id: "demo-backup-job-b-01",
      title: "Demo Backup Job B-01",
      outcome: "degraded_or_failed",
      description: "Fictional example: shows how a degraded or failed job outcome would be highlighted for follow-up.",
    },
    {
      id: "demo-backup-job-b-02",
      title: "Demo Backup Job B-02",
      outcome: "successful",
      description: "Fictional example: a successful backup job outcome would appear here after integration and validation.",
    },
  ],
  3: [
    {
      id: "demo-backup-job-c-01",
      title: "Demo Backup Job C-01",
      outcome: "successful",
      description: "Fictional example: shows where a successful job outcome for this customer would be listed.",
    },
    {
      id: "demo-backup-job-c-02",
      title: "Demo Backup Job C-02",
      outcome: "partially_successful",
      description: "Fictional example: a partially successful job outcome would appear here after integration and validation.",
    },
  ],
};

// Explicit All Customers fixture; never derived by combining the per-customer lists.
const DEMO_ALL_BACKUP_JOBS = [
  { customerId: 1, id: "demo-backup-job-a-01" },
  { customerId: 2, id: "demo-backup-job-b-01" },
  { customerId: 3, id: "demo-backup-job-c-01" },
  { customerId: 1, id: "demo-backup-job-a-02" },
  { customerId: 2, id: "demo-backup-job-b-02" },
  { customerId: 3, id: "demo-backup-job-c-02" },
] as const;

const customerName = (id: number) => customersResponse.data.find((customer) => customer.id === id)?.name ?? null;

function withCustomer(customerId: number, fixture: DemoBackupJobFixture | undefined): DemoBackupJobResource | null {
  const name = customerName(customerId);
  return fixture && name ? { ...fixture, customer: { id: customerId, name }, source: DEMO_BACKUP_SOURCE } : null;
}

function records(scope: DashboardScope): DemoBackupJobResource[] | null {
  const resolved =
    scope.type === "all"
      ? DEMO_ALL_BACKUP_JOBS.map((ref) => withCustomer(ref.customerId, DEMO_BACKUP_JOBS[ref.customerId]?.find((item) => item.id === ref.id)))
      : (DEMO_BACKUP_JOBS[scope.customer_id]?.map((fixture) => withCustomer(scope.customer_id, fixture)) ?? null);
  if (!resolved || resolved.some((record) => record === null)) return null;
  return resolved as DemoBackupJobResource[];
}

export function buildDemoBackupJobActivity(scope: DashboardScope): DemoBackupJobsResponse {
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
