import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { SECURITY_CAPABILITIES, PLANNED_SECURITY_CAPABILITIES } from "@/components/security/security-capability-directory";
import { filterCapabilityRecords, resetCapabilityFilters, selectedCapabilityRecord, visibleCapabilityState, capabilityStateMessage, type LoadedCapability } from "@/components/security/capability-explorer-view";
import { getCapabilityRecords, getExternalFootprint, getEmailProtection, getCloudDataProtection, normalizeCapabilityRecords } from "@/services/security-capabilities";
import { customersResponse } from "@/mocks/customers";
import { buildDemoSecurityDetections } from "@/demo/security-detections";
import { buildDemoSecurityIdentities } from "@/demo/security-identities";
import { buildDemoSecurityEndpoints } from "@/demo/security-endpoints";
import { CAPABILITY_CATEGORIES, type CapabilityState, type CapabilityRecord, type NewCapabilityId, type CapabilityResponse } from "@/services/security-capability-types";
import { findActiveNavItem } from "@/components/sidebar/navigation";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const all = { type: "all" } as const;
const customers = customersResponse.data;
const recordsOf = (state: CapabilityState): CapabilityRecord[] => {
  assert.equal(state.kind, "ready");
  return state.kind === "ready" ? state.records : [];
};

for (const capability of SECURITY_CAPABILITIES) {
  test(`${capability.id}: six All examples; All/A/B/C/All sequence and invalid scopes fail closed`, async () => {
    for (const id of [null, 1, 2, 3, null]) {
      const scope = id === null ? all : { type: "customer", customer_id: id } as const;
      const records = recordsOf(await getCapabilityRecords(capability.id, scope, customers));
      assert.equal(records.length, id === null ? 6 : 2);
      assert.ok(records.every(record => id === null || record.customerId === id));
      assert.ok(records.every(record => record.source === "Simulated demo data" && /fictional/i.test(record.observation)));
    }
    for (const id of [-1, 0, 99, 1.5, Number.NaN]) assert.equal((await getCapabilityRecords(capability.id, { type: "customer", customer_id: id }, customers)).kind, "error");
    assert.equal((await getCapabilityRecords(capability.id, { type: "customer", customer_id: 2 }, customers.filter(customer => customer.id !== 2))).kind, "error");
  });
  test(`${capability.id}: combined search/filters, deterministic sorting, reset and current-record detail selection`, async () => {
    const state = await getCapabilityRecords(capability.id, all, customers);
    const records = recordsOf(state);
    const initial = records.map(record => record.id);
    const defaults = resetCapabilityFilters();
    assert.equal(filterCapabilityRecords(records, { ...defaults, search: "  DEMO CUSTOMER B  " }).length, 2);
    assert.equal(filterCapabilityRecords(records, { ...defaults, search: " Simulated Demo Data " }).length, 6);
    assert.ok(filterCapabilityRecords(records, { ...defaults, search: `  ${records[0].name.toUpperCase()}  ` }).some(record => record.id === records[0].id));
    assert.ok(filterCapabilityRecords(records, { ...defaults, search: records[0].observation.slice(0, 30) }).length > 0);
    assert.equal(filterCapabilityRecords(records, { ...defaults, search: "no-such-observation" }).length, 0);
    const field = capability.filter === "severity" ? "severity" : capability.filter === "protection" ? "protection" : "category";
    const value = field === "severity" ? records[0].severity! : field === "protection" ? "not-verified" : records[0].category!;
    const filtered = filterCapabilityRecords(records, { ...defaults, [field]: value, search: records[0].customerName });
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every(record => record.customerId === records[0].customerId));
    if (records[0].assetLabel) assert.ok(filterCapabilityRecords(records, { ...defaults, search: records[0].assetLabel }).some(record => record.id === records[0].id));
    if (capability.id === "external-footprint") assert.ok(filterCapabilityRecords(records, { ...defaults, category: records[0].category!, severity: records[0].severity! }).every(record => record.category === records[0].category && record.severity === records[0].severity));
    if (records[0].status) {
      const statusRecords = filterCapabilityRecords(records, { ...defaults, status: records[0].status, category: records[0].category! });
      assert.ok(statusRecords.length > 0);
      assert.ok(statusRecords.every(record => record.status === records[0].status));
      assert.equal(filterCapabilityRecords(records, { ...defaults, status: "quarantined" }).length, 0);
    }
    const asc = filterCapabilityRecords(records, defaults);
    const desc = filterCapabilityRecords(records, { ...defaults, sort: "name-desc" });
    assert.deepEqual(desc.map(record => record.id), asc.map(record => record.id).reverse());
    assert.deepEqual(filterCapabilityRecords(records, { ...defaults, sort: "severity" }), filterCapabilityRecords([...records].reverse(), { ...defaults, sort: "severity" }));
    assert.deepEqual(records.map(record => record.id), initial);
    const reset = resetCapabilityFilters();
    reset.search = "modified draft";
    assert.equal(resetCapabilityFilters().search, "");
    assert.equal(filterCapabilityRecords(records, resetCapabilityFilters()).length, 6);
    for (const record of records) assert.deepEqual(selectedCapabilityRecord(state, record.id), record);
    assert.equal(selectedCapabilityRecord(state, null), null);
    assert.equal(selectedCapabilityRecord(state, "missing"), null);
    const other = await getCapabilityRecords(capability.id, { type: "customer", customer_id: 3 }, customers);
    assert.equal(selectedCapabilityRecord(other, records.find(record => record.customerId === 1)!.id), null);
  });
}

