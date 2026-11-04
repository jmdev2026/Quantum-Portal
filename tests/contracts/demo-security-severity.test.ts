import test from "node:test";
import assert from "node:assert/strict";
import { customersResponse } from "@/mocks/customers";
import {
  buildDemoSecuritySeverity,
  DEMO_ALL_CUSTOMER_SEVERITY,
  DEMO_CUSTOMER_SEVERITY,
  DEMO_SEVERITY_SOURCE,
} from "@/demo/security-severity";
import {
  getDemoSecuritySeverity,
  getSecuritySeverity,
  normalizeSecuritySeverity,
  SEVERITY_LEVELS,
  type SecuritySeverityState,
  type SeverityCounts,
} from "@/services/security-severity";
import {
  securitySeveritySource,
  visibleSecuritySeverity,
  type LoadedSecuritySeverity,
} from "@/components/dashboard/security-severity-view";
import type { DashboardScope } from "@/services/dashboard-response";

const ALL = { type: "all" } as const;
const scopeOf = (id: number | null): DashboardScope => (id === null ? ALL : { type: "customer", customer_id: id });
const sum = (counts: SeverityCounts) => SEVERITY_LEVELS.reduce((total, level) => total + counts[level], 0);

const EXPECTED = [
  { id: null, counts: { critical: 4, high: 23, medium: 41, low: 12 }, total: 80 },
  { id: 1, counts: { critical: 1, high: 7, medium: 12, low: 4 }, total: 24 },
  { id: 2, counts: { critical: 2, high: 9, medium: 16, low: 4 }, total: 31 },
  { id: 3, counts: { critical: 1, high: 7, medium: 13, low: 4 }, total: 25 },
];

test("severity fixtures are keyed by the existing demo customer IDs", () => {
  const ids = customersResponse.data.map((customer) => customer.id).sort();
  assert.deepEqual([...DEMO_CUSTOMER_SEVERITY.keys()].sort(), ids);
});

test("each view returns the specified fictional counts and verified total", () => {
  for (const { id, counts, total } of EXPECTED) {
    const scope = scopeOf(id);
    const state = normalizeSecuritySeverity(buildDemoSecuritySeverity(scope), scope);
    assert.deepEqual(state, { kind: "ready", counts, total, source: DEMO_SEVERITY_SOURCE, lastSyncedAt: null }, String(id));
  }
});

test("every fixture total equals its four severity categories", () => {
  for (const fixture of [DEMO_ALL_CUSTOMER_SEVERITY, ...DEMO_CUSTOMER_SEVERITY.values()]) {
    assert.equal(fixture.total, sum(fixture.counts));
  }
});

test("All Customers figures are explicit values that equal the per-customer sums", () => {
  for (const level of SEVERITY_LEVELS) {
    const perCustomer = [...DEMO_CUSTOMER_SEVERITY.values()].reduce((total, f) => total + f.counts[level], 0);
    assert.equal(DEMO_ALL_CUSTOMER_SEVERITY.counts[level], perCustomer, level);
  }
});

test("demo responses carry a synthetic source and no sync timestamp", async () => {
  for (const { id } of EXPECTED) {
    const response = await getDemoSecuritySeverity(scopeOf(id));
    assert.equal(response.data.status, "ready");
    assert.equal(response.data.source, DEMO_SEVERITY_SOURCE);
    assert.equal(response.data.last_synced_at, null);
    assert.deepEqual(response.data.scope, scopeOf(id));
    assert.doesNotMatch(String(response.data.source), /guardz|datto/i);
  }
});

test("fixture objects are not shared with responses", () => {
  const response = buildDemoSecuritySeverity(ALL);
  assert.notEqual(response.data.counts, DEMO_ALL_CUSTOMER_SEVERITY.counts);
});

test("unknown or invalid customer IDs never fall back to other customers' figures", () => {
  for (const id of [0, 4, 99, -1, 1.5, Number.NaN]) {
    const scope = scopeOf(id);
    const response = buildDemoSecuritySeverity(scope);
    assert.equal(response.data.status, "error", String(id));
    assert.equal(response.data.counts, null);
    assert.equal(response.data.total, null);
    if (Number.isSafeInteger(id) && id > 0) {
      const state = normalizeSecuritySeverity(response, scope);
      assert.equal(state.kind, "error");
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
    const state = normalizeSecuritySeverity(buildDemoSecuritySeverity(sent), requested);
    assert.deepEqual(state, { kind: "error", message: "Issue data did not match the selected customer view." });
  }
});

test("existing validation still rejects tampered demo totals and counts", () => {
  const tamperedTotal = buildDemoSecuritySeverity(ALL);
  tamperedTotal.data.total = 81;
  assert.equal(normalizeSecuritySeverity(tamperedTotal, ALL).kind, "error");
  const tamperedCount = buildDemoSecuritySeverity(ALL);
  tamperedCount.data.counts = { critical: -1, high: 23, medium: 41, low: 12 };
  assert.equal(normalizeSecuritySeverity(tamperedCount, ALL).kind, "error");
});

test("live mode uses the unavailable service and never returns counts", async () => {
  assert.equal(securitySeveritySource("live"), getSecuritySeverity);
  assert.equal(securitySeveritySource("demo"), getDemoSecuritySeverity);
  for (const { id } of EXPECTED) {
    const scope = scopeOf(id);
    const state = normalizeSecuritySeverity(await securitySeveritySource("live")(scope), scope);
    assert.equal(state.kind, "unavailable");
    assert.equal("counts" in state, false);
  }
});

const readyFor = (id: number | null): SecuritySeverityState => normalizeSecuritySeverity(buildDemoSecuritySeverity(scopeOf(id)), scopeOf(id));

test("data tagged for another mode or customer is hidden immediately", () => {
  const demoAll: LoadedSecuritySeverity = { mode: "demo", customerId: null, state: readyFor(null) };
  const demoA: LoadedSecuritySeverity = { mode: "demo", customerId: 1, state: readyFor(1) };
  const loading = { kind: "loading" };
  assert.deepEqual(visibleSecuritySeverity(demoAll, "live", null), loading);
  assert.deepEqual(visibleSecuritySeverity(demoA, "live", 1), loading);
  assert.deepEqual(visibleSecuritySeverity(demoA, "demo", 2), loading);
  assert.deepEqual(visibleSecuritySeverity(demoA, "demo", null), loading);
  assert.deepEqual(visibleSecuritySeverity(demoAll, "demo", 1), loading);
  assert.equal(visibleSecuritySeverity(demoA, "demo", 1), demoA.state);
  assert.equal(visibleSecuritySeverity(demoAll, "demo", null), demoAll.state);
});

test("out-of-order responses: a late response for an earlier request is never displayed", async () => {
  // Requests: Demo All, Demo A, Demo B, Live B — replies arrive in reverse order.
  const requests = [
    { mode: "demo", customerId: null },
    { mode: "demo", customerId: 1 },
    { mode: "demo", customerId: 2 },
    { mode: "live", customerId: 2 },
  ] as const;
  const current = requests[requests.length - 1];
  for (const request of [...requests].reverse()) {
    const scope = scopeOf(request.customerId);
    const state = normalizeSecuritySeverity(await securitySeveritySource(request.mode)(scope), scope);
    const visible = visibleSecuritySeverity({ ...request, state }, current.mode, current.customerId);
    if (request === current) assert.equal(visible.kind, "unavailable");
    else assert.deepEqual(visible, { kind: "loading" });
  }
});
