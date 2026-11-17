import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { findActiveNavItem, isNavItemActive, navSections } from "@/components/sidebar/navigation";
import { assetSummarySource, visibleAssetSummary, type AssetSummaryState } from "@/components/dashboard/asset-summary-view";
import { visibleVisibilityRecords } from "@/components/security/identities-endpoints-view";
import { securityScopeLabel } from "@/components/security/security-overview-view";
import { customerViewReducer, initialCustomerViewState } from "@/components/customer-view/customer-view-state";
import { LIVE_CUSTOMER_SCOPE_DETAIL, LIVE_CUSTOMER_SCOPE_LABEL } from "@/components/customer-selector/live-scope";
import {
  RECORD_SECTIONS,
  SUMMARY_DEFINITION,
  USERS_DEVICES_DESCRIPTION,
  USERS_DEVICES_LIVE_NOTICE,
  recordSectionView,
  summaryCardView,
  usersDevicesAnnouncement,
} from "@/components/users-devices/users-devices-view";
import { customersResponse } from "@/mocks/customers";
import { normalizeAssetSummary } from "@/services/dashboard-assets";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  getDemoVisibilityRecords,
  normalizeDemoVisibilityRecords,
  type VisibilityRecordKind,
  type VisibilityRecordsState,
} from "@/services/security-visibility-records";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const items = navSections.flatMap((section) => section.items);
const byId = (id: string) => items.find((item) => item.id === id)!;
const UI_FILES = [
  "src/app/users-devices/page.tsx",
  "src/components/users-devices/users-devices-intro.tsx",
  "src/components/users-devices/users-devices-sections.tsx",
];
const ui = UI_FILES.map(read).join("\n");
const viewSource = read("src/components/users-devices/users-devices-view.ts");
const customers = customersResponse.data;
const DEMO_NAMES = /Demo Customer [ABC]/;

const scopeFor = (id: number | null): DashboardScope => (id === null ? { type: "all" } : { type: "customer", customer_id: id });

async function summary(mode: "live" | "demo", id: number | null): Promise<AssetSummaryState> {
  const scope = scopeFor(id);
  const result = normalizeAssetSummary(await assetSummarySource(mode)(scope), scope);
  return result.ok ? { status: "ready", metrics: result.metrics } : { status: "error", message: result.message };
}

async function records(kind: VisibilityRecordKind, id: number | null): Promise<VisibilityRecordsState> {
  const scope = scopeFor(id);
  return normalizeDemoVisibilityRecords(await getDemoVisibilityRecords(kind, scope), kind, scope, customers);
}

test("/users-devices route exists with metadata, single h1 and description", () => {
  assert.ok(existsSync(new URL("../../src/app/users-devices/page.tsx", import.meta.url)));
  assert.match(read("src/app/users-devices/page.tsx"), /Users & Devices · Quantum Shield Command/);
  assert.match(ui, /<h1[^>]*>\s*Users &amp; Devices\s*<\/h1>/);
  assert.equal((ui.match(/<h1/g) ?? []).length, 1);
  assert.equal(
    USERS_DEVICES_DESCRIPTION,
    "Visibility into customer user and device summaries, account security observations and endpoint information.",
  );
  for (const title of ["Users & Devices Overview", "User Account Visibility", "Device & Endpoint Visibility"]) {
    assert.ok(ui.includes(`"${title}"`) || viewSource.includes(`"${title}"`), title);
  }
});

test("Users & Devices sidebar item is enabled; Reports, Compliance and Administration stay planned", () => {
  assert.equal(byId("users-devices").href, "/users-devices");
  assert.equal(byId("users-devices").label, "Users & Devices");
  assert.deepEqual(items.filter((i) => !i.href).map((i) => i.id), ["reports", "compliance", "administration"]);
});

test("exactly one navigation item is active per route, including /users-devices", () => {
  const routes = [["/", "dashboard"], ["/security", "security"], ["/backup", "backup"], ["/customers", "customers"], ["/users-devices", "users-devices"]];
  for (const [path, id] of routes) {
    assert.deepEqual(items.filter((item) => isNavItemActive(item, path)).map((item) => item.id), [id], path);
  }
  assert.equal(findActiveNavItem("/users-devicesx"), undefined);
});

