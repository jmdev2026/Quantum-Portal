import test from "node:test";
import assert from "node:assert/strict";
import { customersResponse } from "@/mocks/customers";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleBackupHealth, type LoadedBackupHealth } from "@/components/dashboard/backup-health-view";
import { backupOverviewView } from "@/components/backup/backup-overview-view";
import { protectedAssetsView, visibleBackupAssets, type LoadedBackupAssets } from "@/components/backup/protected-assets-view";
import { jobActivityView, visibleBackupJobs, type LoadedBackupJobs } from "@/components/backup/backup-job-activity-view";
import { RESTORE_UNAVAILABLE, recoveryInformation } from "@/components/backup/recovery-information-view";
import { getBackupHealth, getDemoBackupHealth, normalizeBackupHealth, type BackupHealthState } from "@/services/backup-health";
import { getDemoBackupAssets, normalizeDemoBackupAssets, type BackupAssetsState } from "@/services/backup-assets";
import { getDemoBackupJobActivity, normalizeDemoBackupJobActivity, type BackupJobsState } from "@/services/backup-job-activity";
import type { DashboardScope } from "@/services/dashboard-response";

const customers = customersResponse.data;
const VIEWS: { customerId: number | null; label: string }[] = [
  { customerId: null, label: "All Customers" },
  { customerId: 1, label: "Demo Customer A" },
  { customerId: 2, label: "Demo Customer B" },
  { customerId: 3, label: "Demo Customer C" },
];
const scopeOf = (customerId: number | null): DashboardScope =>
  customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };

type Feeds = { health: BackupHealthState; assets: BackupAssetsState; jobs: BackupJobsState };

// Mirrors what the three hooks load for a mode and customer, using the real services and validators.
async function load(mode: DashboardMode, customerId: number | null): Promise<Feeds> {
  const scope = scopeOf(customerId);
  const health = normalizeBackupHealth(await (mode === "demo" ? getDemoBackupHealth : getBackupHealth)(scope), scope);
  if (mode === "live") return { health, assets: { kind: "unavailable" }, jobs: { kind: "unavailable" } };
  return {
    health,
    assets: normalizeDemoBackupAssets(await getDemoBackupAssets(scope), scope, customers),
    jobs: normalizeDemoBackupJobActivity(await getDemoBackupJobActivity(scope), scope, customers),
  };
}

const visible = (loaded: { mode: DashboardMode; customerId: number | null; feeds: Feeds }, mode: DashboardMode, customerId: number | null): Feeds => ({
  health: visibleBackupHealth({ mode: loaded.mode, customerId: loaded.customerId, state: loaded.feeds.health } as LoadedBackupHealth, mode, customerId),
  assets: visibleBackupAssets({ mode: loaded.mode, customerId: loaded.customerId, state: loaded.feeds.assets } as LoadedBackupAssets, mode, customerId),
  jobs: visibleBackupJobs({ mode: loaded.mode, customerId: loaded.customerId, state: loaded.feeds.jobs } as LoadedBackupJobs, mode, customerId),
});

const shownCustomerIds = (feeds: Feeds) => [
  ...(feeds.assets.kind === "ready" ? feeds.assets.records.map((r) => r.customerId) : []),
  ...(feeds.jobs.kind === "ready" ? feeds.jobs.records.map((r) => r.customerId) : []),
];

test("all four sections describe the same customer scope together in every mode", async () => {
  for (const mode of ["live", "demo"] as const) {
    for (const { customerId, label } of VIEWS) {
      const feeds = await load(mode, customerId);
      const overview = backupOverviewView(feeds.health, mode === "demo", label);
      const assets = protectedAssetsView(feeds.assets, label);
      const jobs = jobActivityView(feeds.jobs, label);
      const recovery = recoveryInformation(mode, label);
      assert.ok(overview.body.includes(label), `${mode} ${label} overview`);
      assert.ok(recovery.areas[0].body.includes(label), `${mode} ${label} recovery`);
      if (mode === "live") {
        assert.deepEqual([overview.status, assets.status, jobs.status, recovery.badge], ["not-connected", "not-connected", "not-connected", "Not connected"]);
        for (const view of [assets, jobs]) assert.ok("body" in view && view.body.includes(label));
        assert.deepEqual(shownCustomerIds(feeds), []);
      } else {
        assert.deepEqual([overview.status, assets.status, jobs.status], ["simulated", "simulated", "simulated"]);
        const ids = shownCustomerIds(feeds);
        assert.equal(ids.length, customerId === null ? 12 : 4);
        if (customerId !== null) assert.ok(ids.every((id) => id === customerId), `${label} ${ids}`);
        else assert.deepEqual([...new Set(ids)].sort(), [1, 2, 3]);
      }
      assert.ok(recovery.areas.some((a) => a.body.includes(RESTORE_UNAVAILABLE)));
    }
  }
});

