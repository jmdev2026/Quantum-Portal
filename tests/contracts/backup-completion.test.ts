import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { getDemoBackupAssets, normalizeDemoBackupAssets } from "@/services/backup-assets";
import { getDemoBackupJobActivity, normalizeDemoBackupJobActivity } from "@/services/backup-job-activity";
import { getDemoBackupHealth, normalizeBackupHealth, FRESHNESS_BUCKETS, JOB_OUTCOMES } from "@/services/backup-health";
import { customersResponse } from "@/mocks/customers";
import { buildDemoBackupAssets } from "@/demo/backup-assets";
import { buildDemoBackupJobActivity } from "@/demo/backup-job-activity";
import { buildDemoBackupHealth } from "@/demo/backup-health";
import { emptyBackupFilters, updateBackupFilters, filterBackupExamples, visibleBackupExamples, selectBackupExample, BACKUP_OUTCOME_EXPLANATIONS, type LoadedBackupExamples, type BackupExample } from "@/components/backup/backup-explorer-view";
import { findActiveNavItem } from "@/components/sidebar/navigation";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const registry = customersResponse.data;
const all: DashboardScope = { type: "all" };
const assets = () => {
  const state = normalizeDemoBackupAssets(buildDemoBackupAssets(all), all, registry);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") throw new Error("Expected examples");
  return state.records;
};
const jobs = () => {
  const state = normalizeDemoBackupJobActivity(buildDemoBackupJobActivity(all), all, registry);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") throw new Error("Expected examples");
  return state.records;
};

test("F03 four routes, module navigation, nested sidebar and direct-entry wiring are concrete", () => {
  for (const route of ["backup", "backup/assets", "backup/jobs", "backup/recovery"]) {
    assert.ok(existsSync(new URL(`../../src/app/${route}/page.tsx`, import.meta.url)));
    assert.equal(findActiveNavItem(`/${route}`)?.id, "backup");
  }
  const navigation = read("src/components/backup/backup-navigation.tsx");
  for (const path of ["/backup", "/backup/assets", "/backup/jobs", "/backup/recovery", "/reports"]) assert.ok(navigation.includes(`href="${path}"`));
  assert.match(navigation, /aria-current/);
  assert.match(read("src/app/backup/page.tsx"), /<BackupNavigation/);
  assert.match(read("src/app/backup/assets/page.tsx"), /kind="assets"/);
  assert.match(read("src/app/backup/jobs/page.tsx"), /await searchParams/);
  assert.match(read("src/app/backup/recovery/page.tsx"), /<BackupRecoveryWorkspace/);
});

test("canonical protected/freshness/outcome summaries reconcile independently for All/A/B/C", async () => {
  const expected = [
    { scope: all, protected: 61, freshness: [4, 8, 28, 15, 6], outcomes: [48, 3, 5, 7] },
    { scope: { type: "customer", customer_id: 1 } as DashboardScope, protected: 18, freshness: [2, 3, 9, 3, 1], outcomes: [15, 1, 1, 2] },
    { scope: { type: "customer", customer_id: 2 } as DashboardScope, protected: 27, freshness: [1, 3, 11, 9, 3], outcomes: [20, 1, 3, 3] },
    { scope: { type: "customer", customer_id: 3 } as DashboardScope, protected: 16, freshness: [1, 2, 8, 3, 2], outcomes: [13, 1, 1, 2] },
  ];
  for (const entry of expected) {
    const state = normalizeBackupHealth(await getDemoBackupHealth(entry.scope), entry.scope);
    assert.equal(state.kind, "ready");
    if (state.kind !== "ready") throw new Error("Expected summary");
    assert.equal(state.protectedAssets, entry.protected);
    assert.deepEqual(FRESHNESS_BUCKETS.map(item => state.freshness?.[item.key]), entry.freshness);
    assert.deepEqual(JOB_OUTCOMES.map(item => state.jobOutcomes?.counts[item.key]), entry.outcomes);
    assert.equal(entry.freshness.reduce((a, b) => a + b, 0), entry.protected);
    assert.equal(state.jobOutcomes?.period, "last_24_hours");
    assert.equal(state.jobOutcomes?.basis, "job_executions");
    assert.equal(state.jobOutcomes?.windowStart, null);
    assert.equal(state.lastSyncedAt, null);
  }
  assert.equal(expected.slice(1).reduce((total, entry) => total + entry.protected, 0), 61);
  assert.equal(expected[0].outcomes.reduce((a, b) => a + b, 0), 63);
  for (let index = 0; index < 4; index++) assert.equal(expected.slice(1).reduce((total, entry) => total + entry.outcomes[index], 0), expected[0].outcomes[index]);
});

