import test from "node:test";
import assert from "node:assert/strict";
import { customersResponse } from "@/mocks/customers";
import {
  buildDemoSecurityCoverage,
  DEMO_ALL_CUSTOMER_COVERAGE,
  DEMO_COVERAGE_BASIS,
  DEMO_COVERAGE_SOURCE,
  DEMO_CUSTOMER_COVERAGE,
} from "@/demo/security-coverage";
import {
  CONTROL_STATUSES,
  formatCoveragePercentage,
  getDemoSecurityCoverage,
  getSecurityCoverage,
  normalizeSecurityCoverage,
  SECURITY_CONTROLS,
  type SecurityCoverageState,
} from "@/services/security-coverage";
import {
  securityCoverageSource,
  visibleSecurityCoverage,
  type LoadedSecurityCoverage,
} from "@/components/dashboard/security-coverage-view";
import type { DashboardScope } from "@/services/dashboard-response";

const ALL = { type: "all" } as const;
const scopeOf = (id: number | null): DashboardScope => (id === null ? ALL : { type: "customer", customer_id: id });
const EXPECTED = [
  { id: null, percentage: 73.5 },
  { id: 1, percentage: 88 },
  { id: 2, percentage: 61 },
  { id: 3, percentage: 70 },
];
const tally = (id: number) => {
  const controls = DEMO_CUSTOMER_COVERAGE.get(id)!.controls;
  return Object.fromEntries(CONTROL_STATUSES.map((s) => [s, Object.values(controls).filter((v) => v === s).length]));
};

test("coverage fixtures are keyed by the existing demo customer IDs", () => {
  const ids = customersResponse.data.map((customer) => customer.id).sort();
  assert.deepEqual([...DEMO_CUSTOMER_COVERAGE.keys()].sort(), ids);
});

test("each view returns the specified percentage with the fictional basis and synthetic source", () => {
  for (const { id, percentage } of EXPECTED) {
    const scope = scopeOf(id);
    const state = normalizeSecurityCoverage(buildDemoSecurityCoverage(scope), scope);
    assert.equal(state.kind, "ready", String(id));
    if (state.kind !== "ready") return;
    assert.deepEqual(state.coverage, { percentage, basis: DEMO_COVERAGE_BASIS });
    assert.equal(state.source, DEMO_COVERAGE_SOURCE);
    assert.equal(state.lastSyncedAt, null);
  }
});

test("existing percentage formatting is preserved for demo values", () => {
  assert.equal(formatCoveragePercentage(73.5), new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(73.5) + "%");
  assert.equal(formatCoveragePercentage(88), "88%");
  assert.equal(formatCoveragePercentage(61), "61%");
  assert.equal(formatCoveragePercentage(70), "70%");
});

test("every view reports all nine controls, each exactly once, with an existing status", () => {
  for (const { id } of EXPECTED) {
    const response = buildDemoSecurityCoverage(scopeOf(id));
    const controls = response.data.controls!;
    assert.equal(controls.length, 9);
    assert.deepEqual(controls.map((c) => c.key).sort(), SECURITY_CONTROLS.map((c) => c.key).sort());
    assert.ok(controls.every((c) => (CONTROL_STATUSES as readonly string[]).includes(c.status)));
    const state = normalizeSecurityCoverage(response, scopeOf(id));
    assert.equal(state.kind === "ready" && Object.keys(state.controls ?? {}).length, 9);
  }
});

test("customers differ: A mostly covered, B mostly needs attention, C a mix of all three", () => {
  const a = tally(1), b = tally(2), c = tally(3);
  assert.ok(a.covered > b.covered && a.covered > c.covered);
  assert.ok(b.needs_attention > a.needs_attention && b.needs_attention >= c.needs_attention);
  assert.ok(c.covered > 0 && c.needs_attention > 0 && c.unknown > 0);
  const serialized = [1, 2, 3].map((id) => JSON.stringify(DEMO_CUSTOMER_COVERAGE.get(id)!.controls));
  assert.equal(new Set(serialized).size, 3);
});

test("the basis states the figure is fictional and not derived from controls or a provider", () => {
  assert.match(DEMO_COVERAGE_BASIS, /fictional/i);
  assert.match(DEMO_COVERAGE_BASIS, /not derived from the control statuses/i);
  assert.match(DEMO_COVERAGE_BASIS, /not measured from any provider/i);
  assert.doesNotMatch(DEMO_COVERAGE_BASIS + DEMO_COVERAGE_SOURCE, /guardz|datto/i);
});

test("All Customers percentage is an explicit fixture value", () => {
  assert.equal(DEMO_ALL_CUSTOMER_COVERAGE.percentage, 73.5);
  assert.equal(buildDemoSecurityCoverage(ALL).data.coverage_percentage, 73.5);
});