const loaders = { "external-footprint": getExternalFootprint, "email-protection": getEmailProtection, "cloud-data-protection": getCloudDataProtection };
for (const kind of Object.keys(loaders) as NewCapabilityId[]) {
  test(`${kind}: strict nested schema rejects malformed, duplicate, private, wrong-customer and unsupported fields`, async () => {
    const response = await loaders[kind](all);
    assert.equal(normalizeCapabilityRecords(response, kind, all, customers).kind, "ready");
    assert.deepEqual(response.data.map(record => record.customer.id), [1, 1, 2, 2, 3, 3]);
    assert.deepEqual(new Set(response.data.map(record => record.category)), new Set(CAPABILITY_CATEGORIES[kind]));
    const mutations: Array<(value: CapabilityResponse) => void> = [
      value => { (value as unknown as Record<string, unknown>).unexpected = true; },
      value => { (value.meta as unknown as Record<string, unknown>).provider = "connected"; },
      value => { (value.data[0] as unknown as Record<string, unknown>).case_id = "fake"; },
      value => { (value.data[0].customer as unknown as Record<string, unknown>).tenant_id = "fake"; },
      value => { value.data.push(structuredClone(value.data[0])); },
      value => { value.data[0].customer.id = 99; },
      value => { value.data[0].customer.name = "Unknown Customer"; },
      value => { value.data[0].source = "Verified provider" as never; },
      value => { value.data[0].category = "unsupported"; },
      value => { value.data[0].status = "quarantined" as never; },
      value => { value.data[0].severity = "unsupported" as never; },
      value => { value.data[0].observation = "Real incident"; },
      value => { value.data[0].observation = "Fictional note user@real.test"; },
      value => { value.data[0].asset_label = "192.0.2.10"; },
      value => { value.data[0].asset_label = "real-customer.com"; },
      value => { value.data[0].name = "Real account"; },
      value => { value.data[0].id = value.data[0].id.slice(0, -1) + "2"; },
      value => { value.data[0].created_at = "2026-11-01"; },
      value => { value.data[0].created_at = "2026-11-02T10:00:00Z"; },
      value => { value.data[0].is_fictional = false as never; },
      value => { value.data[0].protection_visibility = "Monitoring Active" as never; },
      value => { value.meta.status = "error"; },
      value => { value.meta.scope = { type: "customer", customer_id: 1 }; },
      value => { value.data = Array.from({ length: 26 }, () => value.data[0]); },
    ];
    for (const [index, mutate] of mutations.entries()) {
      const changed = structuredClone(response);
      mutate(changed);
      assert.equal(normalizeCapabilityRecords(changed, kind, all, customers).kind, "error", `mutation ${index}`);
    }
    const empty = structuredClone(response); empty.data = [];
    assert.deepEqual(normalizeCapabilityRecords(empty, kind, all, customers), { kind: "ready", records: [] });
    const b = { type: "customer", customer_id: 2 } as const;
    const scoped = await loaders[kind](b);
    scoped.data = response.data;
    assert.equal(normalizeCapabilityRecords(scoped, kind, b, customers).kind, "error");
    assert.equal(normalizeCapabilityRecords(response, kind, all, customers.filter(customer => customer.id !== 2)).kind, "error");
    const cloned = await loaders[kind](all); cloned.data[0].name = "changed";
    assert.notEqual((await loaders[kind](all)).data[0].name, "changed");
  });
}

