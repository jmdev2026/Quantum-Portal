import test from "node:test";
import assert from "node:assert/strict";
import { customersResponse } from "@/mocks/customers";
import {
  buildDemoBackupHealth,
  DEMO_ALL_CUSTOMER_BACKUP_HEALTH,
  DEMO_BACKUP_SOURCE,
  DEMO_CUSTOMER_BACKUP_HEALTH,
} from "@/demo/backup-health";
import {
  FRESHNESS_BUCKETS,
  getBackupHealth,
  getDemoBackupHealth,
  JOB_OUTCOMES,
  normalizeBackupHealth,
  type BackupHealthState,
} from "@/services/backup-health";
import { backupHealthSource, visibleBackupHealth, type LoadedBackupHealth } from "@/components/dashboard/backup-health-view";
import type { DashboardScope } from "@/services/dashboard-response";

const ALL = { type: "all" } as const;
const scopeOf = (id: number | null): DashboardScope => (id === null ? ALL : { type: "customer", customer_id: id });

const EXPECTED = [
  {
    id: null,
    protectedAssets: 61,
    freshness: { less_than_1_hour: 4, "1_to_3_hours": 8, "4_to_24_hours": 28, more_than_24_hours: 15, no_successful_backup: 6 },
    outcomes: { successful: 48, partially_successful: 3, degraded_or_failed: 5, not_available: 7 },
  },
  {
    id: 1,
    protectedAssets: 18,
    freshness: { less_than_1_hour: 2, "1_to_3_hours": 3, "4_to_24_hours": 9, more_than_24_hours: 3, no_successful_backup: 1 },
    outcomes: { successful: 15, partially_successful: 1, degraded_or_failed: 1, not_available: 2 },
  },
  {
    id: 2,
    protectedAssets: 27,
    freshness: { less_than_1_hour: 1, "1_to_3_hours": 3, "4_to_24_hours": 11, more_than_24_hours: 9, no_successful_backup: 3 },
    outcomes: { successful: 20, partially_successful: 1, degraded_or_failed: 3, not_available: 3 },
  },
  {
    id: 3,
    protectedAssets: 16,
    freshness: { less_than_1_hour: 1, "1_to_3_hours": 2, "4_to_24_hours": 8, more_than_24_hours: 3, no_successful_backup: 2 },
    outcomes: { successful: 13, partially_successful: 1, degraded_or_failed: 1, not_available: 2 },
  },
];

test("backup fixtures are keyed by the existing demo customer IDs", () => {
  const ids = customersResponse.data.map((customer) => customer.id).sort();
  assert.deepEqual([...DEMO_CUSTOMER_BACKUP_HEALTH.keys()].sort(), ids);
});

test("each view returns the specified protected assets, freshness and job outcomes through the normalizer", () => {
  for (const { id, protectedAssets, freshness, outcomes } of EXPECTED) {
    const scope = scopeOf(id);
    const state = normalizeBackupHealth(buildDemoBackupHealth(scope), scope);
    assert.deepEqual(
      state,
      {
        kind: "ready",
        protectedAssets,
        freshness,
        jobOutcomes: { period: "last_24_hours", basis: "job_executions", windowStart: null, windowEnd: null, counts: outcomes },
        source: DEMO_BACKUP_SOURCE,
        lastSyncedAt: null,
      },
      String(id),
    );
  }
});

test("fixtures cover exactly the five freshness and four outcome categories", () => {
  for (const fixture of [DEMO_ALL_CUSTOMER_BACKUP_HEALTH, ...DEMO_CUSTOMER_BACKUP_HEALTH.values()]) {
    assert.deepEqual(Object.keys(fixture.freshness), FRESHNESS_BUCKETS.map((bucket) => bucket.key));
    assert.deepEqual(Object.keys(fixture.jobOutcomes), JOB_OUTCOMES.map((outcome) => outcome.key));
  }
});

