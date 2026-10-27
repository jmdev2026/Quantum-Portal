import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCoveragePercentage as formatPercentage,
  getSecurityCoverage,
  normalizeSecurityCoverage as n,
  SECURITY_CONTROLS,
} from "@/services/security-coverage";

const ALL = { type: "all" } as const;
const B = { type: "customer", customer_id: 2 } as const;
const basis = "Share of managed devices reporting an active endpoint agent (test fixture)";
const sync = { source: "test-source", last_synced_at: "2026-10-27T08:00:00Z" };
const controls = [
  { key: "mdr", status: "covered" },
  { key: "email_protection", status: "needs_attention" },
  { key: "phishing_simulations", status: "unknown" },
];
const res = (data: Record<string, unknown>) => ({ data: { scope: ALL, ...sync, ...data } });

test("exactly nine security controls are defined, with unique keys", () => {
  assert.equal(SECURITY_CONTROLS.length, 9);
  assert.equal(new Set(SECURITY_CONTROLS.map((c) => c.key)).size, 9);
});

test("ready returns percentage, basis, controls and sync info", () => {
  assert.deepEqual(n(res({ status: "ready", coverage_percentage: 87.5, coverage_basis: basis, controls }), ALL), {
    kind: "ready",
    coverage: { percentage: 87.5, basis },
    controls: { mdr: "covered", email_protection: "needs_attention", phishing_simulations: "unknown" },
    source: "test-source",
    lastSyncedAt: "2026-10-27T08:00:00Z",
  });
});

for (const value of [0, 100, 0.1, 42.25, 99.99]) {
  test(`verified percentage ${value} is accepted unchanged`, () => {
    const s = n(res({ status: "ready", coverage_percentage: value, coverage_basis: basis }), ALL);
    assert.equal(s.kind === "ready" && s.coverage?.percentage, value);
  });
}

for (const [label, bad] of [
  ["negative", -0.1],
  ["above 100", 100.01],
  ["string", "87"],
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["boolean", true],
  ["object", { value: 50 }],
] as const) {
  test(`${label} percentage is rejected`, () => {
    assert.equal(n(res({ status: "ready", coverage_percentage: bad, coverage_basis: basis }), ALL).kind, "error");
  });
}

test("percentage without an explanation of what it measures is rejected", () => {
  for (const missing of [undefined, null, "", "   ", 5]) {
    const s = n(res({ status: "ready", coverage_percentage: 80, coverage_basis: missing }), ALL);
    assert.equal(s.kind, "error", JSON.stringify(missing));
  }
});

test("missing or null percentage is unavailable, not zero, and is not computed from controls", () => {
  const allCovered = SECURITY_CONTROLS.map(({ key }) => ({ key, status: "covered" }));
  for (const coverage_percentage of [undefined, null]) {
    const s = n(res({ status: "ready", coverage_percentage, controls: allCovered }), ALL);
    assert.equal(s.kind, "ready");
    assert.equal(s.kind === "ready" && s.coverage, null);
  }
});

test("stale keeps values and is identified as stale", () => {
  const s = n(res({ status: "stale", coverage_percentage: 60, coverage_basis: basis }), ALL);
  assert.equal(s.kind, "stale");
  assert.equal(s.kind === "stale" && s.coverage?.percentage, 60);
  assert.equal(s.kind === "stale" && s.controls, null);
});

test("ready or stale with no percentage and no controls is rejected", () => {
  for (const status of ["ready", "stale"]) {
    assert.equal(n(res({ status }), ALL).kind, "error");
    assert.equal(n(res({ status, coverage_percentage: null, controls: [] }), ALL).kind, "error");
  }
});

test("controls that were not reported stay absent (never marked failed)", () => {
  const s = n(res({ status: "ready", controls: [{ key: "mdr", status: "covered" }] }), ALL);
  assert.ok(s.kind === "ready" && s.controls);
  assert.deepEqual(s.controls, { mdr: "covered" });
  assert.equal(s.controls.itdr, undefined);
});

