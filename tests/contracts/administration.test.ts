import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { administrationScope, ADMINISTRATION_BOUNDARY, PROPOSED_ROLES, ACCESS_REQUIREMENTS, INTEGRATION_PLANS, CONNECTIVITY_REQUIREMENTS, AUDIT_EVENT_TYPES, AUDIT_REQUIREMENTS } from "@/components/administration/administration-view";
import { navSections, isNavItemActive } from "@/components/sidebar/navigation";
import { customerViewReducer, initialCustomerViewState } from "@/components/customer-view/customer-view-state";
import { LIVE_CUSTOMER_SCOPE_LABEL } from "@/components/customer-selector/live-scope";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url),"utf8");
const ui = read("src/components/administration/administration-workspace.tsx");
const model = read("src/components/administration/administration-view.ts");

test("Administration route enables final sidebar entry with exact active state", () => {
  assert.match(read("src/app/administration/page.tsx"),/Administration · Quantum Shield Command/);
  const items = navSections.flatMap(s => s.items);
  assert.equal(items.filter(i => i.href).length,8);
  const item = items.find(i => i.id === "administration")!;
  assert.equal(item.href,"/administration");
  assert.ok(isNavItemActive(item,"/administration"));
  assert.equal(isNavItemActive(item,"/administration/history"),false);
  assert.equal(isNavItemActive(item,"/reports"),false);
  assert.match(read("src/components/sidebar/sidebar-nav.tsx"),/item\.href \? \(/);
});

test("known portal identity and shared scope are presented without operational records", () => {
  assert.match(ui,/Quantum Shield Command/);
  assert.match(ui,/Quantum Shield IT/);
  assert.match(ui,/useCustomerView\(\)/);
  assert.match(ui,/useDashboardMode\(\)/);
  assert.doesNotMatch(ui + model,/createContext|organization_id|tenant_id|created_at|billing|subscription|@example|primary administrator/i);
  for (const section of ["Organization & Portal Overview","Access Governance","Integration Readiness","Auditability & Security"]) assert.ok(ui.includes(section));
});

test("Live suppresses stale fictional name while valid Demo scopes remain accurate", () => {
  assert.equal(administrationScope("live",{mode:"customer",customerId:2},"Demo Customer B"),LIVE_CUSTOMER_SCOPE_LABEL);
  assert.equal(administrationScope("demo",{mode:"all"}),"All Customers");
  for (const [id,name] of [[1,"Demo Customer A"],[2,"Demo Customer B"],[3,"Demo Customer C"]] as const) assert.equal(administrationScope("demo",{mode:"customer",customerId:id},name),name);
  assert.equal(administrationScope("demo",{mode:"customer",customerId:-1}),"Customer unavailable");
  assert.match(ui,/Selection does not grant or enforce permissions/);
});

test("invalid customer selection stays rejected and explicit All works", () => {
  const rejected = customerViewReducer(initialCustomerViewState,{type:"select_customer",customerId:999,customers:[]});
  assert.deepEqual(rejected.view,{mode:"customer",customerId:-1});
  assert.equal(administrationScope("demo",rejected.view),"Customer unavailable");
  assert.deepEqual(customerViewReducer(rejected,{type:"select_all"}).view,{mode:"all"});
  const provider = read("src/components/customer-view/customer-view-provider.tsx");
  assert.match(provider,/view: mode === "demo" \? state.view : LIVE_VIEW/);
  assert.match(provider,/selectedCustomer: mode === "demo" \? findSelectedCustomer/);
});

test("proposed roles never imply assigned or enforced administrator access", () => {
  assert.deepEqual(PROPOSED_ROLES.map(r => r.name),["MSP Administrator","Client Administrator","Client Viewer"]);
  assert.match(ui,/Proposed access model — not enforced/);
  assert.match(ui,/No roles are assigned to users/);
  assert.match(ADMINISTRATION_BOUNDARY,/future secure backend/);
  assert.equal(ACCESS_REQUIREMENTS.length,4);
  const requirements = ACCESS_REQUIREMENTS.map(r => r.description).join(" ");
  for (const phrase of ["MFA","session","role and permission validation","least-privilege","Tenant-scoped","cross-tenant","auditing","expiration and revocation"]) assert.ok(requirements.includes(phrase));
  assert.doesNotMatch(ui,/Administrator access granted|signed-in administrator|<input|<form|<button/);
});

test("integration plans preserve exact provider context and secure boundaries", () => {
  assert.deepEqual(INTEGRATION_PLANS.map(p => p.name),["Laravel Backend","Guardz Security Platform","Datto Endpoint Backup"]);
  assert.match(INTEGRATION_PLANS[2].description,/Datto Endpoint Backup v2 \/ Kaseya 365 Endpoint Backup/);
  assert.match(INTEGRATION_PLANS[1].description,/actual API capability/);
  assert.match(ui,/Pending backend integration/);
  assert.match(ui,/RESTORE_UNAVAILABLE/);
  assert.ok(CONNECTIVITY_REQUIREMENTS.some(r => r.includes("never embedded in frontend bundles")));
  assert.ok(CONNECTIVITY_REQUIREMENTS.some(r => r.includes("zero security incidents or zero backups")));
  assert.doesNotMatch(ui + model,/last_synced_at|new Date\(|https?:\/\/|\/api\/|process\.env|import\.meta\.env|api_key|access_token/i);
});

test("audit types are future categories not fabricated history or operational actions", () => {
  assert.equal(AUDIT_EVENT_TYPES.length,6);
  assert.match(ui,/Administrative audit events are not collected through this demonstration interface/);
  assert.match(ui,/not historical log entries/);
  assert.match(AUDIT_REQUIREMENTS,/planned requirements, not production protections/);
  assert.match(AUDIT_REQUIREMENTS,/action attribution/);
  assert.match(AUDIT_REQUIREMENTS,/unauthorized replay/);
  assert.doesNotMatch(ui + model,/event_id|source_ip|timestamp|event_count|fetch\(|axios|\/services\/|download|export controls|onClick|localStorage|sessionStorage/);
});

test("Administration has one page heading, textual statuses and noninteractive responsive cards", () => {
  assert.equal((ui.match(/<h1\b/g) ?? []).length,1);
  assert.equal((ui.match(/<h2\b/g) ?? []).length,4);
  assert.match(ui,/role="status"/);
  assert.match(ui,/aria-hidden/);
  assert.match(ui,/sm:grid-cols-2/);
  assert.match(ui,/lg:grid-cols-3/);
  assert.match(ui,/break-words/);
  assert.doesNotMatch(ui,/cursor-pointer|animate-/);
});