test("job outcome totals are not forced to match protected assets or freshness", () => {
  const jobTotal = (id: number | null) => {
    const fixture = id === null ? DEMO_ALL_CUSTOMER_BACKUP_HEALTH : DEMO_CUSTOMER_BACKUP_HEALTH.get(id)!;
    return Object.values(fixture.jobOutcomes).reduce((total, count) => total + count, 0);
  };
  assert.notEqual(jobTotal(null), DEMO_ALL_CUSTOMER_BACKUP_HEALTH.protectedAssets);
  assert.notEqual(jobTotal(1), DEMO_CUSTOMER_BACKUP_HEALTH.get(1)!.protectedAssets);
});

test("All Customers figures are explicit values consistent with the per-customer fixtures", () => {
  const customers = [...DEMO_CUSTOMER_BACKUP_HEALTH.values()];
  assert.equal(DEMO_ALL_CUSTOMER_BACKUP_HEALTH.protectedAssets, customers.reduce((t, f) => t + f.protectedAssets, 0));
  for (const { key } of FRESHNESS_BUCKETS) {
    assert.equal(DEMO_ALL_CUSTOMER_BACKUP_HEALTH.freshness[key], customers.reduce((t, f) => t + f.freshness[key], 0), key);
  }
  for (const { key } of JOB_OUTCOMES) {
    assert.equal(DEMO_ALL_CUSTOMER_BACKUP_HEALTH.jobOutcomes[key], customers.reduce((t, f) => t + f.jobOutcomes[key], 0), key);
  }
});

test("demo responses carry a synthetic source, no sync timestamp, no window timestamps and no rate", async () => {
  for (const { id } of EXPECTED) {
    const response = await getDemoBackupHealth(scopeOf(id));
    const { data } = response;
    assert.equal(data.status, "ready");
    assert.equal(data.source, DEMO_BACKUP_SOURCE);
    assert.equal(data.last_synced_at, null);
    assert.deepEqual(data.scope, scopeOf(id));
    assert.equal(data.job_outcomes?.window_start ?? null, null);
    assert.equal(data.job_outcomes?.window_end ?? null, null);
    assert.doesNotMatch(String(data.source), /datto|kaseya/i);
    assert.doesNotMatch(JSON.stringify(response), /rate|percent|storage|licen|history|\d{4}-\d{2}-\d{2}T/i);
  }
});

test("fixture objects are not shared with responses", () => {
  const response = buildDemoBackupHealth(ALL);
  assert.notEqual(response.data.freshness, DEMO_ALL_CUSTOMER_BACKUP_HEALTH.freshness);
  assert.notEqual(response.data.job_outcomes?.counts, DEMO_ALL_CUSTOMER_BACKUP_HEALTH.jobOutcomes);
});

test("unknown or invalid customer IDs never fall back to other customers' figures", () => {
  for (const id of [0, 4, 99, -1, 1.5, Number.NaN]) {
    const scope = scopeOf(id);
    const response = buildDemoBackupHealth(scope);
    assert.equal(response.data.status, "error", String(id));
    assert.equal(response.data.protected_assets, null);
    assert.equal(response.data.freshness, null);
    assert.equal(response.data.job_outcomes, null);
    if (Number.isSafeInteger(id) && id > 0) {
      assert.deepEqual(normalizeBackupHealth(response, scope), {
        kind: "error",
        message: "No demonstration data exists for this customer.",
      });
    }
  }
});

test("a demo response for one view is rejected under another view", () => {
  const pairs: [DashboardScope, DashboardScope][] = [
    [scopeOf(1), scopeOf(2)],
    [ALL, scopeOf(1)],
    [scopeOf(2), ALL],
    [scopeOf(3), scopeOf(1)],
  ];
  for (const [sent, requested] of pairs) {
    const state = normalizeBackupHealth(buildDemoBackupHealth(sent), requested);
    assert.deepEqual(state, { kind: "error", message: "Backup data did not match the selected customer view." });
  }
});