test("canonical sample records remain six All and two/customer through All/A/B/C/All service calls", async () => {
  for (const id of [null, 1, 2, 3, null]) {
    const scope: DashboardScope = id === null ? all : { type: "customer", customer_id: id };
    const [assetResponse, jobResponse] = await Promise.all([getDemoBackupAssets(scope), getDemoBackupJobActivity(scope)]);
    const assetState = normalizeDemoBackupAssets(assetResponse, scope, registry);
    const jobState = normalizeDemoBackupJobActivity(jobResponse, scope, registry);
    assert.equal(assetState.kind, "ready"); assert.equal(jobState.kind, "ready");
    if (assetState.kind !== "ready" || jobState.kind !== "ready") throw new Error("Expected records");
    assert.equal(assetState.records.length, id === null ? 6 : 2);
    assert.equal(jobState.records.length, id === null ? 6 : 2);
    for (const record of [...assetState.records, ...jobState.records]) {
      assert.equal(record.source, "Simulated demo data");
      assert.equal(registry.find(customer => customer.id === record.customerId)?.name, record.customerName);
      if (id !== null) assert.equal(record.customerId, id);
    }
  }
  assert.notEqual(assets().length, normalizeBackupHealth(buildDemoBackupHealth(all), all).kind === "ready" ? 61 : -1);
  assert.equal(jobs().filter(record => record.outcome === "not_available").length, 0);
});

test("asset search uses validated name/customer/observation/protection only with trimmed casefold and combined filters", () => {
  const records = assets();
  let filters = updateBackupFilters(emptyBackupFilters(), "search", "  customer b  ", "assets");
  filters = updateBackupFilters(filters, "status", "Not verified", "assets");
  assert.equal(filterBackupExamples(records, filters).length, 2);
  filters = updateBackupFilters(filters, "search", "WORKSTATION", "assets");
  assert.deepEqual(filterBackupExamples(records, filters).map(record => record.id), ["demo-backup-asset-a-02"]);
  filters = updateBackupFilters(filters, "search", "no such example", "assets");
  assert.equal(filterBackupExamples(records, filters).length, 0);
  assert.equal(filterBackupExamples(records, emptyBackupFilters()).length, 6);
});

test("job combined search/outcome filters operate only within provided scope and summary categories need not match examples", () => {
  const records = jobs();
  const scoped = records.filter(record => record.customerId === 2);
  let filters = updateBackupFilters(emptyBackupFilters(), "search", " CUSTOMER B ", "jobs");
  filters = updateBackupFilters(filters, "status", "successful", "jobs");
  assert.deepEqual(filterBackupExamples(scoped, filters).map(record => record.id), ["demo-backup-job-b-02"]);
  filters = updateBackupFilters(filters, "search", "Customer A", "jobs");
  assert.equal(filterBackupExamples(scoped, filters).length, 0);
  assert.equal(filterBackupExamples(records, updateBackupFilters(emptyBackupFilters(), "status", "not_available", "jobs")).length, 0);
  assert.equal(filterBackupExamples(scoped, emptyBackupFilters()).length, 2);
});

test("both explorers reject unsupported filter/sort values and bound search without date/category fabrication", () => {
  for (const kind of ["assets", "jobs"] as const) {
    const filters = emptyBackupFilters();
    assert.equal(updateBackupFilters(filters, "status", "healthy", kind), filters);
    assert.equal(updateBackupFilters(filters, "sort", "timestamp", kind), filters);
    assert.equal(updateBackupFilters(filters, "search", "x".repeat(250), kind).search.length, 200);
  }
  const source = read("src/components/backup/backup-explorer.tsx");
  assert.doesNotMatch(source, /type="date"|date.range|workload.*<select|freshness.*<select/i);
});

