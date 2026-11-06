import test from "node:test";
import assert from "node:assert/strict";
import { customersResponse } from "@/mocks/customers";
import { DEMO_ALL_CUSTOMER_ASSETS, DEMO_CUSTOMER_ASSETS } from "@/demo/dashboard-assets";
import { DEMO_ALL_CUSTOMER_SEVERITY, DEMO_CUSTOMER_SEVERITY } from "@/demo/security-severity";
import { DEMO_ALL_CUSTOMER_COVERAGE, DEMO_CUSTOMER_COVERAGE } from "@/demo/security-coverage";
import { DEMO_ALL_CUSTOMER_INSIGHTS, DEMO_CUSTOMER_INSIGHTS } from "@/demo/insights";
import { DEMO_ALL_CUSTOMER_BACKUP_HEALTH, DEMO_CUSTOMER_BACKUP_HEALTH } from "@/demo/backup-health";
import { DEMO_ALL_CUSTOMER_IDS, DEMO_CUSTOMER_REPORTING } from "@/demo/customer-overview";
import { getAssetSummary, getDemoAssetSummary, normalizeAssetSummary } from "@/services/dashboard-assets";
import { getDemoSecuritySeverity, getSecuritySeverity, normalizeSecuritySeverity } from "@/services/security-severity";
import { getDemoSecurityCoverage, getSecurityCoverage, normalizeSecurityCoverage } from "@/services/security-coverage";
import { getDemoInsights, getInsights, normalizeInsights } from "@/services/insights";
import { getBackupHealth, getDemoBackupHealth, normalizeBackupHealth } from "@/services/backup-health";
import { getCustomerOverview, getDemoCustomerOverview, normalizeCustomerOverview } from "@/services/customer-overview";
import type { DashboardScope } from "@/services/dashboard-response";

const ALL: DashboardScope = { type: "all" };
const scopeOf = (id: number | null): DashboardScope => (id === null ? ALL : { type: "customer", customer_id: id });
const CUSTOMER_IDS = customersResponse.data.map((c) => c.id).sort();
const VIEWS: (number | null)[] = [null, ...CUSTOMER_IDS];

// One entry per dashboard area: the demo/live service plus a normalizer reduced to "ready or not" and its display values.
type Panel = {
  name: string;
  demo: (scope: DashboardScope) => Promise<unknown>;
  live: (scope: DashboardScope) => Promise<unknown>;
  read: (response: unknown, scope: DashboardScope) => { ready: boolean; values: unknown; synced: (string | null)[] };
};

const PANELS: Panel[] = [
  {
    name: "assets",
    demo: getDemoAssetSummary,
    live: getAssetSummary,
    read: (r, s) => {
      const result = normalizeAssetSummary(r, s);
      if (!result.ok) return { ready: false, values: null, synced: [] };
      const metrics = Object.entries(result.metrics);
      if (!metrics.every(([, m]) => m.kind === "ready")) return { ready: false, values: null, synced: [] };
      return {
        ready: true,
        values: Object.fromEntries(metrics.map(([k, m]) => [k, m.kind === "ready" ? m.value : null])),
        synced: metrics.map(([, m]) => ("lastSyncedAt" in m ? m.lastSyncedAt : null)),
      };
    },
  },
  {
    name: "severity",
    demo: getDemoSecuritySeverity,
    live: getSecuritySeverity,
    read: (r, s) => {
      const st = normalizeSecuritySeverity(r, s);
      return st.kind === "ready"
        ? { ready: true, values: { counts: st.counts, total: st.total }, synced: [st.lastSyncedAt] }
        : { ready: false, values: null, synced: [] };
    },
  },
  {
    name: "coverage",
    demo: getDemoSecurityCoverage,
    live: getSecurityCoverage,
    read: (r, s) => {
      const st = normalizeSecurityCoverage(r, s);
      return st.kind === "ready"
        ? { ready: true, values: { percentage: st.coverage?.percentage, controls: st.controls }, synced: [st.lastSyncedAt] }
        : { ready: false, values: null, synced: [] };
    },
  },
  {
    name: "insights",
    demo: getDemoInsights,
    live: getInsights,
    read: (r, s) => {
      const st = normalizeInsights(r, s);
      return st.kind === "ready"
        ? { ready: true, values: st.insights.map((i) => i.title), synced: [st.lastSyncedAt] }
        : { ready: false, values: null, synced: [] };
    },
  },
  {
    name: "backup",
    demo: getDemoBackupHealth,
    live: getBackupHealth,
    read: (r, s) => {
      const st = normalizeBackupHealth(r, s);
      return st.kind === "ready"
        ? {
            ready: true,
            values: { protectedAssets: st.protectedAssets, freshness: st.freshness, jobOutcomes: st.jobOutcomes?.counts },
            synced: [st.lastSyncedAt],
          }
        : { ready: false, values: null, synced: [] };
    },
  },
  {
    name: "overview",
    demo: getDemoCustomerOverview,
    live: getCustomerOverview,
    read: (r, s) => {
      const st = normalizeCustomerOverview(r, s);
      return st.kind === "ready"
        ? {
            ready: true,
            values: st.customers.map((c) => [c.id, c.name]),
            synced: [st.lastSyncedAt, ...st.customers.map((c) => c.lastSyncedAt)],
          }
        : { ready: false, values: null, synced: [] };
    },
  },
];

