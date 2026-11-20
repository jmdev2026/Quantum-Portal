import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customersResponse } from "@/mocks/customers";
import { getDemoAssetSummary, normalizeAssetSummary, type AssetMetricState } from "@/services/dashboard-assets";
import { getDemoCustomerOverview, normalizeCustomerOverview } from "@/services/customer-overview";
import { getDemoVisibilityRecords, normalizeDemoVisibilityRecords, type VisibilityRecord, type VisibilityRecordKind } from "@/services/security-visibility-records";
import { demoScopeBoundary, profileScopeAllowed } from "@/components/customer-view/demo-scope-boundary";
import { filterCustomerDirectory, initialDirectoryFilters } from "@/components/customer-workflows/directory-view";
import { ONBOARDING_NOTICE, SETTINGS_NOTICE, SERVICE_CHOICES, emptyOnboarding, initialSettings, validateOnboarding, validateAllOnboarding, validateSettings, type OnboardingDraft } from "@/components/customer-workflows/preview-model";
import { filterObservations, initialObservationFilters, selectObservation, updateObservationFilters } from "@/components/users-devices/observation-view";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const registry = customersResponse.data;
const all: DashboardScope = { type: "all" };
const one = (id: number): DashboardScope => ({ type: "customer", customer_id: id });
const kinds: VisibilityRecordKind[] = ["identities", "endpoints"];
const draft = (): OnboardingDraft => ({ organization: "Demo: Cedar Practice", contact: "Demo: Avery Sample", email: "contact@demo.example.com", services: [...SERVICE_CHOICES], environment: "Cloud-first", notes: "Demo: Example cloud workspace" });
async function observations(kind: VisibilityRecordKind, scope: DashboardScope = all): Promise<VisibilityRecord[]> {
  const state = normalizeDemoVisibilityRecords(await getDemoVisibilityRecords(kind, scope), kind, scope, registry);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") throw new Error("Expected normalized observations");
  return state.records;
}