test("existing validation still rejects tampered demo values", () => {
  const negative = buildDemoBackupHealth(ALL);
  negative.data.protected_assets = -1;
  assert.equal(normalizeBackupHealth(negative, ALL).kind, "error");

  const fractional = buildDemoBackupHealth(ALL);
  fractional.data.freshness = { ...fractional.data.freshness, less_than_1_hour: 1.5 };
  assert.equal(normalizeBackupHealth(fractional, ALL).kind, "error");

  const badOutcome = buildDemoBackupHealth(ALL);
  badOutcome.data.job_outcomes!.counts = { ...badOutcome.data.job_outcomes!.counts, successful: -3 };
  assert.equal(normalizeBackupHealth(badOutcome, ALL).kind, "error");

  const badPeriod = buildDemoBackupHealth(ALL);
  (badPeriod.data.job_outcomes as { period: string }).period = "last_7_days";
  assert.equal(normalizeBackupHealth(badPeriod, ALL).kind, "error");

  const badBasis = buildDemoBackupHealth(ALL);
  (badBasis.data.job_outcomes as { basis: string }).basis = "success_rate";
  assert.equal(normalizeBackupHealth(badBasis, ALL).kind, "error");

  const futureWindow = buildDemoBackupHealth(ALL);
  futureWindow.data.job_outcomes!.window_end = "2999-01-01T00:00:00Z";
  assert.equal(normalizeBackupHealth(futureWindow, ALL).kind, "error");

  const futureSync = buildDemoBackupHealth(ALL);
  futureSync.data.last_synced_at = "2999-01-01T00:00:00Z";
  const synced = normalizeBackupHealth(futureSync, ALL);
  assert.equal(synced.kind === "ready" ? synced.lastSyncedAt : "unexpected", null);
});

test("explicit zero stays zero and null stays unavailable for demo-shaped responses", () => {
  const zero = buildDemoBackupHealth(scopeOf(1));
  zero.data.freshness = { ...zero.data.freshness, no_successful_backup: 0 };
  zero.data.job_outcomes!.counts = { ...zero.data.job_outcomes!.counts, not_available: null };
  const state = normalizeBackupHealth(zero, scopeOf(1));
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") return;
  assert.equal(state.freshness?.no_successful_backup, 0);
  assert.equal(state.jobOutcomes?.counts.not_available, null);
});

test("live mode uses the unavailable service and never returns figures", async () => {
  assert.equal(backupHealthSource("live"), getBackupHealth);
  assert.equal(backupHealthSource("demo"), getDemoBackupHealth);
  for (const { id } of EXPECTED) {
    const scope = scopeOf(id);
    const state = normalizeBackupHealth(await backupHealthSource("live")(scope), scope);
    assert.deepEqual(state, { kind: "unavailable", source: null, lastSyncedAt: null });
  }
});

const readyFor = (id: number | null): BackupHealthState => normalizeBackupHealth(buildDemoBackupHealth(scopeOf(id)), scopeOf(id));

test("data tagged for another mode or customer is hidden immediately", () => {
  const demoAll: LoadedBackupHealth = { mode: "demo", customerId: null, state: readyFor(null) };
  const demoA: LoadedBackupHealth = { mode: "demo", customerId: 1, state: readyFor(1) };
  const loading = { kind: "loading" };
  assert.deepEqual(visibleBackupHealth(demoAll, "live", null), loading);
  assert.deepEqual(visibleBackupHealth(demoA, "live", 1), loading);
  assert.deepEqual(visibleBackupHealth(demoA, "demo", 2), loading);
  assert.deepEqual(visibleBackupHealth(demoA, "demo", null), loading);
  assert.deepEqual(visibleBackupHealth(demoAll, "demo", 1), loading);
  assert.equal(visibleBackupHealth(demoA, "demo", 1), demoA.state);
  assert.equal(visibleBackupHealth(demoAll, "demo", null), demoAll.state);
});

test("out-of-order responses: a late response for an earlier request is never displayed", async () => {
  const requests = [
    { mode: "demo", customerId: null },
    { mode: "demo", customerId: 1 },
    { mode: "demo", customerId: 2 },
    { mode: "demo", customerId: 3 },
    { mode: "live", customerId: 3 },
  ] as const;
  const current = requests[requests.length - 1];
  for (const request of [...requests].reverse()) {
    const scope = scopeOf(request.customerId);
    const state = normalizeBackupHealth(await backupHealthSource(request.mode)(scope), scope);
    const visible = visibleBackupHealth({ ...request, state }, current.mode, current.customerId);
    if (request === current) assert.equal(visible.kind, "unavailable");
    else assert.deepEqual(visible, { kind: "loading" });
  }
});
