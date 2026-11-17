import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEMO_ALL_CUSTOMER_BACKUP_HEALTH, DEMO_CUSTOMER_BACKUP_HEALTH } from "@/demo/backup-health";
import { FRESHNESS_SEPARATE_NOTE, OUTCOMES_DEMO_NOTE, backupOverviewView } from "@/components/backup/backup-overview-view";
import { backupHealthSource, visibleBackupHealth, type LoadedBackupHealth } from "@/components/dashboard/backup-health-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { getBackupHealth, getDemoBackupHealth, normalizeBackupHealth, type BackupHealthState } from "@/services/backup-health";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const panel = read("src/components/backup/backup-overview-panel.tsx");
const ALL: DashboardScope = { type: "all" };
const one = (id: number): DashboardScope => ({ type: "customer", customer_id: id });
const load = async (mode: "live" | "demo", scope: DashboardScope) => normalizeBackupHealth(await backupHealthSource(mode)(scope), scope);
const ready = (state: BackupHealthState) => {
  assert.equal(state.kind, "ready", JSON.stringify(state));
  return state as Extract<BackupHealthState, { kind: "ready" | "stale" }>;
};

const EXPECTED = [
  { scope: ALL, assets: 61, fresh: [4, 8, 28, 15, 6], outcomes: [48, 3, 5, 7] },
  { scope: one(1), assets: 18, fresh: [2, 3, 9, 3, 1], outcomes: [15, 1, 1, 2] },
  { scope: one(2), assets: 27, fresh: [1, 3, 11, 9, 3], outcomes: [20, 1, 3, 3] },
  { scope: one(3), assets: 16, fresh: [1, 2, 8, 3, 2], outcomes: [13, 1, 1, 2] },
];

for (const { scope, assets, fresh, outcomes } of EXPECTED) {
  const label = scope.type === "all" ? "All Customers" : `customer ${scope.customer_id}`;
  test(`Overview figures for ${label} come from the shared Backup Health data`, async () => {
    const state = ready(await load("demo", scope));
    assert.equal(state.protectedAssets, assets);
    assert.deepEqual(Object.values(state.freshness!), fresh);
    assert.deepEqual(Object.values(state.jobOutcomes!.counts), outcomes);
    assert.equal(state.jobOutcomes!.period, "last_24_hours");
    assert.equal(state.jobOutcomes!.basis, "job_executions");
    assert.equal(state.jobOutcomes!.windowStart, null);
    assert.equal(state.jobOutcomes!.windowEnd, null);
    assert.equal(state.source, "Simulated demo data");
    assert.equal(state.lastSyncedAt, null);
  });
}