test("MDR/ITDR/Endpoint reuse canonical IDs and observations without derived inventory fields", async () => {
  const detection = recordsOf(await getCapabilityRecords("mdr", all, customers));
  assert.deepEqual(detection.map(record => ({ id: record.id, title: record.name, summary: record.observation, severity: record.severity })), buildDemoSecurityDetections(all).data.detections!.map(record => ({ id: record.id, title: record.title, summary: record.summary, severity: record.severity })));
  for (const [kind, build] of [["itdr", buildDemoSecurityIdentities], ["endpoint-security", buildDemoSecurityEndpoints]] as const) {
    const actual = recordsOf(await getCapabilityRecords(kind, all, customers));
    assert.deepEqual(actual.map(record => ({ id: record.id, name: record.name, observation: record.observation, protection: record.protectionVisibility })), build(all).data.records!.map(record => ({ id: record.id, name: record.name, observation: record.observation, protection: record.protection_visibility })));
    assert.ok(actual.every(record => record.category === undefined && record.severity === undefined && record.status === undefined));
  }
});

test("all six routes have unique context, active Security navigation, real return and Reports destinations", () => {
  assert.equal(SECURITY_CAPABILITIES.length, 6);
  assert.equal(new Set(SECURITY_CAPABILITIES.map(capability => capability.title)).size, 6);
  for (const capability of SECURITY_CAPABILITIES) {
    assert.ok(existsSync(new URL(`../../src/app/security/${capability.id}/page.tsx`, import.meta.url)));
    const page = read(`src/app/security/${capability.id}/page.tsx`);
    assert.ok(page.includes(`capabilityId="${capability.id}"`));
    assert.ok(page.includes(capability.title));
    assert.doesNotMatch(page, /Provider|AppSidebar|AppHeader/);
    assert.equal(findActiveNavItem(`/security/${capability.id}`)?.id, "security");
    assert.ok(capability.overview.length >= 2 && capability.limitation.length > 100);
  }
  assert.match(read("src/app/security/page.tsx"), /<SecurityCapabilityHub \/>/);
  assert.match(read("src/components/security/security-capability-hub.tsx"), /href=\{`\/security\/\$\{capability.id\}`\}/);
  const workspace = read("src/components/security/security-capability-workspace.tsx");
  assert.match(workspace, /href="\/security"/);
  assert.match(workspace, /href="\/security\/detections"/);
  assert.match(workspace, /href="\/reports"/);
  assert.equal((workspace.match(/<h1\b/g) ?? []).length, 1);
  assert.equal(PLANNED_SECURITY_CAPABILITIES.length, 3);
  assert.equal(PLANNED_SECURITY_CAPABILITIES[0].milestone, "F02c · P1");
});

test("all capabilities immediately gate Live, scope/route changes, retry, closed details and late responses", async () => {
  for (const capability of SECURITY_CAPABILITIES) {
    const state = await getCapabilityRecords(capability.id, { type: "customer", customer_id: 1 }, customers);
    const selected = recordsOf(state)[0].id;
    const loaded: LoadedCapability = { capability: capability.id, mode: "demo", customerId: 1, attempt: 0, state };
    for (const id of [null, 2, 3, -1]) {
      const gated = visibleCapabilityState(loaded, capability.id, "demo", id, 0);
      assert.equal(gated.kind, "loading");
      assert.equal(selectedCapabilityRecord(gated, selected), null);
    }
    assert.equal(visibleCapabilityState(loaded, capability.id, "live", 1, 0).kind, "unavailable");
    assert.equal(selectedCapabilityRecord(visibleCapabilityState(loaded, capability.id, "live", 1, 0), selected), null);
    assert.equal(visibleCapabilityState({ ...loaded, mode: "live" }, capability.id, "demo", 1, 0).kind, "loading");
    assert.equal(visibleCapabilityState(loaded, capability.id, "demo", 1, 1).kind, "loading");
    const other = capability.id === "mdr" ? "itdr" : "mdr";
    assert.equal(visibleCapabilityState(loaded, other, "demo", 1, 0).kind, "loading");
    const slowA = getCapabilityRecords(capability.id, { type: "customer", customer_id: 1 }, customers).then(async result => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return result;
    });
    const currentB = await getCapabilityRecords(capability.id, { type: "customer", customer_id: 2 }, customers);
    assert.ok(recordsOf(currentB).every(record => record.customerId === 2));
    const late = { ...loaded, state: await slowA };
    assert.equal(visibleCapabilityState(late, capability.id, "demo", 2, 0).kind, "loading");
  }
});

