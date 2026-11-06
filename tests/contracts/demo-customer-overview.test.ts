import test from "node:test";
import assert from "node:assert/strict";
import { customersResponse } from "@/mocks/customers";
import {
  buildDemoCustomerOverview,
  DEMO_ALL_CUSTOMER_IDS,
  DEMO_CUSTOMER_REPORTING,
  DEMO_OVERVIEW_SOURCE,
} from "@/demo/customer-overview";
import { buildDemoBackupHealth, DEMO_CUSTOMER_BACKUP_HEALTH } from "@/demo/backup-health";
import { buildDemoInsights, DEMO_CUSTOMER_INSIGHTS } from "@/demo/insights";
import { buildDemoSecurityCoverage, DEMO_CUSTOMER_COVERAGE } from "@/demo/security-coverage";
import { buildDemoSecuritySeverity, DEMO_CUSTOMER_SEVERITY } from "@/demo/security-severity";
import {
  getCustomerOverview,
  getDemoCustomerOverview,
  MAX_DISPLAYED_CUSTOMERS,
  normalizeCustomerOverview,
  type CustomerOverviewState,
} from "@/services/customer-overview";
import {
  customerOverviewSource,
  overviewMode,
  portfolioLayout,
  visibleOverview,
  type LoadedOverview,
} from "@/components/dashboard/customer-overview-view";
import type { DashboardScope } from "@/services/dashboard-response";

const ALL = { type: "all" } as const;
const scopeOf = (id: number | null): DashboardScope => (id === null ? ALL : { type: "customer", customer_id: id });
const CANONICAL = customersResponse.data.map(({ id, name }) => ({ id, name }));
const record = (id: number, name: string) => ({
  id,
  name,
  securityReporting: "available",
  backupReporting: "available",
  lastSyncedAt: null,
});

test("portfolio fixtures cover exactly the canonical demo customers", () => {
  const ids = CANONICAL.map((customer) => customer.id).sort();
  assert.deepEqual([...DEMO_CUSTOMER_REPORTING.keys()].sort(), ids);
  assert.deepEqual([...DEMO_ALL_CUSTOMER_IDS].sort(), ids);
});

test("All Customers returns exactly three records with canonical IDs and names", () => {
  const state = normalizeCustomerOverview(buildDemoCustomerOverview(ALL), ALL);
  assert.deepEqual(state, {
    kind: "ready",
    customers: CANONICAL.map(({ id, name }) => record(id, name)),
    hiddenCount: 0,
    source: DEMO_OVERVIEW_SOURCE,
    lastSyncedAt: null,
  });
  assert.equal(portfolioLayout(overviewMode(null)), "list");
});

test("each single customer returns only its own record", () => {
  for (const { id, name } of CANONICAL) {
    const scope = scopeOf(id);
    const state = normalizeCustomerOverview(buildDemoCustomerOverview(scope), scope);
    assert.deepEqual(
      state,
      { kind: "ready", customers: [record(id, name)], hiddenCount: 0, source: DEMO_OVERVIEW_SOURCE, lastSyncedAt: null },
      String(id),
    );
    assert.equal(portfolioLayout(overviewMode(id)), "detail");
  }
});

test("names match the customer selector list for every demo customer", () => {
  const response = buildDemoCustomerOverview(ALL);
  for (const customer of response.data.customers ?? []) {
    assert.equal(customer.name, CANONICAL.find((entry) => entry.id === customer.id)?.name, String(customer.id));
  }
  assert.deepEqual(CANONICAL.map((c) => c.name), ["Demo Customer A", "Demo Customer B", "Demo Customer C"]);
});

test("available means the security and backup demo fixtures exist for that customer", () => {
  for (const [id, reporting] of DEMO_CUSTOMER_REPORTING) {
    const scope = scopeOf(id);
    const securityFixtures = DEMO_CUSTOMER_SEVERITY.has(id) && DEMO_CUSTOMER_COVERAGE.has(id) && DEMO_CUSTOMER_INSIGHTS.has(id);
    assert.equal(reporting.security === "available", securityFixtures, `security ${id}`);
    assert.equal(reporting.backup === "available", DEMO_CUSTOMER_BACKUP_HEALTH.has(id), `backup ${id}`);
    for (const response of [buildDemoSecuritySeverity(scope), buildDemoSecurityCoverage(scope), buildDemoInsights(scope), buildDemoBackupHealth(scope)]) {
      assert.equal(response.data.status, "ready", `${id}`);
    }
  }
});

test("demo responses carry a synthetic source and no sync timestamps or scores", async () => {
  for (const id of [null, ...DEMO_ALL_CUSTOMER_IDS]) {
    const response = await getDemoCustomerOverview(scopeOf(id));
    assert.equal(response.data.source, DEMO_OVERVIEW_SOURCE);
    assert.equal(response.data.last_synced_at, null);
    assert.deepEqual(response.data.scope, scopeOf(id));
    for (const customer of response.data.customers ?? []) {
      assert.equal(customer.last_synced_at, null);
      assert.deepEqual(Object.keys(customer).sort(), ["backup_reporting", "id", "last_synced_at", "name", "security_reporting"]);
    }
    assert.doesNotMatch(JSON.stringify(response), /score|risk|rate|percent|guardz|datto|\d{4}-\d{2}-\d{2}T/i);
  }
});