test("All Customers uses its own fixture rather than a sum of customers", () => {
  assert.equal(DEMO_ALL_CUSTOMER_BACKUP_HEALTH.protectedAssets, 61);
  assert.ok(DEMO_CUSTOMER_BACKUP_HEALTH.size === 3);
  assert.doesNotMatch(panel, /reduce\(|\.values\(\)|\bDEMO_/);
});

test("the Overview never requires freshness buckets to add up to protected assets", () => {
  assert.match(FRESHNESS_SEPARATE_NOTE, /not expected to add up to the protected asset count/);
  assert.doesNotMatch(panel, /reduce\(|protectedAssets\s*[-/]|[-/]\s*data\.protectedAssets/);
  assert.match(panel, /data\?\.freshness && \(\s*<p data-freshness-note/);
});

test("job outcomes are fictional executions, never a rate, and Not Available is not a failure", () => {
  assert.match(OUTCOMES_DEMO_NOTE, /fictional backup job executions/);
  assert.match(OUTCOMES_DEMO_NOTE, /not protected asset counts/);
  assert.match(OUTCOMES_DEMO_NOTE, /do not describe actual activity during the last 24 hours/);
  assert.doesNotMatch(panel, /%|successRate|success_rate|\/ *data\.protectedAssets|\/ *total/);
  assert.match(read("src/components/dashboard/backup-job-outcomes.tsx"), /No outcome provided, not a failure/);
  assert.match(read("src/components/dashboard/backup-job-outcomes.tsx"), /\{simulated && " · Illustrative"\}/);
  assert.match(panel, /simulated && " · Illustrative"/);
});

test("Overview never renders reporting-window or sync timestamps and makes no recovery claim", () => {
  assert.match(panel, /windowStart: null, windowEnd: null/);
  assert.doesNotMatch(panel, /<time|lastSyncedAt|toLocaleString|new Date|DateTimeFormat/);
  const copy = ["ready", "stale", "unavailable", "empty", "loading"].flatMap((kind) =>
    [true, false].map((sim) => Object.values(backupOverviewView({ kind, source: null, lastSyncedAt: null, protectedAssets: 1, freshness: null, jobOutcomes: null } as BackupHealthState, sim, "All Customers")).join(" ")),
  );
  for (const text of [...copy, OUTCOMES_DEMO_NOTE, FRESHNESS_SEPARATE_NOTE]) {
    assert.doesNotMatch(text, /recover(y|able) (is )?(ready|possible)|restore|ready to recover|success rate|%/i, text);
  }
});

test("Overview does not equate protected assets with Dashboard devices", () => {
  assert.match(panel, /Not the same as the Dashboard&apos;s device count/);
  assert.doesNotMatch(panel, /dashboard-assets|AssetSummary|devices_total/);
});

for (const scope of [ALL, one(1), one(2), one(3)]) {
  test(`Live Overview is unavailable, never zero, never connected (${scope.type === "all" ? "all" : scope.customer_id})`, async () => {
    const state = await load("live", scope);
    assert.equal(state.kind, "unavailable");
    const view = backupOverviewView(state, false, "All Customers");
    assert.equal(view.badge, "Not connected");
    assert.equal(view.title, "Awaiting integration");
    assert.match(view.body, /not connected/);
    assert.doesNotMatch(view.body, /\d/);
    assert.match(view.body, /does not mean there are zero backup issues or that any backups have succeeded/);
  });
}

test("Demo Overview is badged Simulated with a source and no sync time", async () => {
  const view = backupOverviewView(ready(await load("demo", ALL)), true, "All Customers");
  assert.equal(view.badge, "Simulated");
  assert.equal(view.title, "Simulated demo data");
  assert.match(view.body, /no sync time is shown/);
  assert.match(panel, /None \(simulated\)/);
});

test("every state has a distinct Overview presentation", () => {
  const states: BackupHealthState[] = [
    { kind: "loading" },
    { kind: "stale", protectedAssets: 1, freshness: null, jobOutcomes: null, source: null, lastSyncedAt: null },
    { kind: "empty", source: null, lastSyncedAt: null },
    { kind: "unavailable", source: null, lastSyncedAt: null },
    { kind: "error", message: "Backup data did not match the selected customer view." },
  ];
  const statuses = states.map((s) => backupOverviewView(s, false, "All Customers").status);
  assert.deepEqual(statuses, ["loading", "stale", "empty", "not-connected", "error"]);
  assert.equal(backupOverviewView(states[4], false, "x").body, "Backup data did not match the selected customer view.");
  assert.match(panel, /role=\{view\.status === "error" \? "alert" : undefined\}/);
});

test("Overview only shows data loaded for the current mode and customer", async () => {
  const demoAll: LoadedBackupHealth = { mode: "demo", customerId: null, state: await load("demo", ALL) };
  assert.equal(visibleBackupHealth(demoAll, "demo", null).kind, "ready");
  assert.equal(visibleBackupHealth(demoAll, "live", null).kind, "loading");
  assert.equal(visibleBackupHealth(demoAll, "demo", 2).kind, "loading");
  const liveB: LoadedBackupHealth = { mode: "live", customerId: 2, state: await load("live", one(2)) };
  assert.equal(visibleBackupHealth(liveB, "demo", 2).kind, "loading");
});

test("unknown customer IDs and mismatched responses fail safely", async () => {
  assert.equal((await load("demo", one(99))).kind, "error");
  const aResponse = await getDemoBackupHealth(one(1));
  assert.equal(normalizeBackupHealth(aResponse, one(2)).kind, "error");
  assert.equal(normalizeBackupHealth(aResponse, ALL).kind, "error");
  assert.equal(normalizeBackupHealth(await getBackupHealth(ALL), ALL).kind, "unavailable");
});