test("all six demo fixtures are keyed by exactly the canonical customer IDs", () => {
  const keySets = {
    assets: DEMO_CUSTOMER_ASSETS,
    severity: DEMO_CUSTOMER_SEVERITY,
    coverage: DEMO_CUSTOMER_COVERAGE,
    insights: DEMO_CUSTOMER_INSIGHTS,
    backup: DEMO_CUSTOMER_BACKUP_HEALTH,
    overview: DEMO_CUSTOMER_REPORTING,
  };
  for (const [name, map] of Object.entries(keySets)) {
    assert.deepEqual([...map.keys()].sort(), CUSTOMER_IDS, name);
  }
  assert.deepEqual([...DEMO_ALL_CUSTOMER_IDS].sort(), CUSTOMER_IDS);
});

test("every panel populates for every view in Demo Mode with no sync timestamps", async () => {
  await Promise.all(
    VIEWS.flatMap((id) =>
      PANELS.map(async (panel) => {
        const read = panel.read(await panel.demo(scopeOf(id)), scopeOf(id));
        assert.equal(read.ready, true, `${panel.name} ${id}`);
        assert.ok(read.synced.every((t) => t === null), `${panel.name} ${id} invented a sync time`);
      }),
    ),
  );
});

test("demo values shown for each view come from that view's fixture only", async () => {
  for (const id of VIEWS) {
    const scope = scopeOf(id);
    const [assets, severity, coverage, , backup, overview] = await Promise.all(
      PANELS.map(async (p) => p.read(await p.demo(scope), scope).values),
    );
    assert.deepEqual(assets, id === null ? DEMO_ALL_CUSTOMER_ASSETS : DEMO_CUSTOMER_ASSETS.get(id));
    const sev = id === null ? DEMO_ALL_CUSTOMER_SEVERITY : DEMO_CUSTOMER_SEVERITY.get(id)!;
    assert.deepEqual(severity, { counts: sev.counts, total: sev.total });
    const cov = id === null ? DEMO_ALL_CUSTOMER_COVERAGE : DEMO_CUSTOMER_COVERAGE.get(id)!;
    assert.deepEqual(coverage, { percentage: cov.percentage, controls: cov.controls });
    assert.deepEqual(backup, id === null ? DEMO_ALL_CUSTOMER_BACKUP_HEALTH : DEMO_CUSTOMER_BACKUP_HEALTH.get(id));
    const expectedIds = id === null ? CUSTOMER_IDS : [id];
    const nameOf = (cid: number) => customersResponse.data.find((c) => c.id === cid)!.name;
    assert.deepEqual(overview, expectedIds.map((cid) => [cid, nameOf(cid)]));
  }
});

test("insight titles shown for each view match that view's fixture", async () => {
  for (const id of VIEWS) {
    const scope = scopeOf(id);
    const fixture = id === null ? DEMO_ALL_CUSTOMER_INSIGHTS : DEMO_CUSTOMER_INSIGHTS.get(id)!;
    const shown = PANELS[3].read(await getDemoInsights(scope), scope).values as string[];
    assert.deepEqual([...shown].sort(), fixture.map((i) => i.title).sort(), String(id));
  }
});

test("every customer's figures differ from every other customer's in at least one panel value", async () => {
  const snapshot = async (id: number) =>
    JSON.stringify(await Promise.all(PANELS.map(async (p) => p.read(await p.demo(scopeOf(id)), scopeOf(id)).values)));
  const snaps = await Promise.all(CUSTOMER_IDS.map(snapshot));
  assert.equal(new Set(snaps).size, CUSTOMER_IDS.length);
});

test("no panel accepts another view's demo response, so stale customer data can never display", async () => {
  await Promise.all(
    VIEWS.flatMap((shown) =>
      PANELS.map(async (panel) => {
        const response = await panel.demo(scopeOf(shown));
        for (const requested of VIEWS) {
          if (shown === requested) continue;
          assert.equal(panel.read(response, scopeOf(requested)).ready, false, `${panel.name} ${shown}->${requested}`);
        }
      }),
    ),
  );
});

test("unknown customer IDs produce an error in every panel, never another customer's figures", async () => {
  for (const id of [0, 4, 99, -1]) {
    for (const panel of PANELS) {
      const scope = scopeOf(id);
      assert.equal(panel.read(await panel.demo(scope), scope).ready, false, `${panel.name} ${id}`);
    }
  }
});

test("Live Mode services return no populated panel for any view", async () => {
  for (const id of VIEWS) {
    for (const panel of PANELS) {
      const scope = scopeOf(id);
      const read = panel.read(await panel.live(scope), scope);
      assert.equal(read.ready, false, `${panel.name} ${id}`);
      assert.equal(read.values, null);
    }
  }
});

test("security and backup panels stay separate: no shared keys or derived totals", () => {
  for (const id of VIEWS) {
    const sev = id === null ? DEMO_ALL_CUSTOMER_SEVERITY : DEMO_CUSTOMER_SEVERITY.get(id)!;
    const backup = id === null ? DEMO_ALL_CUSTOMER_BACKUP_HEALTH : DEMO_CUSTOMER_BACKUP_HEALTH.get(id)!;
    const securityKeys = new Set([...Object.keys(sev), ...Object.keys(sev.counts)]);
    for (const key of [...Object.keys(backup), ...Object.keys(backup.freshness), ...Object.keys(backup.jobOutcomes)]) {
      assert.ok(!securityKeys.has(key), `${id} shares ${key}`);
    }
  }
});