test("unknown or invalid customer IDs never fall back to another customer's record", () => {
  for (const id of [0, 4, 99, -1, 1.5, Number.NaN]) {
    const scope = scopeOf(id);
    const response = buildDemoCustomerOverview(scope);
    assert.equal(response.data.status, "error", String(id));
    assert.equal(response.data.customers, null);
    if (Number.isSafeInteger(id) && id > 0) {
      assert.deepEqual(normalizeCustomerOverview(response, scope), {
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
    const state = normalizeCustomerOverview(buildDemoCustomerOverview(sent), requested);
    assert.deepEqual(state, { kind: "error", message: "Customer overview did not match the selected customer view." });
  }
});

test("a single-customer scope carrying another customer's record is rejected", () => {
  const response = buildDemoCustomerOverview(scopeOf(1));
  response.data.customers = buildDemoCustomerOverview(scopeOf(2)).data.customers;
  assert.equal(normalizeCustomerOverview(response, scopeOf(1)).kind, "error");
});

test("existing validation still rejects tampered demo records", () => {
  const tamper = (mutate: (customers: Record<string, unknown>[]) => void) => {
    const response = buildDemoCustomerOverview(ALL);
    mutate(response.data.customers as unknown as Record<string, unknown>[]);
    return normalizeCustomerOverview(response, ALL).kind;
  };
  assert.equal(tamper((c) => (c[1].id = c[0].id)), "error");
  assert.equal(tamper((c) => (c[0].id = 0)), "error");
  assert.equal(tamper((c) => (c[0].id = 1.5)), "error");
  assert.equal(tamper((c) => (c[0].name = "   ")), "error");
  assert.equal(tamper((c) => (c[0].security_reporting = "connected")), "error");
  assert.equal(tamper((c) => (c[0].backup_reporting = "protected")), "error");
  assert.equal(tamper((c) => (c[0].last_synced_at = "2999-01-01T00:00:00Z")), "error");
  assert.equal(tamper((c) => (c[0].last_synced_at = "yesterday")), "error");
  assert.equal(tamper((c) => (c[0].risk_score = 80)), "error");
  assert.equal(MAX_DISPLAYED_CUSTOMERS, 100);
});

test("names are rendered as plain text, never markup", () => {
  const response = buildDemoCustomerOverview(scopeOf(1));
  response.data.customers![0].name = "<img src=x onerror=alert(1)>\u0007Demo";
  const state = normalizeCustomerOverview(response, scopeOf(1));
  assert.equal(state.kind === "ready" && state.customers[0].name, "<img src=x onerror=alert(1)> Demo");
});

test("live mode uses the unavailable service and never returns records", async () => {
  assert.equal(customerOverviewSource("live"), getCustomerOverview);
  assert.equal(customerOverviewSource("demo"), getDemoCustomerOverview);
  for (const id of [null, ...DEMO_ALL_CUSTOMER_IDS]) {
    const scope = scopeOf(id);
    const state = normalizeCustomerOverview(await customerOverviewSource("live")(scope), scope);
    assert.deepEqual(state, { kind: "unavailable", source: null, lastSyncedAt: null });
  }
});

const readyFor = (id: number | null): CustomerOverviewState =>
  normalizeCustomerOverview(buildDemoCustomerOverview(scopeOf(id)), scopeOf(id));

test("records tagged for another mode or customer are hidden immediately", () => {
  const demoAll: LoadedOverview = { mode: "demo", customerId: null, state: readyFor(null) };
  const demoA: LoadedOverview = { mode: "demo", customerId: 1, state: readyFor(1) };
  const loading = { kind: "loading" };
  assert.deepEqual(visibleOverview(demoAll, "live", null), loading);
  assert.deepEqual(visibleOverview(demoA, "live", 1), loading);
  assert.deepEqual(visibleOverview(demoA, "demo", 2), loading);
  assert.deepEqual(visibleOverview(demoA, "demo", null), loading);
  assert.deepEqual(visibleOverview(demoAll, "demo", 1), loading);
  assert.equal(visibleOverview(demoA, "demo", 1), demoA.state);
  assert.equal(visibleOverview(demoAll, "demo", null), demoAll.state);
});

test("out-of-order responses: a late response for an earlier request is never displayed", async () => {
  const requests = [
    { mode: "demo", customerId: null },
    { mode: "demo", customerId: 1 },
    { mode: "demo", customerId: 3 },
    { mode: "live", customerId: null },
    { mode: "demo", customerId: 2 },
  ] as const;
  const current = requests[requests.length - 1];
  for (const request of [...requests].reverse()) {
    const scope = scopeOf(request.customerId);
    const state = normalizeCustomerOverview(await customerOverviewSource(request.mode)(scope), scope);
    const visible = visibleOverview({ ...request, state }, current.mode, current.customerId);
    if (request === current) assert.deepEqual(visible, readyFor(2));
    else assert.deepEqual(visible, { kind: "loading" });
  }
});
