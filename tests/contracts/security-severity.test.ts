import test from "node:test";
import assert from "node:assert/strict";
import { getSecuritySeverity, normalizeSecuritySeverity as n } from "@/services/security-severity";

const ALL = { type: "all" } as const;
const B = { type: "customer", customer_id: 2 } as const;
const counts = { critical: 1, high: 2, medium: 3, low: 4 };
const sync = { source: "test-source", last_synced_at: "2026-10-27T08:00:00Z" };
const res = (data: Record<string, unknown>) => ({ data: { scope: ALL, ...sync, ...data } });

test("ready returns counts, verified total and sync info", () => {
  assert.deepEqual(n(res({ status: "ready", counts, total: 10 }), ALL), {
    kind: "ready",
    counts,
    total: 10,
    source: "test-source",
    lastSyncedAt: "2026-10-27T08:00:00Z",
  });
});

test("stale keeps counts and is identified as stale", () => {
  const s = n(res({ status: "stale", counts }), ALL);
  assert.equal(s.kind, "stale");
  assert.deepEqual(s.kind === "stale" && s.counts, counts);
});

test("empty and unavailable never carry counts, even if sent", () => {
  for (const status of ["empty", "unavailable"]) {
    const s = n(res({ status, counts, total: 10 }), ALL);
    assert.equal(s.kind, status);
    assert.equal("counts" in s, false);
    assert.equal("total" in s, false);
  }
});

test("error status keeps provider message or falls back", () => {
  assert.deepEqual(n(res({ status: "error", message: "Provider timeout" }), ALL), { kind: "error", message: "Provider timeout" });
  const s = n(res({ status: "error", message: " " }), ALL);
  assert.ok(s.kind === "error" && s.message.length > 0);
});

test("unknown status is rejected", () => {
  assert.equal(n(res({ status: "excellent", counts }), ALL).kind, "error");
  assert.equal(n(res({ counts }), ALL).kind, "error");
});

test("explicit zeros from verified data stay zero", () => {
  const zero = { critical: 0, high: 0, medium: 0, low: 0 };
  const s = n(res({ status: "ready", counts: zero, total: 0 }), ALL);
  assert.equal(s.kind, "ready");
  assert.deepEqual(s.kind === "ready" && s.counts, zero);
  assert.equal(s.kind === "ready" && s.total, 0);
});

test("unavailable with null counts does not become zero", () => {
  const s = n(res({ status: "unavailable", counts: null, total: null }), ALL);
  assert.deepEqual(s, { kind: "unavailable", source: "test-source", lastSyncedAt: "2026-10-27T08:00:00Z" });
});

for (const [label, bad] of [
  ["negative", -1],
  ["decimal", 1.5],
  ["string", "3"],
  ["null", null],
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["unsafe integer", Number.MAX_SAFE_INTEGER + 1],
] as const) {
  test(`${label} severity count is rejected`, () => {
    const s = n(res({ status: "ready", counts: { ...counts, high: bad } }), ALL);
    assert.equal(s.kind, "error");
  });
}

test("missing severity key is rejected (not treated as zero)", () => {
  const { low: _low, ...partial } = counts;
  void _low;
  assert.equal(n(res({ status: "ready", counts: partial }), ALL).kind, "error");
  assert.equal(n(res({ status: "stale", counts: partial }), ALL).kind, "error");
});

test("malformed counts object is rejected", () => {
  for (const bad of [null, undefined, [], "counts", 7, [1, 2, 3, 4]]) {
    assert.equal(n(res({ status: "ready", counts: bad }), ALL).kind, "error", JSON.stringify(bad));
  }
});

test("total that does not match the breakdown is rejected", () => {
  assert.equal(n(res({ status: "ready", counts, total: 11 }), ALL).kind, "error");
  assert.equal(n(res({ status: "stale", counts, total: 9 }), ALL).kind, "error");
});

test("invalid total values are rejected", () => {
  for (const bad of [-10, 10.5, "10", NaN]) {
    assert.equal(n(res({ status: "ready", counts, total: bad }), ALL).kind, "error", String(bad));
  }
});

test("missing total shows no total (not computed in the browser)", () => {
  for (const total of [undefined, null]) {
    const s = n(res({ status: "ready", counts, total }), ALL);
    assert.equal(s.kind === "ready" && s.total, null);
  }
});

test("missing or invalid sync timestamp and source become null", () => {
  const s = n({ data: { scope: ALL, status: "ready", counts, last_synced_at: "yesterday", source: "" } }, ALL);
  assert.equal(s.kind === "ready" && s.lastSyncedAt, null);
  assert.equal(s.kind === "ready" && s.source, null);
});

test("response for a different customer is rejected", () => {
  const other = { data: { scope: { type: "customer", customer_id: 3 }, status: "ready", counts } };
  assert.equal(n(other, B).kind, "error");
});

test("All Customers response is rejected for a single customer view, and vice versa", () => {
  assert.equal(n({ data: { scope: ALL, status: "ready", counts } }, B).kind, "error");
  assert.equal(n({ data: { scope: B, status: "ready", counts } }, ALL).kind, "error");
});

test("missing or malformed scope is rejected", () => {
  for (const scope of [undefined, null, {}, { type: "customer" }, { type: "customer", customer_id: "2" }, { type: "tenant" }]) {
    assert.equal(n({ data: { scope, status: "ready", counts } }, B).kind, "error", JSON.stringify(scope));
  }
});

test("matching customer scope is accepted", () => {
  assert.equal(n({ data: { scope: B, status: "ready", counts } }, B).kind, "ready");
});

test("malformed responses are rejected", () => {
  for (const bad of [null, undefined, "x", [], {}, { data: null }, { data: [] }]) {
    assert.equal(n(bad, ALL).kind, "error", JSON.stringify(bad));
  }
});

test("mock service reports not connected for All Customers", async () => {
  const response = await getSecuritySeverity(ALL);
  assert.deepEqual(response.data.scope, ALL);
  assert.equal(response.data.status, "unavailable");
  assert.equal(response.data.counts, null);
  assert.equal(response.data.total, null);
  assert.equal(n(response, ALL).kind, "unavailable");
});

test("mock service echoes the selected customer scope", async () => {
  const response = await getSecuritySeverity(B);
  assert.deepEqual(response.data.scope, B);
  assert.equal(n(response, B).kind, "unavailable");
});