test("malformed controls are rejected", () => {
  for (const bad of [
    "covered",
    { mdr: "covered" },
    [{ key: "firewall", status: "covered" }],
    [{ key: "mdr", status: "protected" }],
    [{ key: "mdr", status: "failed" }],
    [{ key: "mdr" }],
    [null],
    [{ key: "mdr", status: "covered" }, { key: "mdr", status: "unknown" }],
  ]) {
    assert.equal(n(res({ status: "ready", coverage_percentage: 50, coverage_basis: basis, controls: bad }), ALL).kind, "error", JSON.stringify(bad));
  }
});

test("empty and unavailable never carry coverage values, even if sent", () => {
  for (const status of ["empty", "unavailable"]) {
    const s = n(res({ status, coverage_percentage: 90, coverage_basis: basis, controls }), ALL);
    assert.deepEqual(s, { kind: status, source: "test-source", lastSyncedAt: "2026-10-27T08:00:00Z" });
  }
});

test("error status keeps provider message or falls back", () => {
  assert.deepEqual(n(res({ status: "error", message: "Provider timeout" }), ALL), { kind: "error", message: "Provider timeout" });
  const s = n(res({ status: "error" }), ALL);
  assert.ok(s.kind === "error" && s.message.length > 0);
});

test("unknown or missing status is rejected", () => {
  assert.equal(n(res({ status: "protected", coverage_percentage: 50, coverage_basis: basis }), ALL).kind, "error");
  assert.equal(n(res({ coverage_percentage: 50, coverage_basis: basis }), ALL).kind, "error");
});

test("invalid sync timestamp and blank source become null", () => {
  const s = n({ data: { scope: ALL, status: "ready", controls, last_synced_at: "soon", source: " " } }, ALL);
  assert.equal(s.kind === "ready" && s.lastSyncedAt, null);
  assert.equal(s.kind === "ready" && s.source, null);
});

test("response for a different customer is rejected", () => {
  const other = { data: { scope: { type: "customer", customer_id: 3 }, status: "ready", controls } };
  assert.equal(n(other, B).kind, "error");
});

test("All Customers response is rejected for a single customer view, and vice versa", () => {
  assert.equal(n({ data: { scope: ALL, status: "ready", controls } }, B).kind, "error");
  assert.equal(n({ data: { scope: B, status: "ready", controls } }, ALL).kind, "error");
});

test("missing or malformed scope is rejected", () => {
  for (const scope of [undefined, null, {}, { type: "customer" }, { type: "customer", customer_id: "2" }]) {
    assert.equal(n({ data: { scope, status: "ready", controls } }, B).kind, "error", JSON.stringify(scope));
  }
});

test("matching customer scope is accepted", () => {
  assert.equal(n({ data: { scope: B, status: "ready", controls } }, B).kind, "ready");
});

test("malformed responses are rejected", () => {
  for (const bad of [null, undefined, "x", 4, [], {}, { data: null }, { data: [] }]) {
    assert.equal(n(bad, ALL).kind, "error", JSON.stringify(bad));
  }
});

test("percentage display truncates instead of rounding up", () => {
  assert.equal(formatPercentage(0), "0%");
  assert.equal(formatPercentage(100), "100%");
  assert.equal(formatPercentage(99.96).startsWith("99"), true);
  assert.equal(formatPercentage(0.29).replace(/[^\d]/g, ""), "02");
});

test("mock service reports unavailable for All Customers with no values", async () => {
  const response = await getSecurityCoverage(ALL);
  assert.deepEqual(response.data.scope, ALL);
  assert.equal(response.data.status, "unavailable");
  assert.equal(response.data.coverage_percentage, null);
  assert.equal(response.data.controls, null);
  assert.equal(n(response, ALL).kind, "unavailable");
});

test("mock service echoes the selected customer scope", async () => {
  const response = await getSecurityCoverage(B);
  assert.deepEqual(response.data.scope, B);
  assert.equal(n(response, B).kind, "unavailable");
});
