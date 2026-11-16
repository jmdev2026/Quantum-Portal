import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDemoSecurityCoverage, DEMO_ALL_CUSTOMER_COVERAGE, DEMO_COVERAGE_SOURCE, DEMO_CUSTOMER_COVERAGE } from "@/demo/security-coverage";
import { buildUnavailableSecurityCoverage } from "@/mocks/security-coverage";
import { buildDemoSecurityDetections } from "@/demo/security-detections";
import { buildDemoSecurityIdentities } from "@/demo/security-identities";
import { buildDemoSecurityEndpoints } from "@/demo/security-endpoints";
import { DEMO_ALL_CUSTOMER_SEVERITY, DEMO_CUSTOMER_SEVERITY } from "@/demo/security-severity";
import { normalizeSecurityCoverage, SECURITY_CONTROLS, type SecurityCoverageState } from "@/services/security-coverage";
import { visibleSecurityCoverage, type LoadedSecurityCoverage } from "@/components/dashboard/security-coverage-view";
import { SECURITY_SECTIONS } from "@/components/security/security-overview-view";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import {
  CONTROL_STATUS_LABELS,
  SIMULATED_CONTROLS_EXPLANATION,
  SIMULATED_STATUS_MEANINGS,
  securityControlsView,
  type SecurityControlsView,
} from "@/components/security/security-controls-view";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const panelSource = read("src/components/security/security-controls-panel.tsx");
const viewSource = read("src/components/security/security-controls-view.ts");
const sectionsSource = read("src/components/security/security-sections.tsx");
const dashboardPanelSource = read("src/components/dashboard/security-coverage-panel.tsx");
const ui = panelSource + viewSource;
const code = (source: string) => source.replace(/^\s*(import .*|\/\/.*)$/gm, "");

const ALL = { type: "all" } as const;
const scopeOf = (id: number | null): DashboardScope => (id === null ? ALL : { type: "customer", customer_id: id });
const KEYS = SECURITY_CONTROLS.map((c) => c.key);
const LABEL = { covered: "Covered", needs_attention: "Needs Attention", unknown: "Unknown" } as const;

const demoView = (id: number | null, scopeLabel = "Scope") =>
  securityControlsView(normalizeSecurityCoverage(buildDemoSecurityCoverage(scopeOf(id)), scopeOf(id)), true, scopeLabel);
const liveView = (id: number | null) =>
  securityControlsView(normalizeSecurityCoverage(buildUnavailableSecurityCoverage(scopeOf(id)), scopeOf(id)), false, "Scope");
const statuses = (view: SecurityControlsView) =>
  Object.fromEntries(view.rows.map((r) => [r.key, r.value.kind === "status" ? r.value.label : r.value.kind]));
const expectedFor = (id: number | null) => {
  const fixture = id === null ? DEMO_ALL_CUSTOMER_COVERAGE : DEMO_CUSTOMER_COVERAGE.get(id)!;
  return Object.fromEntries(KEYS.map((k) => [k, LABEL[fixture.controls[k]]]));
};
const validResponse = (scope: DashboardScope = ALL) => structuredClone(buildDemoSecurityCoverage(scope));
const viewCopy = (view: SecurityControlsView) => [view.badge, view.announcement, ...(view.message ? Object.values(view.message) : []), ...view.rows.flatMap((r) => [r.label, "label" in r.value ? r.value.label : ""])];

test("all nine controls display in canonical order with canonical names", () => {
  for (const view of [demoView(null), demoView(1), liveView(null)]) {
    assert.equal(view.rows.length, 9);
    assert.deepEqual(view.rows.map((r) => r.label), SECURITY_CONTROLS.map((c) => c.label));
  }
  assert.deepEqual(demoView(null).rows.filter((r) => r.abbreviation).map((r) => r.abbreviation), ["MDR", "ITDR"]);
});

