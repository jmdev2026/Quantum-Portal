import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FRAMEWORK_FUNCTIONS, EVIDENCE_CATEGORIES, FRAMEWORK_DISCLAIMER, CONTROL_DISCLOSURE, complianceControls, complianceScope, NIST_REFERENCE } from "@/components/compliance/compliance-view";
import { getDemoSecurityCoverage, getSecurityCoverage, normalizeSecurityCoverage, SECURITY_CONTROLS } from "@/services/security-coverage";
import { visibleSecurityCoverage } from "@/components/dashboard/security-coverage-view";
import { customerViewReducer, initialCustomerViewState } from "@/components/customer-view/customer-view-state";
import { navSections, isNavItemActive } from "@/components/sidebar/navigation";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const ui = read("src/components/compliance/compliance-workspace.tsx");

test("Compliance route and navigation enable seven modules, not Administration", () => {
  assert.match(read("src/app/compliance/page.tsx"), /Compliance · Quantum Shield Command/);
  const items = navSections.flatMap(s => s.items);
  const item = items.find(i => i.id === "compliance")!;
  assert.equal(item.href,"/compliance");
  assert.ok(isNavItemActive(item,"/compliance"));
  assert.equal(isNavItemActive(item,"/compliance/history"),false);
  assert.equal(isNavItemActive(item,"/reports"),false);
  assert.equal(items.filter(i => i.href).length,7);
  assert.equal(items.find(i => i.id === "administration")?.href,undefined);
});

test("NIST reference has the six official functions without scores or formal mappings", () => {
  assert.deepEqual(FRAMEWORK_FUNCTIONS.map(f => f.name),["GOVERN","IDENTIFY","PROTECT","DETECT","RESPOND","RECOVER"]);
  assert.ok(FRAMEWORK_FUNCTIONS.every(f => f.description.length > 20));
  assert.equal(NIST_REFERENCE,"https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20");
  assert.match(FRAMEWORK_DISCLAIMER,/not a formal assessment, audit, certification/);
  assert.match(ui,/Quantum Shield’s high-level educational summaries/);
  assert.doesNotMatch(ui,/maturity level|completion percentage|NIST certified|audit passed|audit failed|regulatory requirements satisfied|GV\.[A-Z]/i);
});

for (const id of [null,1,2,3] as const) test(`Compliance preserves all nine normalized control signals for ${id ?? "All"}`, async () => {
  const scope: DashboardScope = id === null ? {type:"all"} : {type:"customer",customer_id:id};
  const response = await getDemoSecurityCoverage(scope);
  const state = normalizeSecurityCoverage(response,scope);
  assert.equal(state.kind,"ready");
  const controls = complianceControls(state,"demo",id === null ? "All Customers" : `Demo Customer ${id}`);
  assert.deepEqual(controls.rows.map(r => r.key),SECURITY_CONTROLS.map(c => c.key));
  assert.deepEqual(controls.rows.map(r => r.label),SECURITY_CONTROLS.map(c => c.label));
  assert.deepEqual(controls.rows.map(r => r.value.kind === "status" ? r.value.status : null),SECURITY_CONTROLS.map(c => response.data.controls!.find(r => r.key === c.key)!.status));
  assert.equal(controls.badge,"Simulated");
  assert.equal(normalizeSecurityCoverage(response,{type:"customer",customer_id:999}).kind,"error");
});

test("Live defensively hides demo control signals and customer names even with a ready response", async () => {
  const scope: DashboardScope = {type:"customer",customer_id:2};
  const ready = normalizeSecurityCoverage(await getDemoSecurityCoverage(scope),scope);
  const label = complianceScope("live",{mode:"customer",customerId:2},"Demo Customer B");
  assert.equal(label,"Customer scope unavailable");
  const controls = complianceControls(ready,"live",label);
  assert.equal(controls.status,"not-connected");
  assert.ok(controls.rows.every(r => r.value.kind === "placeholder"));
  assert.doesNotMatch(controls.announcement,/Demo Customer/);
  assert.equal(normalizeSecurityCoverage(await getSecurityCoverage({type:"all"}),{type:"all"}).kind,"unavailable");
});

test("wrong mode or customer clears previous signals synchronously; cancellation protects late responses", async () => {
  const scope: DashboardScope = {type:"customer",customer_id:1};
  const state = normalizeSecurityCoverage(await getDemoSecurityCoverage(scope),scope);
  const loaded = {mode:"demo" as const,customerId:1,state};
  assert.equal(visibleSecurityCoverage(loaded,"demo",2).kind,"loading");
  assert.equal(visibleSecurityCoverage(loaded,"live",null).kind,"loading");
  const hook = read("src/components/dashboard/use-security-coverage.ts");
  assert.match(hook,/if \(!cancelled\) setLoaded/);
  assert.match(hook,/cancelled = true/);
  assert.match(ui,/useSecurityCoverage\(\)/);
});

test("unknown IDs and removed selections never broaden to All Customers", async () => {
  const scope: DashboardScope = {type:"customer",customer_id:-1};
  const state = normalizeSecurityCoverage(await getDemoSecurityCoverage(scope),scope);
  assert.equal(state.kind,"error");
  assert.ok(complianceControls(state,"demo","Customer unavailable").rows.every(r => r.value.kind !== "status"));
  const rejected = customerViewReducer(initialCustomerViewState,{type:"select_customer",customerId:999,customers:[]});
  assert.deepEqual(rejected.view,{mode:"customer",customerId:-1});
  assert.equal(complianceScope("demo",rejected.view),"Customer unavailable");
  assert.equal(complianceScope("demo",{mode:"all"}),"All Customers");
});

test("loading, errors and empty signals stay distinct without assessment conclusions", () => {
  assert.equal(complianceControls({kind:"loading"},"demo","All Customers").status,"loading");
  assert.equal(complianceControls({kind:"error",message:"Scope rejected"},"demo","Customer unavailable").status,"error");
  assert.equal(complianceControls({kind:"empty",source:null,lastSyncedAt:null},"demo","All Customers").status,"empty");
  assert.match(ui,/Retry control reporting/);
});

test("educational evidence, truthful summary and read-only boundaries are explicit", () => {
  assert.equal(EVIDENCE_CATEGORIES.length,6);
  assert.match(CONTROL_DISCLOSURE,/not validated compliance evidence/);
  for (const title of ["Framework Overview","Security Control Visibility","Assessment Evidence","Compliance Summary"]) assert.ok(ui.includes(title));
  assert.match(ui,/Compliance status has not been assessed/);
  assert.match(ui,/nothing about evidence held outside this portal/);
  assert.match(ui,/not mandatory for every organization/);
  assert.equal((ui.match(/<h1\b/g) ?? []).length,1);
  assert.doesNotMatch(ui,/fetch\(|axios|upload|download|approve evidence|\/api\/compliance|selectCustomer|setMode|new Date\(/i);
  assert.match(ui,/mode === "demo" && <ul/);
});