test("asset/job name, customer and status sorting is deterministic and source arrays are never mutated", () => {
  for (const records of [assets(), jobs()]) {
    const before = structuredClone(records);
    const ascending = filterBackupExamples(records, emptyBackupFilters());
    const descending = filterBackupExamples(records, { ...emptyBackupFilters(), sort: "name-desc" });
    assert.deepEqual(descending.map(record => record.id), ascending.map(record => record.id).reverse());
    for (const sort of ["customer", "status"]) assert.deepEqual(filterBackupExamples(records, { ...emptyBackupFilters(), sort }), filterBackupExamples([...records].reverse(), { ...emptyBackupFilters(), sort }));
    const repeated: BackupExample[] = [{ ...records[0], id: "z-tie" }, { ...records[0], id: "a-tie" }];
    assert.deepEqual(filterBackupExamples(repeated, emptyBackupFilters()).map(record => record.id), ["a-tie", "z-tie"]);
    assert.deepEqual(records, before);
  }
});

test("all asset/job examples select concrete details; missing or non-ready records cannot open details", () => {
  for (const records of [assets(), jobs()]) {
    for (const record of records) assert.equal(selectBackupExample({ kind: "ready", records }, record.id), record);
    assert.equal(selectBackupExample({ kind: "ready", records }, "unknown-example"), null);
  }
  for (const kind of ["loading", "unavailable"] as const) assert.equal(selectBackupExample({ kind }, "demo-backup-asset-a-01"), null);
  assert.equal(selectBackupExample({ kind: "error", message: "Unavailable" }, "demo-backup-job-a-01"), null);
});

test("native detail wiring supports modal/Escape/close/trigger and removed-trigger heading focus without operations", () => {
  const source = read("src/components/backup/backup-example-detail.tsx");
  for (const text of ["showModal()", "element?.close()", "trigger?.isConnected", "trigger.focus()", "backup-heading", "aria-labelledby", "aria-describedby", "onCancel", "event.preventDefault()", "max-h-[85dvh]", "overflow-y-auto", "RESTORE_UNAVAILABLE"]) assert.ok(source.includes(text), text);
  assert.match(source, /No validated asset-to-job relationship/);
  assert.match(source, /Execution timestamps, duration, size, retries and storage destination are unavailable/);
  assert.match(source, /backupOutcomeLabel\(record.outcome\)/);
  assert.doesNotMatch(source, /<button[^>]*>\s*(Restore|Recover|Run Backup|Retry Backup|Download)/);
});

test("Live, scope, retry, registry replacement and malformed ready records fail closed before details display", () => {
  for (const kind of ["assets", "jobs"] as const) {
    const state = kind === "assets" ? { kind: "ready" as const, records: assets() } : { kind: "ready" as const, records: jobs() };
    const loaded: LoadedBackupExamples = { kind, mode: "demo", customerId: null, registry, attempt: 0, state };
    assert.equal(visibleBackupExamples(loaded, kind, "demo", null, registry, 0).kind, "ready");
    assert.equal(visibleBackupExamples(loaded, kind, "live", null, registry, 0).kind, "unavailable");
    assert.equal(visibleBackupExamples(loaded, kind, "demo", 2, registry, 0).kind, "loading");
    assert.equal(visibleBackupExamples(loaded, kind, "demo", null, registry, 1).kind, "loading");
    assert.equal(visibleBackupExamples(loaded, kind, "demo", null, [...registry], 0).kind, "loading");
    assert.equal(visibleBackupExamples(loaded, kind, "demo", null, null, 0).kind, "loading");
    assert.equal(visibleBackupExamples(loaded, kind, "demo", 99, registry, 0).kind, "error");
    const scoped = { ...loaded, customerId: 2 };
    assert.equal(visibleBackupExamples(scoped, kind, "demo", 2, registry, 0).kind, "error");
    assert.equal(selectBackupExample(visibleBackupExamples(loaded, kind, "live", null, registry, 0), state.records[0].id), null);
  }
});

