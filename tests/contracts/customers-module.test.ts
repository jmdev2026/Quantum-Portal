import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { findActiveNavItem, isNavItemActive, navSections } from "@/components/sidebar/navigation";
import {
  CUSTOMER_SCOPE_NOTICE,
  CUSTOMERS_DEMO_PAGE_NOTICE,
  CUSTOMERS_DESCRIPTION,
  CUSTOMERS_LIVE_NOTICE,
  customersAnnouncement,
  customersPageView,
} from "@/components/customers/customers-view";
import { customerViewReducer, initialCustomerViewState } from "@/components/customer-view/customer-view-state";
import { customerOverviewSource, overviewMode, visibleOverview } from "@/components/dashboard/customer-overview-view";
import { customersResponse } from "@/mocks/customers";
import { normalizeCustomerOverview, type CustomerOverviewState } from "@/services/customer-overview";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const items = navSections.flatMap((section) => section.items);
const byId = (id: string) => items.find((item) => item.id === id)!;
const UI = [
  "src/app/customers/page.tsx",
  "src/components/customers/customers-intro.tsx",
  "src/components/customers/customers-portfolio.tsx",
];
const ui = UI.map(read).join("\n");
const portfolioSource = read("src/components/customers/customers-portfolio.tsx");
const customers = customersResponse.data;

const scopeFor = (customerId: number | null): DashboardScope =>
  customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };

async function load(mode: "live" | "demo", customerId: number | null): Promise<CustomerOverviewState> {
  const scope = scopeFor(customerId);
  return normalizeCustomerOverview(await customerOverviewSource(mode)(scope), scope);
}

test("/customers route exists with metadata, heading and description", () => {
  assert.ok(existsSync(new URL("../../src/app/customers/page.tsx", import.meta.url)));
  assert.match(read("src/app/customers/page.tsx"), /Customers · Quantum Shield Command/);
  assert.match(read("src/components/customers/customers-intro.tsx"), /<h1[^>]*>\s*Customers\s*<\/h1>/);
  assert.equal(
    CUSTOMERS_DESCRIPTION,
    "Customer portfolio visibility, reporting availability and access to customer-specific security and backup information.",
  );
  assert.equal((ui.match(/<h1/g) ?? []).length, 1);
});

test("Customers sidebar item is enabled and only it left the planned group", () => {
  assert.equal(byId("customers").href, "/customers");
  assert.equal(byId("customers").label, "Customers");
  assert.deepEqual(items.filter((i) => !i.href).map((i) => i.id), []);
  const nav = read("src/components/sidebar/sidebar-nav.tsx");
  assert.ok(nav.indexOf("Soon") > nav.indexOf("function PlannedItem"), "Soon only renders for planned items");
});

test("exactly one navigation item is active per route, including /customers", () => {
  for (const [path, id] of [["/", "dashboard"], ["/security", "security"], ["/backup", "backup"], ["/customers", "customers"]]) {
    assert.deepEqual(items.filter((item) => isNavItemActive(item, path)).map((item) => item.id), [id], path);
  }
  assert.equal(findActiveNavItem("/customersx"), undefined);
});

test("Customers reuses the Dashboard Customer Overview data path and the shared providers", () => {
  assert.match(portfolioSource, /useCustomerOverview\(\)/);
  assert.match(portfolioSource, /useCustomerView\(\)/);
  assert.match(portfolioSource, /ReportingBadge/);
  assert.doesNotMatch(ui, /createContext|useReducer|useState|fetch\(|axios/);
  assert.doesNotMatch(ui, /Demo Customer [ABC]/, "no hardcoded customer names");
  assert.deepEqual(readdirSync(new URL("../../src/components/customers", import.meta.url)).sort(), [
    "customers-intro.tsx",
    "customers-portfolio.tsx",
    "customers-view.ts",
  ]);
  for (const dir of ["src/mocks", "src/demo"]) {
    const files = readdirSync(new URL(`../../${dir}`, import.meta.url));
    assert.ok(!files.some((f) => /^customers?-(portfolio|page|detail)/.test(f)), `no duplicate fixture in ${dir}`);
  }
});

test("Demo All Customers shows the three canonical customers with neutral reporting availability", async () => {
  const view = customersPageView(await load("demo", null), "all");
  assert.equal(view.kind, "portfolio");
  if (view.kind !== "portfolio") return;
  assert.deepEqual(view.customers.map((c) => [c.id, c.name]), customers.map((c) => [c.id, c.name]));
  assert.deepEqual(view.customers.map((c) => c.id), [1, 2, 3]);
  assert.deepEqual(view.customers.map((c) => c.name), ["Demo Customer A", "Demo Customer B", "Demo Customer C"]);
  for (const c of view.customers) assert.deepEqual([c.securityReporting, c.backupReporting], ["available", "available"]);
  const badges = read("src/components/dashboard/customer-portfolio-list.tsx");
  assert.match(badges, /simulated && status === "available" \? demoAvailableDisplay/);
  assert.match(badges, /label: "Demo data present"/);
});

test("each single-customer scope shows only that customer's detail", async () => {
  for (const customer of customers) {
    const view = customersPageView(await load("demo", customer.id), overviewMode(customer.id));
    assert.equal(view.kind, "detail", customer.name);
    if (view.kind !== "detail") continue;
    assert.equal(view.customer.id, customer.id);
    assert.equal(view.customer.name, customer.name);
    assert.equal(customersAnnouncement(view, "demo"), `Demonstration customer details loaded for ${customer.name}.`);
  }
});

test("reporting availability is never presented as security or backup health", () => {
  const copy = [CUSTOMERS_DEMO_PAGE_NOTICE, CUSTOMERS_LIVE_NOTICE, CUSTOMER_SCOPE_NOTICE].join(" ");
  assert.match(CUSTOMERS_DEMO_PAGE_NOTICE, /does not mean the customer is protected, monitored or backed up/);
  assert.match(portfolioSource, /does not indicate whether this customer is\s+secure, monitored or backed up/);
  assert.doesNotMatch(ui + copy, /\b(Protected|Healthy|Connected|Secure)\b(?! or)/);
  assert.doesNotMatch(ui, /health score|security score|last synced|last_synced|lastSyncedAt/i);
});

test("View customer and Back to all customers drive the shared selection reducer", () => {
  assert.match(portfolioSource, /selectCustomer\(id\)/);
  assert.match(portfolioSource, /onBack=\{keepFocus\(selectAll\)\}/);
  const list = customers.map((c) => ({ ...c }));
  const selected = customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 2, customers: list });
  assert.deepEqual(selected.view, { mode: "customer", customerId: 2 });
  assert.deepEqual(customerViewReducer(selected, { type: "select_all" }).view, { mode: "all" });
});