test("F04 routes use the existing modules and explicit profile IDs", () => {
  for (const path of ["customers", "customers/onboarding", "customers/[id]", "users-devices", "users-devices/users", "users-devices/devices"]) assert.match(read(`src/app/${path}/page.tsx`), /Metadata/);
  assert.match(read("src/app/customers/[id]/page.tsx"), /params: Promise/);
  assert.match(read("src/app/customers/[id]/page.tsx"), /NaN/);
  assert.match(read("src/components/customers/customers-portfolio.tsx"), /href=\{`\/customers\/\$\{customer.id\}`\}/);
  assert.match(read("src/components/customer-workflows/workflow-ui.tsx"), /aria-current/);
});
test("F04 canonical user and device summaries reconcile All and every customer", async () => {
  for (const [id, users, devices] of [[null,146,83],[1,62,35],[2,48,27],[3,36,21]] as const) {
    const scope = id === null ? all : one(id);
    const result = normalizeAssetSummary(await getDemoAssetSummary(scope), scope);
    assert.ok(result.ok);
    if (!result.ok) continue;
    for (const [key, count] of [["users", users], ["devices", devices]] as const) {
      const metric: AssetMetricState = result.metrics[key];
      assert.equal(metric.kind, "ready");
      if (metric.kind === "ready") assert.equal(metric.value, count);
    }
  }
});
test("F04 profile scope is explicit, never widened from a route", () => {
  for (const customer of registry) {
    assert.equal(profileScopeAllowed(customer.id, customer.id, registry), true);
    for (const scope of [null, ...registry.filter(record => record.id !== customer.id).map(record => record.id)]) assert.equal(profileScopeAllowed(customer.id, scope, registry), false);
  }
  for (const id of [NaN, Infinity, 0, -1, 1.5, 999]) assert.equal(profileScopeAllowed(id, id, registry), false);
});
test("F04 scope revocation and registry failures deny before reads", () => {
  assert.equal(demoScopeBoundary("live", 1, registry, false)?.kind, "unavailable");
  assert.equal(demoScopeBoundary("demo", null, null, false)?.kind, "loading");
  assert.equal(demoScopeBoundary("demo", 1, registry, true)?.kind, "error");
  assert.equal(demoScopeBoundary("demo", 1, registry.filter(record => record.id !== 1), false)?.kind, "error");
  assert.equal(demoScopeBoundary("demo", 999, registry, false)?.kind, "error");
  assert.equal(demoScopeBoundary("demo", null, registry, false), null);
});
test("F04 all profile sections reuse canonical normalized services", () => {
  const source = read("src/components/customer-workflows/customer-profile.tsx");
  for (const section of ["Organization Overview", "Technology", "Security", "Backup", "Users & Devices", "Reports", "Integration limitations"]) assert.ok(source.includes(section));
  for (const hook of ["useCustomerOverview", "useAssetSummary", "useSecuritySeverity", "useSecurityCoverage", "useBackupHealth"]) assert.match(source, new RegExp(`${hook}\\(\\)`));
  assert.match(source, /SettingsPreview/);
  assert.doesNotMatch(source, /@\/mocks\/|@\/demo\/|fetch\(|axios|\b(146|83|62|35|48|27|36|21)\b/);
});
test("F04 profile links preserve scope and do not promise exports", () => {
  const source = read("src/components/customer-workflows/customer-profile.tsx");
  for (const href of ["/security", "/security/mdr", "/security/itdr", "/security/endpoint-security", "/security/dark-web", "/backup", "/users-devices", "/reports"]) assert.ok(source.includes(`"${href}"`));
  assert.match(source, /No profile-specific export/);
  assert.doesNotMatch(source, /selectAll\(|selectCustomer\(/);
});
test("F04 customer directory searches, sorts, resets and never mutates canonical reporting", async () => {
  const state = normalizeCustomerOverview(await getDemoCustomerOverview(all), all);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") return;
  const snapshot = JSON.stringify(state);
  const initial = initialDirectoryFilters();
  assert.deepEqual(filterCustomerDirectory(state.customers, { ...initial, search: "  CUSTOMER b " }).map(record => record.id), [2]);
  assert.deepEqual(filterCustomerDirectory(state.customers, { ...initial, sort: "name-desc" }).map(record => record.id), [3,2,1]);
  assert.equal(filterCustomerDirectory(state.customers, { ...initial, reporting: "unknown" }).length, 0);
  assert.equal(filterCustomerDirectory(state.customers, { ...initial, reporting: "available" }).length, 3);
  assert.deepEqual(filterCustomerDirectory(state.customers, initial).map(record => record.id), [1,2,3]);
  assert.equal(JSON.stringify(state), snapshot);
});
test("F04 onboarding has a valid complete fictional draft", () => {
  for (const step of [0,1,2,3]) assert.equal(validateOnboarding(draft(), step), null);
  assert.equal(validateAllOnboarding(draft()), null);
  for (const domain of ["com", "net", "org"]) assert.equal(validateAllOnboarding({ ...draft(), email: `avery.sample@demo.example.${domain}` }), null);
});
test("F04 onboarding rejects all incomplete steps", () => {
  for (const step of [0,1,2,3]) assert.ok(validateOnboarding(emptyOnboarding(), step));
  assert.ok(validateAllOnboarding(emptyOnboarding()));
  assert.ok(validateAllOnboarding({ ...draft(), environment: "Unsupported" }));
});
test("F04 organization and contacts require bounded fictional labels", () => {
  for (const organization of ["Actual Company", "Demo: A", `Demo: ${"A".repeat(81)}`, "Demo: <script>", "Demo: example.com", "Demo: Password secret", "Demo: Office 123"]) assert.ok(validateOnboarding({ ...draft(), organization }, 0), organization);
  assert.ok(validateOnboarding({ ...draft(), contact: "Real Person" }, 1));
});
test("F04 onboarding rejects real, malformed and unsafe addresses", () => {
  for (const email of ["contact@company.com", "contact@example.com", "a..b@demo.example.com", "a.@demo.example.com", "contact@demo.example.com.attacker.com", "contact@demo.example.com\n", "<script>@demo.example.com"]) assert.ok(validateOnboarding({ ...draft(), email }, 1), email);
});
test("F04 service and environment choices are restricted and unique", () => {
  assert.ok(validateOnboarding({ ...draft(), services: [] }, 2));
  assert.ok(validateOnboarding({ ...draft(), services: ["Run backups"] }, 2));
  assert.ok(validateOnboarding({ ...draft(), services: [SERVICE_CHOICES[0], SERVICE_CHOICES[0]] }, 2));
  assert.ok(validateOnboarding({ ...draft(), environment: "Enable agents" }, 3));
  assert.equal(validateOnboarding({ ...draft(), notes: "" }, 3), null);
});
test("F04 environment notes reject secrets, links and identifiers", () => {
  for (const notes of ["Demo: https://example.com", "Demo: API key", "Demo: Password secret", "Demo: Device 123", "Real environment", `Demo: ${"A".repeat(201)}`]) assert.ok(validateOnboarding({ ...draft(), notes }, 3), notes);
});
test("F04 settings validate editable local review preferences", () => {
  assert.equal(validateSettings(initialSettings()), null);
  assert.equal(validateSettings({ ...initialSettings(), label: "Demo: Quarterly review", timeZone: "Europe/London", cadence: "Quarterly", sections: [SERVICE_CHOICES[0]] }), null);
  for (const label of ["Real setting", "Demo: A", "Demo: secret credential", "Demo: www.example.com"]) assert.ok(validateSettings({ ...initialSettings(), label }));
});
test("F04 settings reject unsupported preferences and duplicate reporting", () => {
  for (const change of [{ timeZone: "Invalid" }, { cadence: "Immediately" }, { sections: [] }, { sections: ["Create tenant"] }, { sections: [SERVICE_CHOICES[0], SERVICE_CHOICES[0]] }]) assert.ok(validateSettings({ ...initialSettings(), ...change }));
});
test("F04 drafts are independent, resettable and do not change the registry", () => {
  const snapshot = JSON.stringify(registry);
  const settings = initialSettings();
  settings.sections.pop();
  assert.equal(initialSettings().sections.length, 3);
  const onboarding = emptyOnboarding();
  onboarding.organization = draft().organization;
  assert.equal(emptyOnboarding().organization, "");
  assert.equal(JSON.stringify(registry), snapshot);
});
test("F04 local forms implement review, edit, cancel, reset, validation and focus", () => {
  const onboarding = read("src/components/customer-workflows/onboarding-preview.tsx");
  const settings = read("src/components/customer-workflows/settings-preview.tsx");
  for (const text of ["Next", "Back", "Edit", "Cancel preview", "Reset draft", "Confirm local preview"]) assert.ok(onboarding.includes(text));
  for (const text of ["Review preferences", "Edit preferences", "Cancel preview", "Reset preview", "Confirm local preview"]) assert.ok(settings.includes(text));
  for (const source of [onboarding, settings]) { assert.match(source, /role="alert"/); assert.match(source, /current\?\.focus\(\)/); assert.match(source, /noValidate/); assert.match(source, /aria-invalid/); }
  assert.match(settings, /restoreFocus/);
  assert.equal(ONBOARDING_NOTICE, "Demonstration only. No customer account, tenant, service agreement or invitation has been created.");
  assert.equal(SETTINGS_NOTICE, "Configuration preview — not saved");
});
test("F04 context and navigation unmount all previews rather than retaining drafts", () => {
  const boundary = read("src/components/customer-workflows/workflow-boundary.tsx");
  assert.match(boundary, /registry !== heldRegistry/);
  assert.match(boundary, /key=\{`\$\{mode\}:\$\{customerId\}/);
  assert.match(boundary, /profileScopeAllowed/);
  assert.match(read("src/components/customer-workflows/onboarding-preview.tsx"), /WorkflowBoundary requireAll/);
  assert.doesNotMatch(boundary, /selectAll\(|selectCustomer\(/);
});
test("F04 canonical identity and endpoint samples are exactly six and two per customer", async () => {
  for (const kind of kinds) {
    const portfolio = await observations(kind);
    assert.equal(portfolio.length, 6);
    assert.equal(new Set(portfolio.map(record => record.id)).size, 6);
    for (const customer of registry) {
      const scoped = await observations(kind, one(customer.id));
      assert.equal(scoped.length, 2);
      assert.ok(scoped.every(record => record.customerId === customer.id && record.customerName === customer.name));
    }
  }
});
test("F04 observation search combines scope and reported visibility without inventing metadata", async () => {
  for (const kind of kinds) {
    const records = await observations(kind);
    const initial = initialObservationFilters();
    const exact = filterObservations(records, { ...initial, search: `  ${records[0].name.toUpperCase()}  ` });
    assert.deepEqual(exact.map(record => record.id), [records[0].id]);
    const scoped = filterObservations(records, { ...initial, customer: "2", visibility: records.find(record => record.customerId === 2)!.protectionVisibility });
    assert.ok(scoped.length > 0 && scoped.every(record => record.customerId === 2));
    assert.equal(filterObservations(records, { ...initial, search: "nonexistent" }).length, 0);
    assert.equal(filterObservations(records, initial).length, 6);
  }
});
test("F04 observation filter input is bounded and allowlisted", async () => {
  const records = await observations("identities");
  const filters = initialObservationFilters();
  assert.equal(updateObservationFilters(filters, "search", "x".repeat(300), records).search.length, 200);
  for (const [field, value] of [["customer", "999"], ["visibility", "Compromised"], ["sort", "random"]] as const) assert.equal(updateObservationFilters(filters, field, value, records), filters);
});
test("F04 observation sorting is deterministic, copying and ID-stable", async () => {
  const records = await observations("endpoints");
  const snapshot = JSON.stringify(records);
  const filters = initialObservationFilters();
  assert.deepEqual(filterObservations(records, { ...filters, sort: "name-desc" }).map(record => record.id), [...filterObservations(records, filters)].reverse().map(record => record.id));
  const ties = [{ ...records[0], id: "z", name: "Same" }, { ...records[0], id: "a", name: "Same" }];
  assert.deepEqual(filterObservations(ties, filters).map(record => record.id), ["a", "z"]);
  assert.equal(JSON.stringify(records), snapshot);
});
test("F04 detail lookup only selects a currently visible validated observation", async () => {
  for (const kind of kinds) {
    const records = await observations(kind);
    for (const record of records) assert.equal(selectObservation(records, record.id), record);
    const scoped = records.filter(record => record.customerId === 2);
    const wrong = records.find(record => record.customerId === 1)!;
    assert.equal(selectObservation(scoped, wrong.id), null);
    assert.equal(selectObservation([], wrong.id), null);
    assert.equal(selectObservation(records, "unknown"), null);
  }
});
test("F04 malformed, wrong-scope and revoked-empty observations fail closed", async () => {
  for (const kind of kinds) {
    const response = await getDemoVisibilityRecords(kind, one(1));
    assert.equal(normalizeDemoVisibilityRecords(response, kind, one(2), registry).kind, "error");
    const empty = { data: { ...response.data, records: [] } };
    assert.equal(normalizeDemoVisibilityRecords(empty, kind, one(1), registry.filter(customer => customer.id !== 1)).kind, "error");
    assert.equal(normalizeDemoVisibilityRecords(empty, kind, one(1), registry).kind, "ready");
    const fabricated = structuredClone(response);
    if (fabricated.data.records) (fabricated.data.records[0] as unknown as Record<string, unknown>).email = "invented@example.com";
    assert.equal(normalizeDemoVisibilityRecords(fabricated, kind, one(1), registry).kind, "error");
  }
});
test("F04 all shared loaders gate Live, registry identity, retry and late responses", () => {
  for (const name of ["use-customer-overview", "use-asset-summary", "use-security-severity", "use-security-coverage"]) {
    const source = read(`src/components/dashboard/${name}.ts`);
    assert.match(source, /demoScopeBoundary/);
    assert.match(source, /loaded.registry !== registry/);
    assert.match(source, /loaded.attempt !== attempt/);
    assert.match(source, /cancelled = true/);
  }
  const source = read("src/components/security/use-visibility-records.ts");
  for (const pattern of [/if \(mode !== "demo"\) return/, /loaded.registry !== customers/, /loaded.recordKind !== kind/, /loaded.attempt !== attempt/, /cancelled = true/]) assert.match(source, pattern);
});
test("F04 explorers expose loading, error, retry, empty, no-match and reset states", () => {
  const source = read("src/components/users-devices/observation-explorer.tsx");
  for (const pattern of [/WorkflowState/, /retry=\{retry\}/, /No observations match/, /No observations are available/, /Reset filters/, /role="status"/, /key=\{contextKey\}/, /setSelectedId\(null\)/]) assert.match(source, pattern);
});
test("F04 detail dialogs have native containment, Escape and safe focus restoration", () => {
  const source = read("src/components/users-devices/observation-detail.tsx");
  for (const pattern of [/showModal\(\)/, /onCancel=/, /aria-labelledby=/, /aria-describedby=/, /trigger\?\.isConnected/, /workflow-heading/, /85dvh/, /current\?\.focus\(\)/]) assert.match(source, pattern);
});
test("F04 user and device detail links are module navigation, not fabricated relationships", () => {
  const source = read("src/components/users-devices/observation-detail.tsx");
  for (const href of ["/security/itdr", "/security/dark-web", "/security", "/security/awareness-training", "/security/phishing-simulations", "/security/endpoint-security", "/security/mdr", "/security/detections", "/backup/assets", "/backup/jobs"]) assert.ok(source.includes(`"${href}"`));
  assert.match(source, /No validated reference/);
  assert.match(source, /not records associated/);
  assert.doesNotMatch(source, /record\.(email|os|ip|mac|serial|agent|owner|lastSeen|mfa|license|health)/);
});
test("F04 responsive layouts and existing Dashboard anchors are preserved", () => {
  const source = read("src/components/users-devices/observation-explorer.tsx");
  assert.match(source, /hidden lg:block/);
  assert.match(source, /lg:hidden/);
  assert.match(source, /<caption/);
  assert.match(source, /scope="row"/);
  const view = read("src/components/users-devices/users-devices-view.ts");
  assert.match(view, /user-account-visibility/);
  assert.match(view, /device-endpoint-visibility/);
});
test("F04 previews and explorers have no persistence, authentication or operational calls", () => {
  const source = ["customer-workflows/onboarding-preview", "customer-workflows/settings-preview", "customer-workflows/customer-profile", "users-devices/observation-explorer", "users-devices/observation-detail"].map(name => read(`src/components/${name}.tsx`)).join("\n");
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|supabase|fetch\(|axios|createCustomer\(|inviteUser\(|updateDevice\(|dangerouslySetInnerHTML/);
  assert.match(source, /Planned roles are informational/);
});