test("invalid/revoked/wrong-scope records and empty-success envelopes remain distinct at normalization boundaries", () => {
  const scope: DashboardScope = { type: "customer", customer_id: 99 };
  const a = buildDemoBackupAssets(all); const j = buildDemoBackupJobActivity(all);
  assert.equal(normalizeDemoBackupAssets(a, { type: "customer", customer_id: 2 }, registry).kind, "error");
  assert.equal(normalizeDemoBackupJobActivity(j, { type: "customer", customer_id: 2 }, registry).kind, "error");
  assert.equal(normalizeDemoBackupAssets(a, all, registry.slice(1)).kind, "error");
  assert.equal(normalizeDemoBackupJobActivity(j, all, registry.slice(1)).kind, "error");
  a.data.records = []; j.data.records = [];
  assert.deepEqual(normalizeDemoBackupAssets(a, all, registry), { kind: "ready", records: [] });
  assert.deepEqual(normalizeDemoBackupJobActivity(j, all, registry), { kind: "ready", records: [] });
  a.data.scope = scope; j.data.scope = scope;
  assert.equal(normalizeDemoBackupAssets(a, scope, registry).kind, "error");
  assert.equal(normalizeDemoBackupJobActivity(j, scope, registry).kind, "error");
});

test("new hook requests only Demo fixtures and cancellation/envelope gates protect late A responses from B/Live", async () => {
  const source = read("src/components/backup/use-backup-explorer.ts");
  assert.ok(source.indexOf('if (mode !== "demo")') < source.indexOf("getDemoBackupAssets(scope)"));
  for (const text of ["cancelled = true", "if (!cancelled) setLoaded", "registry.some", "visibleBackupExamples", "attempt", "contextKey"]) assert.ok(source.includes(text));
  const scope: DashboardScope = { type: "customer", customer_id: 1 };
  const response = await getDemoBackupAssets(scope);
  const loaded: LoadedBackupExamples = { kind: "assets", mode: "demo", customerId: 1, registry, attempt: 0, state: normalizeDemoBackupAssets(response, scope, registry) };
  assert.equal(visibleBackupExamples(loaded, "assets", "demo", 2, registry, 0).kind, "loading");
  assert.equal(visibleBackupExamples(loaded, "assets", "live", null, registry, 0).kind, "unavailable");
});

test("existing summary and preview hooks synchronously invalidate registry/revoked scope and preserve cancellation", () => {
  for (const path of ["src/components/dashboard/use-backup-health.ts", "src/components/backup/use-backup-assets.ts", "src/components/backup/use-backup-job-activity.ts"]) {
    const source = read(path);
    assert.match(source, /loaded.registry !==/);
    assert.match(source, /cancelled = true/);
    assert.match(source, /customerId !== null/);
  }
  const summary = read("src/components/dashboard/use-backup-health.ts");
  assert.match(summary, /loaded.attempt !== attempt/);
  assert.ok(summary.indexOf('if (mode !== "demo"') < summary.indexOf("backupHealthSource(mode)(scope)"));
  assert.match(summary, /mode === "live".*kind: "unavailable"/);
});

test("ready-only keyed explorer/preview content unmounts filters and details on context/retry changes", () => {
  const explorer = read("src/components/backup/backup-explorer.tsx");
  const previews = read("src/components/backup/backup-preview-actions.tsx");
  assert.match(explorer, /state.kind === "ready" \? <BackupExplorerContent key=/);
  assert.match(previews, /if \(state.kind !== "ready"\)/);
  assert.match(previews, /<PreviewActions key=\{contextKey\}/);
  assert.match(explorer, /setSelected\(null\); setFilters\(emptyBackupFilters\(\)\)/);
  assert.match(explorer, /const update =.*setSelected\(null\)/);
  assert.match(read("src/components/backup/backup-sections.tsx"), /BackupPreviewActions kind="assets"/);
  assert.match(read("src/components/backup/backup-sections.tsx"), /BackupPreviewActions kind="jobs"/);
});