test("Security and Backup links are plain internal routes that keep the shared scope", () => {
  assert.match(portfolioSource, /href="\/security"\s+action="View Security"/);
  assert.match(portfolioSource, /href="\/backup"\s+action="View Backup & Recovery"/);
  assert.doesNotMatch(portfolioSource, /href=\{?["`'][^"`']*\?|customer_id=|https?:\/\//, "no query params or external links");
  const layout = read("src/app/layout.tsx");
  assert.ok(layout.indexOf("<DashboardModeProvider>") < layout.indexOf("<CustomerViewProvider>"), "mode wraps customer view");
  assert.ok(layout.indexOf("<CustomerViewProvider>") < layout.indexOf("<AppHeader />"), "header shares both providers");
  assert.ok(layout.indexOf("<AppHeader />") < layout.indexOf("{children}"));
});

test("Live mode shows no customer records or counts", async () => {
  for (const id of [null, 1, 2, 3]) {
    const view = customersPageView(await load("live", id), overviewMode(id));
    assert.equal(view.kind, "unavailable");
  }
  assert.doesNotMatch(CUSTOMERS_LIVE_NOTICE, /\d/);
  assert.match(CUSTOMERS_LIVE_NOTICE, /not connected/);
});

test("Demo → Live and stale or out-of-order responses are hidden immediately", async () => {
  const demoAll = { mode: "demo" as const, customerId: null, state: await load("demo", null) };
  assert.equal(visibleOverview(demoAll, "live", null).kind, "loading");
  const demoA = { mode: "demo" as const, customerId: 1, state: await load("demo", 1) };
  for (const [mode, id] of [["demo", 2], ["demo", 3], ["demo", null], ["live", 1]] as const) {
    assert.equal(customersPageView(visibleOverview(demoA, mode, id), overviewMode(id)).kind, "loading", `${mode}/${id}`);
  }
  const wrongScope = normalizeCustomerOverview(await customerOverviewSource("demo")(scopeFor(1)), scopeFor(2));
  assert.equal(wrongScope.kind, "error");
});

test("unknown customer IDs fail safely without falling back to other customers", async () => {
  const view = customersPageView(await load("demo", 999), "customer");
  assert.equal(view.kind, "error");
  const notice = customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 999, customers: [...customers] });
  assert.deepEqual(notice.view, { mode: "customer", customerId: -1 });
  assert.ok(notice.notice, "invalid selection is announced, not silent");
});

test("loading and error states map directly; errors are never shown as empty", () => {
  assert.equal(customersPageView({ kind: "loading" }, "all").kind, "loading");
  assert.equal(customersAnnouncement({ kind: "loading" }, "live"), "Loading customers", "loading never names a customer");
  assert.deepEqual(customersPageView({ kind: "error", message: "x" }, "all"), { kind: "error", message: "x" });
  assert.equal(customersPageView({ kind: "empty", source: null, lastSyncedAt: null }, "all").kind, "empty");
  assert.match(portfolioSource, /title="Could not load customers" role="alert"/);
  assert.match(portfolioSource, /Retry/);
  assert.match(portfolioSource, /aria-busy=\{view\.kind === "loading"\}/);
});

test("no customer-management actions or unsupported fields exist", () => {
  assert.doesNotMatch(ui, /\b(Edit|Delete|Invite|Remove|Export|Billing|Invoice|Ticket|Contract|Subscription|MRR|SLA|License|Licence|Address|Contact|Account manager)\b/);
  assert.equal((portfolioSource.match(/<button/g) ?? []).length, 3, "Retry, View customer and Back to all customers only");
});
