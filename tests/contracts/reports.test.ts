import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { navSections, isNavItemActive } from "@/components/sidebar/navigation";
import { getDemoAssetSummary, normalizeAssetSummary } from "@/services/dashboard-assets";
import { getDemoBackupHealth, normalizeBackupHealth } from "@/services/backup-health";
import { getDemoSecuritySeverity, normalizeSecuritySeverity } from "@/services/security-severity";
import { getDemoSecurityCoverage, normalizeSecurityCoverage } from "@/services/security-coverage";
import { getDemoInsights, normalizeInsights } from "@/services/insights";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import type { DashboardScope } from "@/services/dashboard-response";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const workspace = read("src/components/reports/reports-workspace.tsx");
const executive = read("src/components/reports/executive-summary.tsx");

test("Reports route, title and enabled navigation preserve planned governance items", () => {
  assert.match(read("src/app/reports/page.tsx"), /Reports · Quantum Shield Command/);
  const items = navSections.flatMap(s => s.items);
  const reports = items.find(i => i.id === "reports")!;
  assert.equal(reports.href, "/reports");
  assert.ok(isNavItemActive(reports, "/reports"));
  assert.equal(isNavItemActive(reports, "/customers"), false);
  assert.equal(isNavItemActive(reports, "/reports/history"), false);
  for (const id of ["administration"]) assert.equal(items.find(i => i.id === id)?.href, "/administration");
});

test("report selection is local, single-select and keyboard-native", () => {
  for (const label of ["Executive Summary", "Cybersecurity Report", "Backup & Recovery Report"]) assert.match(workspace, new RegExp(label));
  assert.match(workspace, /aria-pressed=\{selected === report\}/);
  assert.match(workspace, /onClick=\{\(\) => setSelected\(report\)\}/);
  assert.doesNotMatch(workspace, /selectCustomer|selectAll|setMode/);
});

test("Reports reuse gated source hooks and approved detailed sections", () => {
  for (const hook of ["useAssetSummary", "useBackupHealth", "useSecuritySeverity", "useSecurityCoverage", "useInsights"]) assert.match(executive, new RegExp(hook));
  for (const panel of ["IssuesBySeverityPanel", "SecurityCoveragePanel", "SecurityControlsPanel", "InsightsPanel", "BackupOverviewPanel"]) assert.match(workspace, new RegExp(panel));
  assert.doesNotMatch(workspace + executive, /fetch\(|axios|\/api\/reports|visibility-records|backup-job-activity/);
  assert.match(workspace, /Customer scope unavailable/);
  assert.match(workspace, /Reporting integrations are not connected/);
});

for (const [id, users, devices, issues, critical, coverage, insights, assets, successful, freshness, outcomes] of [
  [null,146,83,80,4,"73.5%",5,61,48,[4,8,28,15,6],[48,3,5,7]],
  [1,62,35,24,1,"88%",3,18,15,[2,3,9,3,1],[15,1,1,2]],
  [2,48,27,31,2,"61%",4,27,20,[1,3,11,9,3],[20,1,3,3]],
  [3,36,21,25,1,"70%",3,16,13,[1,2,8,3,2],[13,1,1,2]],
] as const) test(`validated report sources preserve figures for ${id ?? "All"}`, async () => {
  const scope: DashboardScope = id === null ? { type: "all" } : { type: "customer", customer_id: id };
  const [a,b,s,c,i] = await Promise.all([getDemoAssetSummary(scope),getDemoBackupHealth(scope),getDemoSecuritySeverity(scope),getDemoSecurityCoverage(scope),getDemoInsights(scope)]);
  const asset = normalizeAssetSummary(a,scope);
  assert.ok(asset.ok);
  if (asset.ok) for (const [key,value] of [["users",users],["devices",devices]] as const) {
    const m = asset.metrics[key]; assert.ok(m.kind === "ready" && m.value === value);
  }
  const metrics = securityOverviewMetrics({severity:normalizeSecuritySeverity(s,scope),coverage:normalizeSecurityCoverage(c,scope),insights:normalizeInsights(i,scope)});
  assert.deepEqual(metrics.map(m => m.value.kind === "value" ? m.value.value : null), [String(issues),String(critical),coverage,String(insights)]);
  const backup = normalizeBackupHealth(b,scope);
  assert.equal(backup.kind,"ready");
  if (backup.kind === "ready") {
    assert.equal(backup.protectedAssets,assets);
    assert.deepEqual(Object.values(backup.freshness!),freshness);
    assert.deepEqual(Object.values(backup.jobOutcomes!.counts),outcomes);
    assert.equal(backup.jobOutcomes!.counts.successful,successful);
    assert.equal(backup.jobOutcomes!.basis,"job_executions");
    assert.equal(backup.jobOutcomes!.period,"last_24_hours");
  }
  assert.equal(normalizeBackupHealth(b,{type:"customer",customer_id:999}).kind,"error");
});

test("reports remain read-only with accurate limitations and no synthetic history", () => {
  assert.match(workspace,/RESTORE_UNAVAILABLE/);
  assert.match(workspace,/No verified recovery points/);
  assert.match(workspace,/illustrative/);
  assert.doesNotMatch(workspace + executive,/download|schedule|send email|success rate|risk score|new Date\(|report_id/i);
});
