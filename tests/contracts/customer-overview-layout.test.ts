import test from "node:test";
import assert from "node:assert/strict";
import { overviewMode, portfolioLayout, visibleOverview } from "@/components/dashboard/customer-overview-view";
import { normalizeCustomerOverview as n } from "@/services/customer-overview";

const ALL = { type: "all" } as const;
const A = { type: "customer", customer_id: 101 } as const;
const rec = (id: number) => ({ id, name: `Fixture ${id}`, security_reporting: "available", backup_reporting: "unknown" });
const res = (scope: unknown, customers: unknown) => ({ data: { scope, status: "ready", customers, source: "qa" } });

test("view mode comes from the selected customer view", () => {
  assert.equal(overviewMode(null), "all");
  assert.equal(overviewMode(101), "customer");
});

test("All Customers always uses the list, whatever the record count", () => {
  for (const count of [1, 2, 10, 100]) {
    const state = n(res(ALL, Array.from({ length: count }, (_, i) => rec(i + 1))), ALL);
    assert.equal(state.kind === "ready" && state.customers.length, count);
    assert.equal(portfolioLayout(overviewMode(null)), "list", `count ${count}`);
  }
});

test("Single Customer always uses the detail layout with exactly one matching record", () => {
  const state = n(res(A, [rec(101)]), A);
  assert.equal(state.kind === "ready" && state.customers[0].id, 101);
  assert.equal(portfolioLayout(overviewMode(101)), "detail");
});

test("Single Customer with an incorrect record is an error, so no detail is shown", () => {
  for (const customers of [[rec(202)], [rec(101), rec(202)], []]) {
    assert.equal(n(res(A, customers), A).kind, "error", JSON.stringify(customers));
  }
});

test("data loaded for another view is never shown under the current view", () => {
  const allData = n(res(ALL, [rec(1)]), ALL);
  const aData = n(res(A, [rec(101)]), A);
  assert.deepEqual(visibleOverview({ mode: "live", customerId: null, state: allData }, "live", 101), { kind: "loading" });
  assert.deepEqual(visibleOverview({ mode: "live", customerId: 101, state: aData }, "live", null), { kind: "loading" });
  assert.deepEqual(visibleOverview({ mode: "live", customerId: 101, state: aData }, "live", 202), { kind: "loading" });
  assert.equal(visibleOverview({ mode: "live", customerId: 101, state: aData }, "live", 101), aData);
  assert.equal(visibleOverview({ mode: "live", customerId: null, state: allData }, "live", null), allData);
});