test("loading, error/retry, unavailable, empty data and no matches are distinct; UI uses tested operations", () => {
  const states: CapabilityState[] = [{ kind: "loading" }, { kind: "error", message: "Unable to load" }, { kind: "unavailable" }, { kind: "ready", records: [] }];
  assert.equal(new Set(states.map(state => capabilityStateMessage(state).title)).size, 4);
  for (const state of states) assert.equal(selectedCapabilityRecord(state, "missing"), null);
  const ui = read("src/components/security/capability-record-explorer.tsx");
  for (const expression of ["filterCapabilityRecords(state.records, filters)", "resetCapabilityFilters()", "selectedCapabilityRecord(state, selectedId)", "setSelectedId(record.id)", "setSelectedId(null)", "onClick={retry}", "No matching fictional observations"]) assert.ok(ui.includes(expression), expression);
  assert.match(ui, /if \(state.kind !== "ready"\) return/);
  assert.match(ui, /role=\{state.kind === "error" \? "alert" : "status"\}/);
  assert.match(ui, /aria-busy=\{state.kind === "loading"\}/);
});

test("hook cancellation, registry revalidation and context-keyed reset prevent stale detail or fictional Live scope", () => {
  const hook = read("src/components/security/use-capability-records.ts");
  assert.match(hook, /if \(mode !== "demo"\) \{\s*setLoaded\(\{ capability, mode, customerId, attempt, state: \{ kind: "unavailable" \} \}\);\s*return;/);
  assert.match(hook, /if \(!cancelled\) setLoaded/);
  assert.match(hook, /cancelled = true/);
  assert.match(hook, /registryMismatch/);
  assert.match(hook, /mode === "live" \? "Customer scope unavailable"/);
  assert.match(hook, /contextKey: `\$\{capability\}:\$\{mode\}:\$\{customerId\}:\$\{attempt\}`/);
  assert.match(read("src/components/security/security-capability-workspace.tsx"), /<CapabilityRecordExplorer key=\{contextKey\}/);
  assert.doesNotMatch(hook, /localStorage|fetch\(|axios|selectAll/);
});

test("detail dialog implements native focus containment, Escape, focus restoration and validated fields only", () => {
  const detail = read("src/components/security/capability-record-detail.tsx");
  for (const value of ["showModal()", "dialog?.close()", "trigger.focus()", "onCancel=", "onClick={onClose}", "autoFocus", "aria-labelledby=", "aria-describedby=", "max-h-[85dvh]", "w-[calc(100%-2rem)]", "overflow-y-auto"]) assert.ok(detail.includes(value), value);
  assert.match(detail, /href="\/reports"/);
  assert.doesNotMatch(detail, /record\.(case_id|timeline|ip|os|agent|created_at|evidence|credentials)/);
  assert.match(read("src/components/security/capability-record-explorer.tsx"), /aria-haspopup="dialog"/);
});

test("capability UI is read-only, responsive and independent of aggregate/provider claims", () => {
  const files = ["security-capability-workspace", "capability-record-explorer", "capability-record-detail", "security-capability-hub"];
  const ui = files.map(file => read(`src/components/security/${file}.tsx`)).join("\n");
  assert.doesNotMatch(ui, /fetch\(|axios|localStorage|dangerouslySetInnerHTML|from "@\/(mocks|demo)\//);
  assert.doesNotMatch(ui, /onClick=\{[^}]*\b(isolate|remediate|quarantine|release|disable|restore|scan|deliver|save)/i);
  for (const token of ["sm:", "md:", "lg:", "xl:", "break-words", "focus-visible:", "motion-reduce:transition-none"]) assert.ok(ui.includes(token), token);
  assert.match(ui, /never verified monitoring totals/);
  assert.doesNotMatch(read("src/services/security-capabilities.ts"), /fetch\(|axios|\.reduce\(/);
});

test("equal names and severities sort by synthetic ID without mutating the input", () => {
  const base: CapabilityRecord = { id: "z", name: "Fictional same label", customerId: 1, customerName: "Demo Customer A", observation: "Fictional observation", source: "Simulated demo data", severity: "medium" };
  const input = [base, { ...base, id: "a" }];
  assert.deepEqual(filterCapabilityRecords(input, { ...resetCapabilityFilters(), sort: "severity" }).map(record => record.id), ["a", "z"]);
  assert.deepEqual(input.map(record => record.id), ["z", "a"]);
});
