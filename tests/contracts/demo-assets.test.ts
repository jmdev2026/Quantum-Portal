import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_ALL_CUSTOMER_ASSETS, DEMO_CUSTOMER_ASSETS, buildDemoAssetSummary } from "@/demo/dashboard-assets";
import { assetSummarySource, visibleAssetSummary, type AssetSummaryState } from "@/components/dashboard/asset-summary-view";
import {
  ASSET_METRIC_KEYS,
  getAssetSummary,
  getDemoAssetSummary,
  normalizeAssetSummary,
  type AssetMetricState,
  type AssetScope,
} from "@/services/dashboard-assets";
import { customersResponse } from "@/mocks/customers";

const ALL = { type: "all" } as const;
const scopeOf = (id: number): AssetScope => ({ type: "customer", customer_id: id });
const values = (scope: AssetScope, response = buildDemoAssetSummary(scope)) => {
  const result = normalizeAssetSummary(response, scope);
  assert.ok(result.ok);
  return Object.fromEntries(
    ASSET_METRIC_KEYS.map((key) => {
      const metric = result.metrics[key];
      return [key, metric.kind === "ready" ? metric.value : metric.kind];
    }),
  );
};

test("demo fixtures cover exactly the existing demo customer IDs", () => {
  const ids = customersResponse.data.filter((c) => c.is_demo).map((c) => c.id);
  assert.deepEqual([...DEMO_CUSTOMER_ASSETS.keys()].sort(), ids.sort());
});

test("All Customers demo figures match the specified totals", () => {
  assert.deepEqual(values(ALL), { users: 146, devices: 83, mailboxes: 144, cloud_drives: 152, internet_assets: 35 });
});

test("explicit All Customers totals equal the sum of the demo customers", () => {
  for (const key of ASSET_METRIC_KEYS) {
    const sum = [...DEMO_CUSTOMER_ASSETS.values()].reduce((total, counts) => total + counts[key], 0);
    assert.equal(DEMO_ALL_CUSTOMER_ASSETS[key], sum, key);
  }
});

test("each demo customer has its own distinct figures", () => {
  assert.deepEqual(values(scopeOf(1)), { users: 62, devices: 35, mailboxes: 61, cloud_drives: 64, internet_assets: 14 });
  assert.deepEqual(values(scopeOf(2)), { users: 48, devices: 27, mailboxes: 47, cloud_drives: 50, internet_assets: 12 });
  assert.deepEqual(values(scopeOf(3)), { users: 36, devices: 21, mailboxes: 36, cloud_drives: 38, internet_assets: 9 });
});

test("demo data passes the existing contract with no sync time, source or issue counts", async () => {
  for (const scope of [ALL, scopeOf(1), scopeOf(2), scopeOf(3)]) {
    const response = await getDemoAssetSummary(scope);
    assert.deepEqual(response.data.scope, scope);
    const result = normalizeAssetSummary(response, scope);
    if (!result.ok) return assert.fail("demo response rejected");
    for (const key of ASSET_METRIC_KEYS) {
      const metric: AssetMetricState = result.metrics[key];
      assert.ok(metric.kind === "ready" && metric.lastSyncedAt === null && metric.source === null && metric.issueCount === null);
    }
  }
});

test("unknown or invalid customer IDs never fall back to other customers' figures", () => {
  for (const id of [0, 4, 99, -1, 1.5, Number.NaN]) {
    const scope = scopeOf(id);
    const metrics = buildDemoAssetSummary(scope).data.metrics;
    assert.ok(metrics.every((m) => m.status === "error" && m.value === null), String(id));
    if (Number.isSafeInteger(id)) {
      assert.ok(Object.values(values(scope)).every((v) => v === "error"), String(id));
    }
  }
});

test("a demo response for one customer is rejected under another view", () => {
  assert.equal(normalizeAssetSummary(buildDemoAssetSummary(scopeOf(1)), scopeOf(2)).ok, false);
  assert.equal(normalizeAssetSummary(buildDemoAssetSummary(ALL), scopeOf(1)).ok, false);
  assert.equal(normalizeAssetSummary(buildDemoAssetSummary(scopeOf(2)), ALL).ok, false);
});

test("live mode uses the unavailable service and never returns numbers", async () => {
  assert.equal(assetSummarySource("live"), getAssetSummary);
  assert.equal(assetSummarySource("demo"), getDemoAssetSummary);
  for (const scope of [ALL, scopeOf(1), scopeOf(2), scopeOf(3)]) {
    const response = await assetSummarySource("live")(scope);
    assert.ok(response.data.metrics.every((m) => m.status === "unavailable" && m.value === null));
  }
});

const readyFor = (scope: AssetScope): AssetSummaryState => {
  const result = normalizeAssetSummary(buildDemoAssetSummary(scope), scope);
  assert.ok(result.ok);
  return { status: "ready", metrics: result.metrics };
};

test("data tagged for another mode or customer is hidden immediately", () => {
  const demoAll = { mode: "demo", customerId: null, state: readyFor(ALL) } as const;
  const demoA = { mode: "demo", customerId: 1, state: readyFor(scopeOf(1)) } as const;
  assert.deepEqual(visibleAssetSummary(demoAll, "live", null), { status: "loading" });
  assert.deepEqual(visibleAssetSummary(demoA, "live", 1), { status: "loading" });
  assert.deepEqual(visibleAssetSummary(demoA, "demo", 2), { status: "loading" });
  assert.deepEqual(visibleAssetSummary(demoA, "demo", null), { status: "loading" });
  assert.deepEqual(visibleAssetSummary(demoAll, "demo", 1), { status: "loading" });
  assert.equal(visibleAssetSummary(demoA, "demo", 1), demoA.state);
  assert.equal(visibleAssetSummary(demoAll, "demo", null), demoAll.state);
});

test("out-of-order responses: a late response for an earlier request is never displayed", async () => {
  // Simulates Demo A requested, then Demo B, then Live — with responses arriving in reverse.
  const requests = [
    { mode: "demo", customerId: 1 },
    { mode: "demo", customerId: 2 },
    { mode: "live", customerId: 2 },
  ] as const;
  const current = requests[requests.length - 1];
  for (const request of [...requests].reverse()) {
    const scope = scopeOf(request.customerId);
    const result = normalizeAssetSummary(await assetSummarySource(request.mode)(scope), scope);
    assert.ok(result.ok);
    const loaded = { ...request, state: { status: "ready", metrics: result.metrics } as const };
    const visible = visibleAssetSummary(loaded, current.mode, current.customerId);
    if (request === current) {
      assert.ok(visible.status === "ready" && Object.values(visible.metrics).every((m) => m.kind === "unavailable"));
    } else {
      assert.deepEqual(visible, { status: "loading" }, JSON.stringify(request));
    }
  }
});