test("Customer detail links to Users & Devices with no URL parameters or new customer state", () => {
  const portfolio = read("src/components/customers/customers-portfolio.tsx");
  assert.match(portfolio, /href="\/users-devices"\s+action="View Users & Devices"/);
  assert.doesNotMatch(portfolio, /href=\{?["`'][^"`']*\?|customer_id=/);
  assert.doesNotMatch(ui, /useSearchParams|useReducer|useState|createContext|localStorage|sessionStorage/);
  const selected = customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 2, customers });
  assert.deepEqual(selected.view, { mode: "customer", customerId: 2 });
});

test("summary reuses the existing Asset Summary hook and adds no new fixture", () => {
  assert.match(ui, /useAssetSummary\(\)/);
  assert.match(ui, /useVisibilityRecords\("identities"\)/);
  assert.match(ui, /useVisibilityRecords\("endpoints"\)/);
  assert.doesNotMatch(ui + viewSource, /@\/demo\/|@\/mocks\/|getDemoAssetSummary|buildDemo/);
  assert.ok(!existsSync(new URL("../../src/demo/users-devices.ts", import.meta.url)));
  assert.ok(!existsSync(new URL("../../src/mocks/users-devices.ts", import.meta.url)));
});

test("Demo summary values match the validated Asset Summary for every scope", async () => {
  const expected: [number | null, number, number][] = [[null, 146, 83], [1, 62, 35], [2, 48, 27], [3, 36, 21]];
  for (const [id, users, devices] of expected) {
    const state = await summary("demo", id);
    assert.deepEqual(summaryCardView(state, "users"), { status: "ready", value: users, stale: false }, `users ${id}`);
    assert.deepEqual(summaryCardView(state, "devices"), { status: "ready", value: devices, stale: false }, `devices ${id}`);
  }
});

test("summary values are not hardcoded or derived from sample records", () => {
  assert.doesNotMatch(ui + viewSource, /\b(146|83|62|35|48|27|36|21)\b/);
  const summaryFn = viewSource.slice(viewSource.indexOf("export function summaryCardView"), viewSource.indexOf("export type RecordSection"));
  assert.doesNotMatch(summaryFn, /records|reduce|length/);
});

test("summary is clearly defined as a simulated Dashboard asset-summary figure only", () => {
  assert.match(SUMMARY_DEFINITION, /Simulated Dashboard asset-summary figure/);
  assert.match(SUMMARY_DEFINITION, /Not a count of monitored, protected, licensed or healthy/);
});

test("Demo records: six identities and six endpoints for All Customers, two per customer, correctly associated", async () => {
  for (const kind of ["identities", "endpoints"] as const) {
    const all = await records(kind, null);
    assert.equal(all.kind, "ready");
    if (all.kind !== "ready") continue;
    assert.equal(all.records.length, 6, kind);
    for (const customer of customers) {
      const scoped = await records(kind, customer.id);
      assert.equal(scoped.kind, "ready");
      if (scoped.kind !== "ready") continue;
      assert.equal(scoped.records.length, 2, `${kind} ${customer.id}`);
      assert.ok(scoped.records.every((r) => r.customerId === customer.id && r.customerName === customer.name));
      assert.ok(scoped.records.every((r) => /not verified|unverified/i.test(r.protectionVisibility)));
    }
  }
});

test("record sections use the required headings, descriptions and disclosures", () => {
  const [accounts, endpoints] = RECORD_SECTIONS;
  assert.equal(accounts.title, "User Account Visibility");
  assert.equal(accounts.description, "Illustrative account security observations for the selected customer.");
  assert.equal(
    accounts.disclosure,
    "Illustrative account examples only. This is not a complete user directory or verified identity-protection inventory.",
  );
  assert.equal(endpoints.title, "Device & Endpoint Visibility");
  assert.equal(endpoints.description, "Illustrative endpoint security observations for the selected customer.");
  assert.equal(
    endpoints.disclosure,
    "Illustrative endpoint examples only. This is not a complete device inventory and does not verify endpoint security or backup protection.",
  );
});

test("no fabricated asset attributes are rendered", () => {
  assert.doesNotMatch(
    ui + viewSource,
    /\b(email|department|job title|last[- ]?seen|serial number|mac address|ip address|hostname|operating system|os version|encryption|license|mfa enabled|mfa status)\b/i,
  );
});

test("Live Mode shows no simulated metrics, records or zero counts", async () => {
  for (const id of [null, 1, 2, 3]) {
    const state = visibleAssetSummary({ mode: "live", customerId: id, state: await summary("live", id) }, "live", id);
    for (const key of ["users", "devices"] as const) {
      const view = summaryCardView(state, key);
      assert.notEqual(view.status, "ready", `${key} ${id}`);
    }
    const ready: VisibilityRecordsState = await records("identities", id);
    assert.deepEqual(visibleVisibilityRecords({ mode: "demo", customerId: id, state: ready }, "live", id), { kind: "unavailable" });
  }
  for (const section of RECORD_SECTIONS) {
    const view = recordSectionView({ kind: "unavailable" }, section);
    assert.equal(view.status, "not-connected");
    assert.doesNotMatch(JSON.stringify(view), /\d|Demo/);
  }
  assert.doesNotMatch(USERS_DEVICES_LIVE_NOTICE, /\d/);
  assert.match(USERS_DEVICES_LIVE_NOTICE, /does not mean there are no users or devices/);
});

test("shared customer view hides the selected demo customer in Live Mode", () => {
  const provider = read("src/components/customer-view/customer-view-provider.tsx");
  assert.match(provider, /selectedCustomer: mode === "demo" \? findSelectedCustomer\(state\.view, customers\) : null/);
  const layout = read("src/app/layout.tsx");
  assert.ok(layout.indexOf("<DashboardModeProvider>") < layout.indexOf("<CustomerViewProvider>"));
  assert.ok(layout.indexOf("<CustomerViewProvider>") < layout.indexOf("<AppHeader />"));
  assert.equal(securityScopeLabel("customer", undefined), "Selected customer");
  assert.doesNotMatch(securityScopeLabel("customer", undefined), DEMO_NAMES);
});

test("header selector shows a neutral unavailable state in Live Mode", () => {
  const selector = read("src/components/customer-selector/customer-selector.tsx");
  assert.match(selector, /if \(mode === "live"\) return <LiveScopeUnavailable \/>;/);
  assert.equal(LIVE_CUSTOMER_SCOPE_LABEL, "Customer scope unavailable");
  assert.equal(LIVE_CUSTOMER_SCOPE_DETAIL, "Customer reporting not connected");
  const live = selector.slice(selector.indexOf("function LiveScopeUnavailable"), selector.indexOf("type PanelBodyProps"));
  assert.doesNotMatch(live, /customers|selected|listbox|<button/);
  assert.match(live, /aria-label=\{`Customer view: \$\{LIVE_CUSTOMER_SCOPE_LABEL\}`\}/);
});

test("demo names appear only through Demo Mode and Demo → Live hides stale data immediately", () => {
  const ready: AssetSummaryState = { status: "error", message: "x" };
  assert.deepEqual(visibleAssetSummary({ mode: "demo", customerId: 2, state: ready }, "live", 2), { status: "loading" });
  assert.equal(securityScopeLabel("customer", "Demo Customer B"), "Demo Customer B");
});

test("switching back to Demo keeps the valid stored selection; reload defaults to Live", () => {
  const state = customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 2, customers });
  assert.deepEqual(customerViewReducer(state, { type: "reconcile", customers }), state);
  assert.match(read("src/components/dashboard-mode/dashboard-mode-provider.tsx"), /useState<DashboardMode>\("live"\)/);
});

test("announcements never name a customer", () => {
  const ready: VisibilityRecordsState = { kind: "ready", records: [] };
  for (const mode of ["live", "demo"] as const) {
    for (const s of [{ status: "loading" } as const, { status: "error", message: "x" } as const]) {
      assert.doesNotMatch(usersDevicesAnnouncement(mode, s, ready, ready), DEMO_NAMES);
    }
  }
  assert.equal(usersDevicesAnnouncement("live", { status: "loading" }, ready, ready), "Users and devices: reporting not connected.");
});

test("invalid IDs, wrong scopes and malformed records are rejected by the existing normalizers", async () => {
  assert.equal(customerViewReducer(initialCustomerViewState, { type: "select_customer", customerId: 999, customers }).view.mode, "all");
  const response = await getDemoVisibilityRecords("identities", scopeFor(1));
  assert.equal(normalizeDemoVisibilityRecords(response, "identities", scopeFor(2), customers).kind, "error");
  const malformed = structuredClone(response);
  malformed.data.records![0].name = "jane@example.com";
  assert.equal(normalizeDemoVisibilityRecords(malformed, "identities", scopeFor(1), customers).kind, "error");
  const assets = await assetSummarySource("demo")(scopeFor(1));
  assert.equal(normalizeAssetSummary(assets, scopeFor(2)).ok, false);
});

test("late responses for another customer or mode are discarded", async () => {
  const late = await records("endpoints", 1);
  assert.deepEqual(visibleVisibilityRecords({ mode: "demo", customerId: 1, state: late }, "demo", 2), { kind: "loading" });
  const lateSummary = await summary("demo", 1);
  assert.deepEqual(visibleAssetSummary({ mode: "demo", customerId: 1, state: lateSummary }, "demo", 3), { status: "loading" });
});

test("module is read-only: only a retry button and no management actions", () => {
  assert.equal((ui.match(/<button/g) ?? []).length, 1);
  assert.match(ui, /Retry \{label\.toLowerCase\(\)\}/);
  assert.doesNotMatch(
    ui,
    /reset password|disable user|create user|invite|enrol|install agent|isolate|quarantine|wipe|restore|remediat|delete|remote shell/i,
  );
  assert.doesNotMatch(ui, /cursor-pointer|onClick=\{\(\) => select/);
});

test("Dashboard, Security, Backup and Customers routes remain in place", () => {
  for (const file of ["src/app/page.tsx", "src/app/security/page.tsx", "src/app/backup/page.tsx", "src/app/customers/page.tsx"]) {
    assert.ok(existsSync(new URL(`../../${file}`, import.meta.url)), file);
  }
  const portfolio = read("src/components/customers/customers-portfolio.tsx");
  assert.match(portfolio, /href="\/security"\s+action="View Security"/);
  assert.match(portfolio, /href="\/backup"\s+action="View Backup & Recovery"/);
});