test("sample rows never stand in for the Overview totals in any Demo scope", async () => {
  const expected: Record<string, { assets: number; outcomes: number[] }> = {
    "All Customers": { assets: 61, outcomes: [48, 3, 5, 7] },
    "Demo Customer A": { assets: 18, outcomes: [15, 1, 1, 2] },
    "Demo Customer B": { assets: 27, outcomes: [20, 1, 3, 3] },
    "Demo Customer C": { assets: 16, outcomes: [13, 1, 1, 2] },
  };
  for (const { customerId, label } of VIEWS) {
    const feeds = await load("demo", customerId);
    assert.equal(feeds.health.kind, "ready");
    if (feeds.health.kind !== "ready" || feeds.assets.kind !== "ready" || feeds.jobs.kind !== "ready") continue;
    const outcomes = feeds.health.jobOutcomes!.counts;
    assert.equal(feeds.health.protectedAssets, expected[label].assets);
    assert.deepEqual(
      [outcomes.successful, outcomes.partially_successful, outcomes.degraded_or_failed, outcomes.not_available],
      expected[label].outcomes,
    );
    assert.notEqual(feeds.assets.records.length, feeds.health.protectedAssets);
    const sampleOutcomes = feeds.jobs.records.reduce<Record<string, number>>((acc, j) => ({ ...acc, [j.outcome]: (acc[j.outcome] ?? 0) + 1 }), {});
    assert.notEqual(sampleOutcomes.successful ?? 0, outcomes.successful);
  }
});

test("switching mode or customer hides every previous feed at once until the new scope loads", async () => {
  const sequence: [DashboardMode, number | null][] = [
    ["demo", null], ["demo", 1], ["demo", 2], ["demo", 3], ["demo", null], ["live", null], ["demo", 2], ["demo", 3], ["live", 3], ["demo", 1],
  ];
  const loadedAll = new Map<string, Feeds>();
  for (const [mode, customerId] of sequence) loadedAll.set(`${mode}:${customerId}`, await load(mode, customerId));
  for (let i = 1; i < sequence.length; i++) {
    const [prevMode, prevCustomer] = sequence[i - 1];
    const [mode, customerId] = sequence[i];
    const stale = { mode: prevMode, customerId: prevCustomer, feeds: loadedAll.get(`${prevMode}:${prevCustomer}`)! };
    const shown = visible(stale, mode, customerId);
    if (mode === "live") {
      assert.deepEqual([shown.assets.kind, shown.jobs.kind], ["unavailable", "unavailable"]);
      assert.notEqual(shown.health.kind, "ready");
    } else {
      assert.deepEqual([shown.health.kind, shown.assets.kind, shown.jobs.kind], ["loading", "loading", "loading"], `step ${i}`);
    }
    assert.deepEqual(shownCustomerIds(shown), []);
    const settled = visible({ mode, customerId, feeds: loadedAll.get(`${mode}:${customerId}`)! }, mode, customerId);
    const ids = shownCustomerIds(settled);
    if (mode === "live") assert.deepEqual(ids, []);
    else if (customerId !== null) assert.ok(ids.length === 4 && ids.every((id) => id === customerId));
  }
});

test("unknown customer IDs fail safely in every Demo feed and never fall back to All Customers", async () => {
  const feeds = await load("demo", 999);
  assert.equal(feeds.health.kind, "error");
  assert.equal(feeds.assets.kind, "error");
  assert.equal(feeds.jobs.kind, "error");
  assert.deepEqual(shownCustomerIds(feeds), []);
});
