import test from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_TEXT_LIMITS,
  getCustomerOverview,
  MAX_DISPLAYED_CUSTOMERS,
  normalizeCustomerOverview as n,
  REPORTING_STATUSES,
} from "@/services/customer-overview";
import { customersResponse } from "@/mocks/customers";

const ALL = { type: "all" } as const;
const A = { type: "customer", customer_id: 101 } as const;
const B = { type: "customer", customer_id: 202 } as const;
const sync = { source: "test-source", last_synced_at: "2026-10-27T08:00:00Z" };
const rec = (overrides: Record<string, unknown> = {}) => ({
  id: 101,
  name: "Fixture Alpha Holdings",
  security_reporting: "available",
  backup_reporting: "stale",
  last_synced_at: "2026-10-27T07:30:00Z",
  ...overrides,
});
const res = (scope: unknown, data: Record<string, unknown>) => ({ data: { scope, ...sync, ...data } });
const all = (customers: unknown, status = "ready") => n(res(ALL, { status, customers }), ALL);
const isError = (state: { kind: string }) => state.kind === "error";

test("ready returns normalized records and sync info", () => {
  assert.deepEqual(all([rec()]), {
    kind: "ready",
    customers: [
      {
        id: 101,
        name: "Fixture Alpha Holdings",
        securityReporting: "available",
        backupReporting: "stale",
        lastSyncedAt: "2026-10-27T07:30:00Z",
      },
    ],
    hiddenCount: 0,
    source: "test-source",
    lastSyncedAt: "2026-10-27T08:00:00Z",
  });
});

test("every reporting status is accepted for security and backup", () => {
  const customers = REPORTING_STATUSES.flatMap((security, s) =>
    REPORTING_STATUSES.map((backup, b) => rec({ id: 1 + s * 10 + b, security_reporting: security, backup_reporting: backup })),
  );
  const state = all(customers);
  assert.equal(state.kind, "ready");
  assert.equal(state.kind === "ready" && state.customers.length, 16);
});

test("backend order is preserved and nothing is aggregated or scored", () => {
  const state = all([rec({ id: 3, name: "Zeta" }), rec({ id: 1, name: "Alpha" }), rec({ id: 2, name: "Mid" })]);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") return;
  assert.deepEqual(state.customers.map((c) => c.id), [3, 1, 2]);
  assert.deepEqual(Object.keys(state.customers[0]).sort(), ["backupReporting", "id", "lastSyncedAt", "name", "securityReporting"]);
});

test("stale keeps records and is reported as stale", () => {
  assert.equal(all([rec()], "stale").kind, "stale");
});

test("missing or malformed customer ids reject the whole response", () => {
  for (const id of [undefined, null, 0, -1, 1.5, "101", "", Number.MAX_SAFE_INTEGER + 1, NaN, {}]) {
    const record = rec({ id });
    if (id === undefined) delete (record as Record<string, unknown>).id;
    assert.ok(isError(all([rec({ id: 5 }), record])), `id ${String(id)} should be rejected`);
  }
});

test("duplicate customer ids reject the whole response", () => {
  const state = all([rec({ id: 7, name: "One" }), rec({ id: 7, name: "Two" })]);
  assert.deepEqual(state, { kind: "error", message: "Received missing, invalid or duplicate customer records." });
});

test("blank or malformed customer names are rejected", () => {
  for (const name of [undefined, null, "", "   ", "\n\t", 42, ["a"], { text: "a" }]) {
    assert.ok(isError(all([rec({ name })])), `name ${JSON.stringify(name)} should be rejected`);
  }
});

test("names are whitespace-collapsed, stripped of control characters and length-limited", () => {
  const long = "N".repeat(CUSTOMER_TEXT_LIMITS.name + 50);
  const state = all([rec({ id: 1, name: "  Acme \n\u0007 Corp  " }), rec({ id: 2, name: long })]);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") return;
  assert.equal(state.customers[0].name, "Acme Corp");
  assert.equal(state.customers[1].name.length, CUSTOMER_TEXT_LIMITS.name);
  assert.ok(state.customers[1].name.endsWith("…"));
});

test("markup in names is kept as plain text, not interpreted", () => {
  const state = all([rec({ name: "<img src=x onerror=alert(1)>" })]);
  assert.equal(state.kind === "ready" && state.customers[0].name, "<img src=x onerror=alert(1)>");
});

test("unsupported reporting statuses are rejected", () => {
  for (const value of ["healthy", "secure", "ok", "AVAILABLE", "", null, undefined, 1, true]) {
    assert.ok(isError(all([rec({ security_reporting: value })])), `security ${String(value)}`);
    assert.ok(isError(all([rec({ backup_reporting: value })])), `backup ${String(value)}`);
  }
});

test("unknown record fields, including provider ids, are rejected", () => {
  for (const extra of [{ guardz_id: "g-1" }, { datto_id: 99 }, { risk_score: 12 }, { is_secure: true }]) {
    assert.ok(isError(all([rec(extra)])), JSON.stringify(extra));
  }
});

test("missing record sync time becomes null, malformed sync time is rejected", () => {
  for (const value of [undefined, null]) {
    const record = rec({ last_synced_at: value });
    if (value === undefined) delete (record as Record<string, unknown>).last_synced_at;
    const state = all([record]);
    assert.equal(state.kind === "ready" && state.customers[0].lastSyncedAt, null);
  }
  for (const value of ["", "yesterday", "1", "2026-13-45T99:00:00Z", 1730000000, {}]) {
    assert.ok(isError(all([rec({ last_synced_at: value })])), `last_synced_at ${String(value)}`);
  }
});