test("freshness explanations remain summary-only and outcomes link to validated example filters, not recovery proof", () => {
  const source = read("src/components/backup/backup-summary-drilldowns.tsx");
  for (const text of ["FRESHNESS_BUCKETS.map", "JOB_OUTCOMES.map", "data.freshness?.[item.key]", "data.jobOutcomes?.counts[item.key]", "Asset examples contain no freshness field", "summary category", "not a live rolling feed", "/backup/jobs?outcome=", "backup-freshness-title", "backup-outcomes-title"]) assert.ok(source.includes(text), text);
  for (const outcome of JOB_OUTCOMES) assert.ok(BACKUP_OUTCOME_EXPLANATIONS[outcome.key].length > 60);
  assert.match(BACKUP_OUTCOME_EXPLANATIONS.successful, /does not verify/);
  assert.match(BACKUP_OUTCOME_EXPLANATIONS.not_available, /not automatically/);
});

test("responsive explorers provide semantic desktop/mobile records, bounded controls and explicit loading/error/empty/no-match/unavailable", () => {
  const source = read("src/components/backup/backup-explorer.tsx");
  for (const text of ['type="search"', "maxLength={200}", "<select", "Reset explorer", 'role="status"', 'role={state.kind === "error" ? "alert" : "status"}', "aria-live", "aria-busy", "scope=\"row\"", "<caption", "lg:hidden", "hidden overflow-x-auto lg:block", "No example records match", "No fictional examples", "Retry examples", "No live asset inventory"]) assert.ok(source.includes(text), text);
  assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
  assert.match(source, /filterBackupExamples\(records, filters\)/);
});

test("recovery route supplies all seven readiness/process questions, exact limitation, honest Help and no fake actions", () => {
  const source = read("src/components/backup/backup-recovery-workspace.tsx");
  for (const text of ["Recovery & Restore Information", "Recovery Capability Overview", "Backup vs. Restore", "Recovery Readiness Checklist", "Future Recovery Process Information", "Requesting Recovery Assistance", "Provider Integration Limitations", "Recovery Reporting Requirements", "RESTORE_UNAVAILABLE", "no item is checked", "No verified Quantum Shield support contact", "<PortalHelp", "Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup"]) assert.ok(source.includes(text), text);
  assert.equal((source.match(/<li>/g) ?? []).length, 14);
  assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
  assert.doesNotMatch(source, /<button|type="checkbox"|useState|fetch\(|getDemo|Ready to Restore/);
  assert.ok(read("src/components/backup/recovery-information-view.ts").includes("Restore operations are not available in Quantum Shield Command."));
});

test("no F03 record schema invents timestamps, recovery points, policy metadata or asset/job associations", () => {
  for (const record of [...assets(), ...jobs()]) {
    assert.doesNotMatch(Object.keys(record).join(" "), /timestamp|created_at|backup_at|asset_id|job_id|workload|duration|size|snapshot|restore|retention|storage|encryption|policy|rto|rpo/i);
  }
  for (const path of ["src/components/backup/backup-explorer.tsx", "src/components/backup/backup-preview-actions.tsx", "src/components/backup/backup-recovery-workspace.tsx", "src/components/backup/use-backup-explorer.ts"]) assert.doesNotMatch(read(path), /fetch\(|axios|localStorage|sessionStorage|dangerouslySetInnerHTML|window.open|supabase/);
});

test("Dashboard anchor remains real and Reports links do not claim auto-selected report/export delivery", () => {
  assert.ok(read("src/components/dashboard/backup-health-panel.tsx").includes("/backup#backup-overview-title"));
  assert.match(read("src/components/backup/backup-section-frame.tsx"), /\$\{id\}-title/);
  const reports = read("src/components/reports/reports-workspace.tsx");
  assert.ok(reports.includes("Backup & Recovery Report"));
  assert.match(reports, /useState.*REPORT_TYPES\[0\]/);
  assert.match(read("src/components/backup/backup-recovery-workspace.tsx"), /does not preselect a report/);
});
