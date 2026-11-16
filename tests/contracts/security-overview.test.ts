import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { securityCoverageSource, visibleSecurityCoverage } from "@/components/dashboard/security-coverage-view";
import { insightsSource, visibleInsights } from "@/components/dashboard/insights-view";
import { securitySeveritySource, visibleSecuritySeverity } from "@/components/dashboard/security-severity-view";
import {
  coverageBasis,
  securityOverviewMetrics,
  securityOverviewSources,
  securityOverviewStatus,
  type SecurityOverviewSources,
} from "@/components/security/security-overview-metrics";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { DEMO_ALL_CUSTOMER_INSIGHTS, DEMO_CUSTOMER_INSIGHTS } from "@/demo/insights";
import { DEMO_COVERAGE_BASIS } from "@/demo/security-coverage";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeInsights, getDemoInsights, getInsights } from "@/services/insights";
import { normalizeSecurityCoverage, getDemoSecurityCoverage, getSecurityCoverage } from "@/services/security-coverage";
import { normalizeSecuritySeverity, getDemoSecuritySeverity, getSecuritySeverity } from "@/services/security-severity";

const ROOT = path.resolve(import.meta.dirname, "../..");
const scopeFor = (customerId: number | null): DashboardScope =>
  customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };

// Loads through the same source selectors and normalizers the hooks use.
async function load(mode: DashboardMode, customerId: number | null): Promise<SecurityOverviewSources> {
  const scope = scopeFor(customerId);
  const [severity, coverage, insights] = await Promise.all([
    securitySeveritySource(mode)(scope),
    securityCoverageSource(mode)(scope),
    insightsSource(mode)(scope),
  ]);
  return {
    severity: normalizeSecuritySeverity(severity, scope),
    coverage: normalizeSecurityCoverage(coverage, scope),
    insights: normalizeInsights(insights, scope),
  };
}

const values = (sources: SecurityOverviewSources) =>
  securityOverviewMetrics(sources).map((m) => (m.value.kind === "value" ? m.value.value : m.value.kind));

const expected: [string, number | null, string[]][] = [
  ["All Customers", null, ["80", "4", "73.5%", "5"]],
  ["Demo Customer A", 1, ["24", "1", "88%", "3"]],
  ["Demo Customer B", 2, ["31", "2", "61%", "4"]],
  ["Demo Customer C", 3, ["25", "1", "70%", "3"]],
];

test("Security Overview shows exactly the four agreed metrics in order", async () => {
  const metrics = securityOverviewMetrics(await load("demo", null));
  assert.deepEqual(
    metrics.map((m) => m.label),
    ["Open Security Issues", "Critical Issues", "Security Coverage", "Security Insights"],
  );
});

for (const [name, customerId, figures] of expected) {
  test(`Demo Mode ${name} figures come from the existing validated sources`, async () => {
    const sources = await load("demo", customerId);
    assert.deepEqual(values(sources), figures);
    assert.equal(securityOverviewStatus(securityOverviewMetrics(sources), true), "simulated");
  });
}

test("the existing dashboard sources are reused, not duplicated", () => {
  assert.equal(securitySeveritySource("demo"), getDemoSecuritySeverity);
  assert.equal(securitySeveritySource("live"), getSecuritySeverity);
  assert.equal(securityCoverageSource("demo"), getDemoSecurityCoverage);
  assert.equal(securityCoverageSource("live"), getSecurityCoverage);
  assert.equal(insightsSource("demo"), getDemoInsights);
  assert.equal(insightsSource("live"), getInsights);
  const panel = fs.readFileSync(path.join(ROOT, "src/components/security/security-overview-panel.tsx"), "utf8");
  for (const hook of ["use-security-severity", "use-security-coverage", "use-insights"]) {
    assert.match(panel, new RegExp(`@/components/dashboard/${hook}`), hook);
  }
});