test("missing or loose response sync time is reported as not provided", () => {
  for (const last_synced_at of [undefined, null, "", "1", "not a date"]) {
    const state = n({ data: { scope: ALL, status: "ready", customers: [rec()], source: null, last_synced_at } }, ALL);
    assert.equal(state.kind === "ready" && state.lastSyncedAt, null, String(last_synced_at));
  }
});

test("ready or stale without usable records is an error, never an empty-looking success", () => {
  for (const customers of [undefined, null, [], {}, "x", [null], [[]]]) {
    assert.ok(isError(all(customers)), JSON.stringify(customers));
    assert.ok(isError(all(customers, "stale")), JSON.stringify(customers));
  }
});

test("wrong or malformed scope is rejected", () => {
  const body = { status: "ready", customers: [rec()] };
  const wrong = { kind: "error", message: "Customer overview did not match the selected customer view." };
  assert.deepEqual(n(res(A, body), ALL), wrong);
  assert.deepEqual(n(res(ALL, body), A), wrong);
  assert.deepEqual(n(res(B, body), A), wrong);
  for (const scope of [undefined, null, {}, { type: "customer" }, { type: "customer", customer_id: "101" }, { type: "org" }]) {
    assert.deepEqual(n(res(scope, body), ALL), wrong, JSON.stringify(scope));
  }
});

test("single customer view only accepts exactly the selected customer's record", () => {
  const ok = n(res(A, { status: "ready", customers: [rec({ id: 101 })] }), A);
  assert.equal(ok.kind === "ready" && ok.customers[0].id, 101);
  assert.ok(isError(n(res(A, { status: "ready", customers: [rec({ id: 202 })] }), A)));
  assert.ok(isError(n(res(A, { status: "ready", customers: [rec({ id: 101 }), rec({ id: 202 })] }), A)));
  assert.ok(isError(n(res(A, { status: "stale", customers: [rec({ id: 202 })] }), A)));
});

test("isolated fixtures stay with their own scope", () => {
  const forA = res(A, { status: "ready", customers: [rec({ id: 101, name: "Fixture Alpha" })] });
  const forB = res(B, { status: "ready", customers: [rec({ id: 202, name: "Fixture Bravo" })] });
  const a = n(forA, A);
  const b = n(forB, B);
  assert.equal(a.kind === "ready" && a.customers[0].name, "Fixture Alpha");
  assert.equal(b.kind === "ready" && b.customers[0].name, "Fixture Bravo");
  assert.ok(isError(n(forA, B)));
  assert.ok(isError(n(forB, A)));
});

test("large portfolios are capped for display with a hidden count", () => {
  const customers = Array.from({ length: MAX_DISPLAYED_CUSTOMERS + 7 }, (_, i) => rec({ id: i + 1, name: `C${i + 1}` }));
  const state = all(customers);
  assert.equal(state.kind === "ready" && state.customers.length, MAX_DISPLAYED_CUSTOMERS);
  assert.equal(state.kind === "ready" && state.hiddenCount, 7);
});

test("empty and unavailable carry sync info only and ignore any records", () => {
  for (const status of ["empty", "unavailable"] as const) {
    assert.deepEqual(n(res(ALL, { status, customers: [rec()] }), ALL), {
      kind: status,
      source: "test-source",
      lastSyncedAt: "2026-10-27T08:00:00Z",
    });
  }
});

test("provider error messages are bounded, with a fallback", () => {
  const long = n(res(ALL, { status: "error", customers: null, message: "x".repeat(500) }), ALL);
  assert.equal(long.kind === "error" && long.message.length, CUSTOMER_TEXT_LIMITS.message);
  assert.deepEqual(n(res(ALL, { status: "error", customers: null, message: "  " }), ALL), {
    kind: "error",
    message: "The customer overview reported an error.",
  });
});

test("invalid response structures and unknown statuses are rejected", () => {
  for (const response of [undefined, null, 1, "x", [], {}, { data: null }, { data: [] }, { data: "x" }]) {
    assert.ok(isError(n(response, ALL)), JSON.stringify(response));
  }
  for (const status of ["healthy", "loading", "", null, undefined]) {
    assert.deepEqual(n(res(ALL, { status, customers: [rec()] }), ALL), {
      kind: "error",
      message: "Received an unrecognized status.",
    });
  }
});

test("source is bounded and blank source becomes null", () => {
  const long = n({ data: { scope: ALL, status: "empty", customers: null, source: "s".repeat(200) } }, ALL);
  assert.equal(long.kind === "empty" && long.source?.length, CUSTOMER_TEXT_LIMITS.source);
  const blank = n({ data: { scope: ALL, status: "empty", customers: null, source: "  " } }, ALL);
  assert.equal(blank.kind === "empty" && blank.source, null);
});

test("mock service returns unavailable for the requested scope with no records", async () => {
  for (const scope of [ALL, A, B]) {
    const response = await getCustomerOverview(scope);
    assert.deepEqual(response.data.scope, scope);
    assert.equal(response.data.status, "unavailable");
    assert.equal(response.data.customers, null);
    assert.equal(response.data.source, null);
    assert.equal(response.data.last_synced_at, null);
    assert.equal(n(response, scope).kind, "unavailable");
  }
});

test("mock does not reuse the selector's demo customers as reporting records", async () => {
  const text = JSON.stringify(await getCustomerOverview(ALL));
  for (const customer of customersResponse.data) assert.ok(!text.includes(customer.name), customer.name);
});