test("demo service responds with no sync timestamp for every view", async () => {
  for (const { id } of EXPECTED) {
    const response = await getDemoSecurityCoverage(scopeOf(id));
    assert.deepEqual(response.data.scope, scopeOf(id));
    assert.equal(response.data.last_synced_at, null);
  }
});

test("unknown or invalid customer IDs never fall back to other customers' figures", () => {
  for (const id of [0, 4, 99, -1, 1.5, Number.NaN]) {
    const response = buildDemoSecurityCoverage(scopeOf(id));
    assert.equal(response.data.status, "error", String(id));
    assert.equal(response.data.coverage_percentage, null);
    assert.equal(response.data.controls, null);
    if (Number.isSafeInteger(id) && id > 0) assert.equal(normalizeSecurityCoverage(response, scopeOf(id)).kind, "error");
  }
});

test("a demo response for one view is rejected under another view", () => {
  const pairs: [DashboardScope, DashboardScope][] = [
    [scopeOf(1), scopeOf(2)],
    [scopeOf(2), scopeOf(3)],
    [ALL, scopeOf(1)],
    [scopeOf(3), ALL],
  ];
  for (const [sent, requested] of pairs) {
    assert.deepEqual(normalizeSecurityCoverage(buildDemoSecurityCoverage(sent), requested), {
      kind: "error",
      message: "Coverage data did not match the selected customer view.",
    });
  }
});

test("existing validation still rejects tampered demo data", () => {
  const mutate = (change: (r: ReturnType<typeof buildDemoSecurityCoverage>) => void) => {
    const response = buildDemoSecurityCoverage(scopeOf(1));
    change(response);
    return normalizeSecurityCoverage(response, scopeOf(1)).kind;
  };
  assert.equal(mutate((r) => (r.data.coverage_percentage = 100.5)), "error");
  assert.equal(mutate((r) => (r.data.coverage_percentage = -1)), "error");
  assert.equal(mutate((r) => (r.data.coverage_basis = null)), "error");
  assert.equal(mutate((r) => r.data.controls!.push({ key: "mdr", status: "covered" })), "error");
  assert.equal(mutate((r) => (r.data.controls![0] = { key: "firewall" as "mdr", status: "covered" })), "error");
  assert.equal(mutate((r) => (r.data.controls![0] = { key: "mdr", status: "protected" as "covered" })), "error");
});

test("live mode uses the unavailable service and never returns values", async () => {
  assert.equal(securityCoverageSource("live"), getSecurityCoverage);
  assert.equal(securityCoverageSource("demo"), getDemoSecurityCoverage);
  for (const { id } of EXPECTED) {
    const scope = scopeOf(id);
    const state = normalizeSecurityCoverage(await securityCoverageSource("live")(scope), scope);
    assert.equal(state.kind, "unavailable");
    assert.equal("coverage" in state || "controls" in state, false);
  }
});

const readyFor = (id: number | null): SecurityCoverageState => normalizeSecurityCoverage(buildDemoSecurityCoverage(scopeOf(id)), scopeOf(id));

test("data tagged for another mode or customer is hidden immediately", () => {
  const demoAll: LoadedSecurityCoverage = { mode: "demo", customerId: null, state: readyFor(null) };
  const demoA: LoadedSecurityCoverage = { mode: "demo", customerId: 1, state: readyFor(1) };
  const loading = { kind: "loading" };
  assert.deepEqual(visibleSecurityCoverage(demoAll, "live", null), loading);
  assert.deepEqual(visibleSecurityCoverage(demoA, "live", 1), loading);
  assert.deepEqual(visibleSecurityCoverage(demoA, "demo", 2), loading);
  assert.deepEqual(visibleSecurityCoverage(demoA, "demo", null), loading);
  assert.deepEqual(visibleSecurityCoverage(demoAll, "demo", 3), loading);
  assert.equal(visibleSecurityCoverage(demoA, "demo", 1), demoA.state);
  assert.equal(visibleSecurityCoverage(demoAll, "demo", null), demoAll.state);
});

test("out-of-order responses: a late response for an earlier request is never displayed", async () => {
  // Requests: Demo All, Demo A, Demo B, Demo C, Live C — replies arrive in reverse order.
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
    const state = normalizeSecurityCoverage(await securityCoverageSource(request.mode)(scope), scope);
    const visible = visibleSecurityCoverage({ ...request, state }, current.mode, current.customerId);
    if (request === current) assert.equal(visible.kind, "unavailable");
    else assert.deepEqual(visible, { kind: "loading" });
  }
});
