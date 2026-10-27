import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSET_METRIC_KEYS,
  getAssetSummary,
  normalizeAssetMetric as m,
  normalizeAssetSummary as n,
} from "@/services/dashboard-assets";

const ALL = { type: "all" } as const;
const B = { type: "customer", customer_id: 2 } as const;
const base = { key: "users", source: "test-source", last_synced_at: "2026-10-27T08:00:00Z" };

test("ready metric keeps value, issues and sync info", () => {
  assert.deepEqual(m({ ...base, status: "ready", value: 42, issue_count: 3 }), {
    kind: "ready",
    value: 42,
    issueCount: 3,
    source: "test-source",
    lastSyncedAt: "2026-10-27T08:00:00Z",
  });
});

test("explicit zero stays zero", () => {
  const s = m({ ...base, status: "ready", value: 0, issue_count: 0 });
  assert.equal(s.kind === "ready" && s.value, 0);
  assert.equal(s.kind === "ready" && s.issueCount, 0);
});

test("unavailable and empty never carry a value", () => {
  for (const status of ["unavailable", "empty"]) {
    const s = m({ ...base, status, value: 0 });
    assert.equal(s.kind, status);
    assert.equal("value" in s, false);
  }
});

test("invalid values become errors, not zero", () => {
  for (const bad of [null, undefined, "12", -1, 1.5, NaN, Infinity]) {
    assert.equal(m({ ...base, status: "ready", value: bad }).kind, "error", String(bad));
  }
});

test("stale keeps value; stale without value is an error", () => {
  const s = m({ ...base, status: "stale", value: 7 });
  assert.equal(s.kind === "stale" && s.value, 7);
  assert.equal(m({ ...base, status: "stale", value: null }).kind, "error");
});

test("missing or invalid issue count is null, not zero", () => {
  for (const issue of [undefined, null, -2, 1.2, "3"]) {
    const s = m({ ...base, status: "ready", value: 10, issue_count: issue });
    assert.equal(s.kind === "ready" && s.issueCount, null, String(issue));
  }
});

test("missing or invalid sync timestamp is null", () => {
  const s = m({ ...base, status: "ready", value: 1, last_synced_at: "not-a-date" });
  assert.equal(s.kind === "ready" && s.lastSyncedAt, null);
});

test("unknown status becomes error", () => {
  assert.equal(m({ ...base, status: "great", value: 1 }).kind, "error");
  assert.equal(m("nonsense").kind, "error");
});

test("summary: metrics missing from the response are unavailable", () => {
  const r = n({ data: { scope: ALL, metrics: [{ ...base, status: "ready", value: 4 }] } }, ALL);
  assert.ok(r.ok);
  for (const key of ASSET_METRIC_KEYS.filter((k) => k !== "users")) assert.equal(r.ok && r.metrics[key].kind, "unavailable");
});

test("summary: scope mismatch is rejected", () => {
  assert.equal(n({ data: { scope: { type: "customer", customer_id: 3 }, metrics: [] } }, B).ok, false);
  assert.equal(n({ data: { scope: ALL, metrics: [] } }, B).ok, false);
  assert.equal(n({ data: { scope: B, metrics: [] } }, ALL).ok, false);
});

test("summary: malformed responses are rejected", () => {
  for (const bad of [null, {}, { data: null }, { data: { scope: ALL } }, { data: { scope: ALL, metrics: "x" } }]) {
    assert.equal(n(bad, ALL).ok, false, JSON.stringify(bad));
  }
});

test("mock service returns every metric unavailable with no numbers", async () => {
  for (const scope of [ALL, B]) {
    const response = await getAssetSummary(scope);
    assert.deepEqual(response.data.scope, scope);
    assert.ok(response.data.metrics.every((metric) => metric.status === "unavailable" && metric.value === null));
    assert.equal(n(response, scope).ok, true);
  }
});
