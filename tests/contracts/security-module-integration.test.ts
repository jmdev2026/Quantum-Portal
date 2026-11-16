import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customersResponse } from "@/mocks/customers";
import { getDemoSecurityCoverage, getSecurityCoverage, normalizeSecurityCoverage } from "@/services/security-coverage";
import { getDemoSecuritySeverity, getSecuritySeverity, normalizeSecuritySeverity } from "@/services/security-severity";
import { getDemoInsights, getInsights, normalizeInsights } from "@/services/insights";
import { getDemoSecurityDetections, normalizeDemoSecurityDetections } from "@/services/security-detections";
import { getDemoVisibilityRecords, normalizeDemoVisibilityRecords } from "@/services/security-visibility-records";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import { visibleDetections } from "@/components/security/threats-detections-view";
import { visibleVisibilityRecords } from "@/components/security/identities-endpoints-view";
import { securityControlsView } from "@/components/security/security-controls-view";
import { findActiveNavItem } from "@/components/sidebar/navigation";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const customers = customersResponse.data;
const scopeOf = (id: number | null): DashboardScope => (id === null ? { type: "all" } : { type: "customer", customer_id: id });
const VIEWS = [
  { id: null, open: "80", critical: "4", coverage: "73.5%", insights: "5" },
  { id: 1, open: "24", critical: "1", coverage: "88%", insights: "3" },
  { id: 2, open: "31", critical: "2", coverage: "61%", insights: "4" },
  { id: 3, open: "25", critical: "1", coverage: "70%", insights: "3" },
] as const;

async function demoModule(id: number | null) {
  const scope = scopeOf(id);
  const [severity, coverage, insights, detections, identities, endpoints] = await Promise.all([
    getDemoSecuritySeverity(scope).then((r) => normalizeSecuritySeverity(r, scope)),
    getDemoSecurityCoverage(scope).then((r) => normalizeSecurityCoverage(r, scope)),
    getDemoInsights(scope).then((r) => normalizeInsights(r, scope)),
    getDemoSecurityDetections(scope).then((r) => normalizeDemoSecurityDetections(r, scope, customers)),
    getDemoVisibilityRecords("identities", scope).then((r) => normalizeDemoVisibilityRecords(r, "identities", scope, customers)),
    getDemoVisibilityRecords("endpoints", scope).then((r) => normalizeDemoVisibilityRecords(r, "endpoints", scope, customers)),
  ]);
  return { severity, coverage, insights, detections, identities, endpoints };
}

test("every Security section stays on the same customer scope for each demo view", async () => {
  for (const view of VIEWS) {
    const m = await demoModule(view.id);
    const metrics = securityOverviewMetrics(m).map((x) => (x.value.kind === "value" ? x.value.value : x.value.kind));
    assert.deepEqual(metrics, [view.open, view.critical, view.coverage, view.insights], String(view.id));
    assert.equal(m.detections.kind, "ready");
    assert.equal(m.identities.kind, "ready");
    assert.equal(m.endpoints.kind, "ready");
    if (m.detections.kind !== "ready" || m.identities.kind !== "ready" || m.endpoints.kind !== "ready") return;
    const expected = view.id === null ? 6 : 2;
    for (const rows of [m.detections.detections, m.identities.records, m.endpoints.records]) {
      assert.equal(rows.length, expected, String(view.id));
      if (view.id !== null) assert.ok(rows.every((r) => r.customerId === view.id), String(view.id));
    }
    assert.ok(securityControlsView(m.coverage, true, "Scope").rows.every((r) => r.value.kind === "status"));
  }
});

test("Overview totals are reported values, not counts of the sample rows", async () => {
  for (const view of VIEWS) {
    const m = await demoModule(view.id);
    if (m.detections.kind !== "ready" || m.identities.kind !== "ready" || m.endpoints.kind !== "ready") return;
    const rows = m.detections.detections;
    assert.notEqual(Number(view.open), rows.length, String(view.id));
    assert.notEqual(Number(view.open), m.identities.records.length + m.endpoints.records.length, String(view.id));
    if (view.id === null) assert.notEqual(Number(view.critical), rows.filter((d) => d.severity === "critical").length);
  }
});

test("Live Mode exposes no synthetic content in any Security section", async () => {
  const loaded = await demoModule(2);
  assert.equal(visibleDetections({ mode: "demo", customerId: 2, state: loaded.detections }, "live", 2).kind, "unavailable");
  assert.equal(visibleVisibilityRecords({ mode: "demo", customerId: 2, state: loaded.identities }, "live", 2).kind, "unavailable");
  for (const id of [null, 1, 2, 3]) {
    const scope = scopeOf(id);
    const live = {
      severity: normalizeSecuritySeverity(await getSecuritySeverity(scope), scope),
      coverage: normalizeSecurityCoverage(await getSecurityCoverage(scope), scope),
      insights: normalizeInsights(await getInsights(scope), scope),
    };
    assert.ok(securityOverviewMetrics(live).every((m) => m.value.kind === "unavailable"), String(id));
    assert.ok(securityControlsView(live.coverage, false, "Scope").rows.every((r) => r.value.kind === "placeholder"));
  }
});

test("an unknown customer fails safely in every Security section", async () => {
  const m = await demoModule(999);
  for (const [name, state] of Object.entries(m)) assert.equal(state.kind, "error", name);
});

test("Security copy makes no protection claim and read-only rows are not styled as interactive", () => {
  const files = ["security-intro", "security-overview-panel", "threats-detections-panel", "detection-feed", "identities-endpoints-panel", "visibility-area-card", "security-controls-panel"];
  for (const file of files) {
    const source = read(`src/components/security/${file}.tsx`);
    assert.doesNotMatch(source, /\bprotected (identities|endpoints|accounts|devices)\b/i, file);
    assert.doesNotMatch(source, /<li[^>]*hover:bg/, file);
  }
});

test("/security is a direct route that the sidebar resolves", () => {
  assert.match(read("src/app/security/page.tsx"), /<SecuritySections \/>/);
  assert.equal(findActiveNavItem("/security")?.href, "/security");
});