test("no demonstration fixtures or figures are duplicated in the Security module", () => {
  const files = [
    ...fs.readdirSync(path.join(ROOT, "src/components/security")).map((f) => `src/components/security/${f}`),
    "src/app/security/page.tsx",
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.doesNotMatch(source, /from "@\/(demo|mocks)\//, file);
    assert.doesNotMatch(source, /\b73\.5\b|\b(total|critical|percentage|coverage_percentage)\s*:\s*\d/, file);
  }
  assert.deepEqual(fs.readdirSync(path.join(ROOT, "src/demo")).sort(), [
    "backup-health.ts",
    "customer-overview.ts",
    "dashboard-assets.ts",
    "insights.ts",
    "security-coverage.ts",
    "security-detections.ts",
    "security-severity.ts",
  ]);
});

for (const customerId of [null, 1, 2, 3]) {
  test(`Live Mode shows no statistics and never zero (customer ${customerId ?? "all"})`, async () => {
    const sources = await load("live", customerId);
    const metrics = securityOverviewMetrics(sources);
    for (const metric of metrics) assert.deepEqual(metric.value, { kind: "unavailable", reason: "Not connected" }, metric.id);
    assert.equal(securityOverviewStatus(metrics, false), "not-connected");
    assert.equal(coverageBasis(sources.coverage), null);
    assert.deepEqual(securityOverviewSources(sources), []);
  });
}

test("Demo to Live clears every simulated figure immediately", async () => {
  const demo = await load("demo", 2);
  const sources: SecurityOverviewSources = {
    severity: visibleSecuritySeverity({ mode: "demo", customerId: 2, state: demo.severity }, "live", 2),
    coverage: visibleSecurityCoverage({ mode: "demo", customerId: 2, state: demo.coverage }, "live", 2),
    insights: visibleInsights({ mode: "demo", customerId: 2, state: demo.insights }, "live", 2),
  };
  const metrics = securityOverviewMetrics(sources);
  assert.ok(metrics.every((m) => m.value.kind === "loading"));
  assert.equal(coverageBasis(sources.coverage), null);
  assert.deepEqual(securityOverviewSources(sources), []);
});

test("figures loaded for another customer or scope are never shown", async () => {
  const forA = await load("demo", 1);
  for (const current of [null, 2, 3]) {
    const sources: SecurityOverviewSources = {
      severity: visibleSecuritySeverity({ mode: "demo", customerId: 1, state: forA.severity }, "demo", current),
      coverage: visibleSecurityCoverage({ mode: "demo", customerId: 1, state: forA.coverage }, "demo", current),
      insights: visibleInsights({ mode: "demo", customerId: 1, state: forA.insights }, "demo", current),
    };
    assert.ok(securityOverviewMetrics(sources).every((m) => m.value.kind === "loading"), String(current));
  }
});

test("rapid switching: an outdated response that arrives last is ignored", async () => {
  // A (slow) is requested, then B; A resolves after B. Only B may ever be visible while B is selected.
  const sequence = [1, 2, 3, null, 2];
  const loaded = await Promise.all(sequence.map((id) => load("demo", id)));
  const current = sequence.at(-1)!;
  for (const [index, id] of sequence.entries()) {
    const state = loaded[index];
    const sources: SecurityOverviewSources = {
      severity: visibleSecuritySeverity({ mode: "demo", customerId: id, state: state.severity }, "demo", current),
      coverage: visibleSecurityCoverage({ mode: "demo", customerId: id, state: state.coverage }, "demo", current),
      insights: visibleInsights({ mode: "demo", customerId: id, state: state.insights }, "demo", current),
    };
    const shown = values(sources);
    assert.deepEqual(shown, id === current ? ["31", "2", "61%", "4"] : ["loading", "loading", "loading", "loading"]);
  }
  // A response for the right customer but the wrong mode is also ignored.
  const live = await load("live", 2);
  assert.equal(visibleSecuritySeverity({ mode: "live", customerId: 2, state: live.severity }, "demo", 2).kind, "loading");
});

test("an unknown customer ID fails safely as an error, never as zero", async () => {
  const sources = await load("demo", 999);
  const metrics = securityOverviewMetrics(sources);
  for (const metric of metrics) assert.equal(metric.value.kind, "error", metric.id);
  assert.equal(securityOverviewStatus(metrics, true), "error");
  assert.equal(coverageBasis(sources.coverage), null);
});

test("missing and unavailable values stay unavailable without invented data", () => {
  const scope: DashboardScope = { type: "all" };
  const res = (data: Record<string, unknown>) => ({ data: { scope, source: "QA", ...data } });
  const sources: SecurityOverviewSources = {
    severity: normalizeSecuritySeverity(res({ status: "ready", counts: { critical: 0, high: 2, medium: 0, low: 0 } }), scope),
    coverage: normalizeSecurityCoverage(res({ status: "ready", coverage_percentage: null, controls: [{ key: "mdr", status: "covered" }] }), scope),
    insights: normalizeInsights(res({ status: "empty", insights: null }), scope),
  };
  const metrics = securityOverviewMetrics(sources);
  assert.deepEqual(metrics.map((m) => m.value), [
    { kind: "unavailable", reason: "Not reported" },
    { kind: "value", value: "0", stale: false },
    { kind: "unavailable", reason: "Not reported" },
    { kind: "unavailable", reason: "No data yet" },
  ]);
  assert.equal(securityOverviewStatus(metrics, false), "partial");

  const invalid = normalizeSecurityCoverage(res({ status: "ready", coverage_percentage: 140, coverage_basis: "x" }), scope);
  assert.equal(securityOverviewMetrics({ ...sources, coverage: invalid })[2].value.kind, "error");

  const stale = normalizeSecuritySeverity(res({ status: "stale", counts: { critical: 1, high: 0, medium: 0, low: 0 }, total: 1 }), scope);
  assert.deepEqual(securityOverviewMetrics({ ...sources, severity: stale })[0].value, { kind: "value", value: "1", stale: true });
});

test("one failing source leaves the other metrics intact", async () => {
  const sources = { ...(await load("demo", 3)), coverage: { kind: "error", message: "Coverage failed" } as const };
  assert.deepEqual(values(sources), ["25", "1", "error", "3"]);
  assert.equal(securityOverviewStatus(securityOverviewMetrics(sources), true), "partial");
});

test("coverage basis and source are preserved for every demo scope", async () => {
  for (const customerId of [null, 1, 2, 3]) {
    const sources = await load("demo", customerId);
    assert.equal(coverageBasis(sources.coverage), DEMO_COVERAGE_BASIS);
    assert.deepEqual(securityOverviewSources(sources), ["Simulated demo data"]);
  }
});

test("Security Insights counts the valid insight records for the scope", async () => {
  const fixtures: [number | null, number][] = [
    [null, DEMO_ALL_CUSTOMER_INSIGHTS.length],
    [1, DEMO_CUSTOMER_INSIGHTS.get(1)!.length],
    [2, DEMO_CUSTOMER_INSIGHTS.get(2)!.length],
    [3, DEMO_CUSTOMER_INSIGHTS.get(3)!.length],
  ];
  for (const [customerId, count] of fixtures) {
    assert.equal(values(await load("demo", customerId))[3], String(count));
  }
  const scope: DashboardScope = { type: "all" };
  const many = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, category: "tip", title: `T${i}`, summary: "S", source: null }));
  const state = normalizeInsights({ data: { scope, status: "ready", insights: many, source: null } }, scope);
  assert.equal(securityOverviewMetrics({ severity: { kind: "loading" }, coverage: { kind: "loading" }, insights: state })[3].value.kind, "value");
  assert.deepEqual(securityOverviewMetrics({ severity: { kind: "loading" }, coverage: { kind: "loading" }, insights: state })[3].value, {
    kind: "value",
    value: "60",
    stale: false,
  });
});

test("the main dashboard still renders its own panels from the same hooks", () => {
  const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");
  assert.match(read("src/components/dashboard/issues-by-severity-panel.tsx"), /useSecuritySeverity\(\)/);
  assert.match(read("src/components/dashboard/security-coverage-panel.tsx"), /useSecurityCoverage\(\)/);
  assert.match(read("src/components/dashboard/insights-panel.tsx"), /useInsights\(\)/);
  assert.match(read("src/app/page.tsx"), /<DashboardPanels \/>/);
  assert.doesNotMatch(read("src/app/page.tsx"), /security\//);
});