test("canonical control keys are reused", () => {
  assert.deepEqual(demoView(2).rows.map((r) => r.key), KEYS);
  assert.match(viewSource, /SECURITY_CONTROLS\.map/);
  for (const key of KEYS) assert.match(panelSource, new RegExp(`\\b${key}:`), key);
});

test("control definitions are not duplicated", () => {
  for (const { label } of SECURITY_CONTROLS) {
    assert.doesNotMatch(ui, new RegExp(label.replace(/[&]/g, "\\&")), label);
  }
  assert.doesNotMatch(ui, /"MDR"|"ITDR"/);
});

test("All Customers statuses match the explicit fixture", () => {
  assert.deepEqual(statuses(demoView(null)), expectedFor(null));
  assert.equal(statuses(demoView(null)).mdr, "Covered");
  assert.equal(statuses(demoView(null)).itdr, "Needs Attention");
  assert.equal(statuses(demoView(null)).external_footprint_scan, "Unknown");
});

test("Demo Customer A statuses match the fixture", () => {
  assert.deepEqual(statuses(demoView(1)), expectedFor(1));
  assert.equal(Object.values(statuses(demoView(1))).filter((s) => s === "Covered").length, 8);
  assert.equal(statuses(demoView(1)).phishing_simulations, "Needs Attention");
});

test("Demo Customer B statuses match the fixture", () => {
  assert.deepEqual(statuses(demoView(2)), expectedFor(2));
  assert.equal(statuses(demoView(2)).cloud_data_protection, "Unknown");
  assert.equal(statuses(demoView(2)).itdr, "Needs Attention");
});

test("Demo Customer C statuses match the fixture", () => {
  assert.deepEqual(statuses(demoView(3)), expectedFor(3));
  assert.equal(statuses(demoView(3)).dark_web_monitoring, "Covered");
  assert.equal(statuses(demoView(3)).external_footprint_scan, "Unknown");
});

