import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getDemoCustomerOverview, normalizeCustomerOverview } from "@/services/customer-overview";
import { getDemoAssetSummary, normalizeAssetSummary } from "@/services/dashboard-assets";
import { getDemoVisibilityRecords, normalizeDemoVisibilityRecords } from "@/services/security-visibility-records";
import { visibleOverview } from "@/components/dashboard/customer-overview-view";
import { customersAnnouncement, customersPageView } from "@/components/customers/customers-view";
import { customerViewReducer, initialCustomerViewState } from "@/components/customer-view/customer-view-state";
import { customersResponse } from "@/mocks/customers";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const customers = customersResponse.data;
const ALL: DashboardScope = { type: "all" };
const scopeOf = (id: number): DashboardScope => ({ type: "customer", customer_id: id });

test("Live Mode presents the all-customers view without discarding the stored demo selection", () => {
  const provider = read("src/components/customer-view/customer-view-provider.tsx");
  assert.match(provider, /const LIVE_VIEW: CustomerView = \{ mode: "all" \};/);
  assert.match(provider, /view: mode === "demo" \? state\.view : LIVE_VIEW/);
  assert.doesNotMatch(provider, /dispatch\(\{ type: "select_all" \}\)[\s\S]*mode === "live"/);
  const stored = customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 2, customers });
  assert.deepEqual(stored.view, { mode: "customer", customerId: 2 });
});

test("Customers portfolio comes from Customer Overview with the three canonical demo customers", async () => {
  const state = normalizeCustomerOverview(await getDemoCustomerOverview(ALL), ALL);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") return;
  assert.deepEqual(
    state.customers.map((c) => [c.id, c.name]),
    [[1, "Demo Customer A"], [2, "Demo Customer B"], [3, "Demo Customer C"]],
  );
  const portfolio = read("src/components/customers/customers-portfolio.tsx");
  assert.match(portfolio, /useCustomerOverview\(\)/);
  assert.doesNotMatch(portfolio, /\b(billing|subscriptions?|invoices?|contracts?|phone|email)\b/i);
});

test("each customer detail shows only that customer", async () => {
  for (const id of [1, 2, 3]) {
    const state = normalizeCustomerOverview(await getDemoCustomerOverview(scopeOf(id)), scopeOf(id));
    const view = customersPageView(state, "customer");
    assert.equal(view.kind, "detail");
    if (view.kind !== "detail") continue;
    assert.equal(view.customer.id, id);
  }
});

test("unknown customer ids and wrong-scope portfolio responses fail safely", async () => {
  const state = customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 99, customers });
  assert.deepEqual(state.view, { mode: "customer", customerId: -1 });
  assert.equal(normalizeCustomerOverview(await getDemoCustomerOverview(scopeOf(-1)), scopeOf(-1)).kind, "error");
  assert.deepEqual(customerViewReducer(state, { type: "select_all" }).view, { mode: "all" });
  const selected = customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 2, customers });
  assert.deepEqual(customerViewReducer(selected, { type: "reconcile", customers: [] }).view, { mode: "customer", customerId: -1 });
  const wrong = normalizeCustomerOverview(await getDemoCustomerOverview(scopeOf(1)), scopeOf(2));
  assert.equal(wrong.kind, "error");
  assert.deepEqual(visibleOverview({ mode: "demo", customerId: 2, state: wrong }, "live", null), { kind: "loading" });
});

test("Live customers announcement never names a customer", () => {
  for (const kind of ["loading", "unavailable", "empty"] as const) {
    assert.doesNotMatch(customersAnnouncement({ kind }, "live"), /Demo Customer/);
  }
});

test("summary counts are independent of the small sample record lists", async () => {
  for (const [id, users, devices] of [[1, 62, 35], [2, 48, 27], [3, 36, 21]] as const) {
    const scope = scopeOf(id);
    const summary = normalizeAssetSummary(await getDemoAssetSummary(scope), scope);
    assert.ok(summary.ok);
    if (!summary.ok) continue;
    const metric = (key: "users" | "devices") => summary.metrics[key];
    const u = metric("users");
    const d = metric("devices");
    assert.ok(u.kind === "ready" && u.value === users);
    assert.ok(d.kind === "ready" && d.value === devices);
    for (const kind of ["identities", "endpoints"] as const) {
      const records = normalizeDemoVisibilityRecords(await getDemoVisibilityRecords(kind, scope), kind, scope, customers);
      assert.ok(records.kind === "ready" && records.records.length === 2);
      if (records.kind === "ready") assert.ok(records.records.every((r) => r.customerId === id));
    }
  }
});

test("Phase 4 pages expose navigation and Retry only", () => {
  const sources = [
    "src/components/customers/customers-portfolio.tsx",
    "src/components/users-devices/users-devices-sections.tsx",
    "src/components/users-devices/users-devices-intro.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(
    sources,
    /reset password|enforce mfa|isolate|quarantine|remote command|deploy agent|invite user|delete device|restore now|manage license/i,
  );
});