test("the existing coverage service, hook and fixtures are reused", () => {
  assert.match(panelSource, /from "@\/components\/dashboard\/use-security-coverage"/);
  assert.match(panelSource, /useSecurityCoverage\(\)/);
  assert.doesNotMatch(ui, /@\/(demo|mocks)\//);
  assert.doesNotMatch(ui, /getDemoSecurityCoverage|getSecurityCoverage|normalizeSecurityCoverage|fetch\(|axios/);
});

test("no new calculations or scores are introduced", () => {
  assert.doesNotMatch(code(ui), /\bpercentage\b|formatCoveragePercentage|coverage\.|reduce\(|Math\.|\bscore\b/i);
  assert.doesNotMatch(code(viewSource), /\d/);
  for (const view of [demoView(null), demoView(1), liveView(2)]) {
    for (const text of viewCopy(view)) assert.doesNotMatch(text, /\d|%/, text);
  }
});

test("statuses are never inferred from issues, detections, identities, endpoints or insights", () => {
  assert.doesNotMatch(code(ui), /severity|detection|identit|endpoint(?!_security)|insight|issue/i);
  const state = normalizeSecurityCoverage(validResponse(), ALL);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") return;
  const view = securityControlsView({ ...state, coverage: null }, true, "Scope");
  assert.deepEqual(statuses(view), expectedFor(null));
});

test("Demo Mode is labelled simulated with the required source and explanation", () => {
  const view = demoView(null);
  assert.equal(view.status, "simulated");
  assert.equal(view.badge, "Simulated");
  assert.equal(view.source, DEMO_COVERAGE_SOURCE);
  assert.equal(view.lastSyncedAt, null);
  assert.equal(
    SIMULATED_CONTROLS_EXPLANATION,
    "Control statuses are simulated examples. They do not represent verified Guardz protection, configuration or security effectiveness.",
  );
  assert.deepEqual(SIMULATED_STATUS_MEANINGS.map((m) => m.status), ["covered", "needs_attention", "unknown"]);
  assert.match(SIMULATED_STATUS_MEANINGS[0].meaning, /does not establish that protection is active or effective/);
  assert.match(SIMULATED_STATUS_MEANINGS[1].meaning, /not a verified security incident/);
  assert.match(SIMULATED_STATUS_MEANINGS[2].meaning, /does not mean healthy or unhealthy/);
  assert.equal((panelSource.match(/data-simulated\b/g) ?? []).length, 1);
  assert.match(panelSource, /Simulated status: /);
});

test("Live Mode shows every control as not connected with no statuses or sync", () => {
  for (const id of [null, 1, 2, 3]) {
    const view = liveView(id);
    assert.equal(view.status, "not-connected");
    assert.equal(view.badge, "Not connected");
    assert.equal(view.source, null);
    assert.equal(view.lastSyncedAt, null);
    assert.ok(view.rows.every((r) => r.value.kind === "placeholder" && r.value.label === "Not connected"));
    for (const text of viewCopy(view)) assert.doesNotMatch(text, /\bCovered\b|healthy|protected|\b0\b|synced/i, text);
  }
});

test("Demo Mode is populated for every demo view", () => {
  for (const id of [null, 1, 2, 3]) {
    assert.ok(demoView(id).rows.every((r) => r.value.kind === "status"), String(id));
    assert.equal(demoView(id).message, null);
  }
});

test("switching Demo to Live clears simulated statuses immediately", () => {
  const demoLoaded: LoadedSecurityCoverage = { mode: "demo", customerId: null, state: normalizeSecurityCoverage(validResponse(), ALL) };
  const visible = visibleSecurityCoverage(demoLoaded, "live", null);
  assert.equal(visible.kind, "loading");
  const view = securityControlsView(visible, false, "All Customers");
  assert.ok(view.rows.every((r) => r.value.kind === "loading"));
  assert.ok(viewCopy(view).every((t) => !/Covered|Needs Attention/.test(t)));
});

test("scope isolation hides statuses loaded for another customer", () => {
  const ids = [null, 1, 2, 3] as const;
  for (const from of ids) {
    const loaded: LoadedSecurityCoverage = { mode: "demo", customerId: from, state: normalizeSecurityCoverage(validResponse(scopeOf(from)), scopeOf(from)) };
    for (const to of ids) {
      const state = visibleSecurityCoverage(loaded, "demo", to);
      assert.equal(state.kind, from === to ? "ready" : "loading", `${from}->${to}`);
    }
  }
  assert.match(read("src/components/dashboard/use-security-coverage.ts"), /cancelled/);
});

test("unknown customer IDs are rejected without borrowing another customer's statuses", () => {
  const view = demoView(999);
  assert.equal(view.status, "error");
  assert.equal(view.message?.body, "No demonstration data exists for this customer.");
  assert.ok(view.rows.every((r) => r.value.kind === "placeholder" && r.value.label === "Unavailable"));
});

test("wrong-scope responses are rejected", () => {
  const state = normalizeSecurityCoverage(validResponse(scopeOf(1)), scopeOf(2));
  assert.deepEqual(state, { kind: "error", message: "Coverage data did not match the selected customer view." });
  assert.equal(normalizeSecurityCoverage(validResponse(ALL), scopeOf(1)).kind, "error");
});

test("duplicate controls are rejected", () => {
  const response = validResponse();
  response.data.controls!.push({ ...response.data.controls![0] });
  assert.deepEqual(normalizeSecurityCoverage(response, ALL), { kind: "error", message: "Received invalid security control statuses." });
});

test("invalid statuses and unknown control keys are rejected", () => {
  for (const mutate of [
    (r: ReturnType<typeof validResponse>) => ((r.data.controls![0] as { status: string }).status = "active"),
    (r: ReturnType<typeof validResponse>) => ((r.data.controls![0] as { key: string }).key = "firewall"),
  ]) {
    const response = validResponse();
    mutate(response);
    const state = normalizeSecurityCoverage(response, ALL);
    assert.equal(state.kind, "error");
    assert.equal(securityControlsView(state, true, "Scope").status, "error");
  }
});

test("loading and error states have dedicated presentation", () => {
  const loading = securityControlsView({ kind: "loading" }, true, "Demo Customer B");
  assert.equal(loading.badge, "Loading");
  assert.match(loading.announcement, /Demo Customer B/);
  const error: SecurityCoverageState = { kind: "error", message: "Coverage could not be loaded." };
  const view = securityControlsView(error, true, "All Customers");
  assert.equal(view.badge, "Unavailable");
  assert.equal(view.message?.body, "Coverage could not be loaded.");
  assert.match(panelSource, /role=\{status === "error" \? "alert"/);
  assert.match(panelSource, /aria-busy/);
  assert.match(panelSource, /role="status"/);
});

test("Security Controls spans the full content width", () => {
  assert.match(panelSource, /md:col-span-2/);
  assert.match(sectionsSource, /section\.id === "security-controls"\) return <SecurityControlsPanel/);
  assert.match(sectionsSource, /grid gap-6 md:grid-cols-2/);
  assert.match(panelSource, /grid-cols-1[^"]*@xl:grid-cols-2[^"]*@3xl:grid-cols-3/);
  assert.equal(SECURITY_SECTIONS.find((s) => s.id === "security-controls")!.description, "Review security control reporting and visibility for the selected customer.");
});

test("Security Overview values are unchanged", () => {
  assert.equal(DEMO_ALL_CUSTOMER_SEVERITY.total, 80);
  assert.equal(DEMO_ALL_CUSTOMER_SEVERITY.counts.critical, 4);
  assert.deepEqual([...DEMO_CUSTOMER_SEVERITY.values()].map((s) => [s.total, s.counts.critical]), [[24, 1], [31, 2], [25, 1]]);
  const loading = { kind: "loading" } as const;
  assert.deepEqual(
    securityOverviewMetrics({ severity: loading, coverage: loading, insights: loading }).map((m) => m.label),
    ["Open Security Issues", "Critical Issues", "Security Coverage", "Security Insights"],
  );
});

test("the six demonstration detections are unchanged", () => {
  const detections = buildDemoSecurityDetections(ALL).data.detections!;
  assert.equal(detections.length, 6);
  assert.deepEqual(detections.map((d) => d.customer.id).sort(), [1, 1, 2, 2, 3, 3]);
});

test("the six identities and six endpoints are unchanged", () => {
  const ids = buildDemoSecurityIdentities(ALL).data.records!;
  const eps = buildDemoSecurityEndpoints(ALL).data.records!;
  assert.equal(ids.length, 6);
  assert.equal(eps.length, 6);
  assert.ok(ids.every((r) => r.id.startsWith("demo-identity-")));
  assert.ok(eps.every((r) => r.id.startsWith("demo-endpoint-")));
});

test("main dashboard Security Coverage keeps its statuses, percentages and labels", () => {
  assert.deepEqual([DEMO_ALL_CUSTOMER_COVERAGE.percentage, ...[...DEMO_CUSTOMER_COVERAGE.values()].map((c) => c.percentage)], [73.5, 88, 61, 70]);
  assert.match(dashboardPanelSource, /Needs attention/);
  assert.match(dashboardPanelSource, /useSecurityCoverage/);
  assert.doesNotMatch(dashboardPanelSource, /security-controls-view/);
  assert.equal(CONTROL_STATUS_LABELS.needs_attention, "Needs Attention");
});

test("no operational controls, links or provider actions are introduced", () => {
  assert.doesNotMatch(panelSource, /<button|<a\s|<Link|href=|onClick|role="button"|cursor-pointer|tabIndex|<input|<select|<form/);
  assert.doesNotMatch(code(ui), /toggle|enable|disable|configure|remediat|isolat|quarantin|enrol|launch|trigger|scan now|portal|credential|api[_ ]?key|guardz\.com/i);
  assert.doesNotMatch(panelSource, /hover:bg|hover:text|group-hover/);
});
