import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { findActiveNavItem, isNavItemActive, navSections } from "@/components/sidebar/navigation";
import {
  BACKUP_DEMO_PAGE_NOTICE,
  BACKUP_LIVE_NOTICE,
  BACKUP_PROVIDER_NAME,
  BACKUP_SECTIONS,
  backupAnnouncement,
} from "@/components/backup/backup-view";
import { JOB_ACTIVITY_PLANNED, jobActivityView } from "@/components/backup/backup-job-activity-view";
import { PROTECTED_ASSETS_PLANNED, protectedAssetsView } from "@/components/backup/protected-assets-view";
import { RESTORE_UNAVAILABLE, recoveryInformation } from "@/components/backup/recovery-information-view";
import { SECURITY_SECTIONS } from "@/components/security/security-overview-view";
import { getBackupHealth, getDemoBackupHealth, normalizeBackupHealth } from "@/services/backup-health";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const items = navSections.flatMap((section) => section.items);
const byId = (id: string) => items.find((item) => item.id === id)!;
const BACKUP_UI = [
  "src/app/backup/page.tsx",
  "src/components/backup/backup-intro.tsx",
  "src/components/backup/backup-sections.tsx",
  "src/components/backup/backup-section-frame.tsx",
  "src/components/backup/backup-overview-panel.tsx",
  "src/components/backup/protected-assets-panel.tsx",
  "src/components/backup/backup-job-activity-panel.tsx",
  "src/components/backup/recovery-information-panel.tsx",
];
const ui = BACKUP_UI.map(read).join("\n");
const viewSource = [
  "src/components/backup/backup-view.ts",
  "src/components/backup/backup-overview-view.ts",
  "src/components/backup/protected-assets-view.ts",
  "src/components/backup/use-backup-assets.ts",
  "src/components/backup/backup-job-activity-view.ts",
  "src/components/backup/use-backup-job-activity.ts",
  "src/components/backup/recovery-information-view.ts",
].map(read).join("\n");
const unavailableCopy = (scope: string) => {
  const jobs = jobActivityView({ kind: "unavailable" }, scope);
  const assets = protectedAssetsView({ kind: "unavailable" }, scope);
  return [jobs, assets].flatMap((view) => (view.status === "simulated" ? [] : [view.badge, view.title, view.body]));
};
const SCOPES = ["All Customers", "Demo Customer A", "Demo Customer B", "Demo Customer C"];
const allCopy = (scope: string) => [
  BACKUP_LIVE_NOTICE,
  BACKUP_DEMO_PAGE_NOTICE,
  ...BACKUP_SECTIONS.flatMap((s) => [s.title, s.description]),
  ...JOB_ACTIVITY_PLANNED,
  ...PROTECTED_ASSETS_PLANNED,
  ...unavailableCopy(scope),
  ...(["live", "demo"] as const).flatMap((m) => {
    const info = recoveryInformation(m, scope);
    return [info.badge, ...info.areas.flatMap((a) => [a.title, a.status, a.body]), backupAnnouncement(m, scope)];
  }),
];

test("/backup route exists with page metadata and the Backup & Recovery heading", () => {
  assert.ok(existsSync(new URL("../../src/app/backup/page.tsx", import.meta.url)));
  const page = read("src/app/backup/page.tsx");
  assert.match(page, /export const metadata/);
  assert.match(page, /Backup & Recovery · Quantum Shield Command/);
  assert.match(read("src/components/backup/backup-intro.tsx"), /Backup &amp; Recovery/);
  assert.match(ui, /Visibility into endpoint backup protection, backup activity and recovery information\./);
});

test("Backup sidebar item is enabled at /backup and keeps its label", () => {
  assert.equal(byId("backup").href, "/backup");
  assert.equal(byId("backup").label, "Backup & Recovery");
  assert.equal(findActiveNavItem("/backup")?.id, "backup");
  assert.equal(findActiveNavItem("/backupx"), undefined);
});

test("Soon appears only on planned items, so Backup no longer shows it", () => {
  const nav = read("src/components/sidebar/sidebar-nav.tsx");
  const planned = nav.slice(nav.indexOf("function PlannedItem"));
  assert.ok(nav.indexOf("Soon") > nav.indexOf("function PlannedItem"));
  assert.match(planned, /Soon/);
  assert.match(nav, /item\.href \? \(\s*<ActiveItem/);
});

test("Dashboard and Security stay enabled; other planned modules stay disabled", () => {
  assert.equal(byId("dashboard").href, "/");
  assert.equal(byId("security").href, "/security");
  for (const id of ["users-devices", "reports", "compliance", "administration"]) assert.equal(byId(id).href, undefined, id);
});

test("exactly one primary navigation item is active per route", () => {
  for (const [path, id] of [["/", "dashboard"], ["/security", "security"], ["/backup", "backup"]]) {
    const active = items.filter((item) => isNavItemActive(item, path)).map((item) => item.id);
    assert.deepEqual(active, [id], path);
  }
});

test("all four backup sections are defined in order and rendered", () => {
  assert.deepEqual(BACKUP_SECTIONS.map((s) => s.title), ["Backup Overview", "Protected Assets", "Backup Job Activity", "Recovery Information"]);
  assert.equal(new Set(BACKUP_SECTIONS.map((s) => s.id)).size, 4);
  const sections = read("src/components/backup/backup-sections.tsx");
  assert.match(sections, /BACKUP_SECTIONS\.map/);
  assert.match(sections, /<BackupOverviewPanel /);
  assert.match(sections, /<ProtectedAssetsPanel /);
  assert.match(sections, /<BackupJobActivityPanel /);
  assert.match(sections, /<RecoveryInformationPanel /);
  assert.doesNotMatch(sections, /PlaceholderSection|not yet populated/);
});

test("Live Mode is explicitly unavailable and does not imply zero issues or success", () => {
  const jobs = jobActivityView({ kind: "unavailable" }, "All Customers");
  assert.equal(jobs.badge, "Not connected");
  assert.ok(jobs.status === "not-connected" && /does not mean there are no failed jobs, and it does not indicate that backups are working/.test(jobs.body));
  assert.equal(recoveryInformation("live", "All Customers").badge, "Not connected");
  assert.match(BACKUP_LIVE_NOTICE, /not connected/);
  assert.match(backupAnnouncement("live", "All Customers"), /not connected/);
});

test("Demo Mode explains what the page shows and that no recovery information exists", () => {
  assert.match(recoveryInformation("demo", "Demo Customer B").badge, /Demo/);
  assert.match(BACKUP_DEMO_PAGE_NOTICE, /simulated backup overview, illustrative asset samples and illustrative job examples/);
  assert.match(BACKUP_DEMO_PAGE_NOTICE, /same fictional figures as the Dashboard's Backup Health summary/);
  assert.match(BACKUP_DEMO_PAGE_NOTICE, /No actual recovery information is available/);
  assert.match(read("src/components/backup/backup-intro.tsx"), /<DemoModeNotice \/>/);
});

test("customer scope comes from the shared provider and appears in every section state", () => {
  const hooks = ["src/components/backup/use-backup-assets.ts", "src/components/backup/use-backup-job-activity.ts"];
  for (const file of ["src/components/backup/backup-intro.tsx", "src/components/backup/backup-sections.tsx", ...hooks]) {
    const source = read(file);
    assert.match(source, /useCustomerView\(\)/, file);
    assert.match(source, /useDashboardMode\(\)/, file);
    assert.doesNotMatch(source, /CustomerSelector|createContext/, file);
    if (!hooks.includes(file)) assert.doesNotMatch(source, /useState/, file);
  }
  for (const scope of SCOPES) {
    for (const mode of ["live", "demo"] as const) {
      assert.match(recoveryInformation(mode, scope).areas[0].body, new RegExp(scope), `${mode} ${scope}`);
      assert.match(backupAnnouncement(mode, scope), new RegExp(scope));
    }
    const jobs = jobActivityView({ kind: "unavailable" }, scope);
    assert.ok(jobs.status === "not-connected" && jobs.body.includes(scope));
  }
});

test("no invented backup statistics, percentages or success rates", () => {
  for (const text of allCopy("All Customers")) {
    assert.doesNotMatch(text.replace(BACKUP_PROVIDER_NAME, ""), /\d/, text);
    assert.doesNotMatch(text, /success rate|%/i, text);
  }
  assert.doesNotMatch(ui + viewSource, /\b\d+(\.\d+)?%|successRate|success_rate/);
});

test("Backup page data comes only through the shared hooks; no fixtures, job records or direct fetching", () => {
  assert.doesNotMatch(ui + viewSource, /from "@\/(demo|mocks)\//);
  assert.doesNotMatch(ui, /from "@\/services\/(?!backup-health"|backup-assets"|backup-job-activity")/);
  assert.doesNotMatch(ui, /getDemoBackupHealth|getBackupHealth|getDemoBackupAssets|getDemoBackupJobActivity|normalize\w+\(/);
  assert.doesNotMatch(ui + viewSource, /fetch\(|axios/);
  assert.match(read("src/components/backup/backup-overview-panel.tsx"), /useBackupHealth\(\)/);
  assert.match(read("src/components/backup/protected-assets-panel.tsx"), /useBackupAssets\(\)/);
  assert.match(read("src/components/backup/backup-job-activity-panel.tsx"), /useBackupJobActivity\(\)/);
  assert.doesNotMatch(ui + viewSource, /Demo (Endpoint|Asset|Job|Backup Asset|Backup Job)|hostname|agent_id|job_id/i);
});

test("no successful sync timestamps", () => {
  assert.doesNotMatch(ui + viewSource, /<time|Last synced|toLocaleString|new Date|lastSyncedAt/);
});

test("no restore actions or other interactive controls in the backup sections", () => {
  for (const file of ["backup-sections", "backup-section-frame", "protected-assets-panel", "backup-job-activity-panel", "recovery-information-panel"]) {
    const source = read(`src/components/backup/${file}.tsx`);
    assert.doesNotMatch(source, /<button|<a\s|<Link|href=|onClick|role="button"|cursor-pointer|tabIndex|<input|<select|<form|hover:|disabled/, file);
  }
  const overview = read("src/components/backup/backup-overview-panel.tsx");
  assert.equal(overview.match(/<button/g)?.length, 1, "only the error-state Retry button");
  assert.match(overview, /onRetry && \(\s*<button[\s\S]*?Retry\s*<\/button>/);
  assert.doesNotMatch(overview, /<a\s|<Link|href=|<input|<select|<form/);
  assert.equal(RESTORE_UNAVAILABLE, "Restore operations are not available in Quantum Shield Command.");
  for (const text of allCopy("All Customers")) assert.doesNotMatch(text, /restore now|start restore|download|export/i, text);
  const integration = recoveryInformation("live", "All Customers").areas.find((a) => a.id === "integration-verification")!;
  assert.match(integration.status, /pending verification/i);
});

test("no speculative provider endpoints or credentials", () => {
  assert.doesNotMatch(ui + viewSource, /TODO\(api\)|\/api\/|https?:\/\/|api[_-]?key|token|secret/i);
  assert.doesNotMatch(ui + viewSource, /SIRIS|Unitrends|SaaS Protection/);
  assert.match(BACKUP_PROVIDER_NAME, /^Datto Endpoint Backup$/);
});

test("Dashboard Backup Health values and meanings are unchanged", async () => {
  const all = normalizeBackupHealth(await getDemoBackupHealth({ type: "all" }), { type: "all" });
  assert.equal(all.kind, "ready");
  if (all.kind !== "ready") return;
  assert.equal(all.protectedAssets, 61);
  assert.deepEqual(all.freshness, { less_than_1_hour: 4, "1_to_3_hours": 8, "4_to_24_hours": 28, more_than_24_hours: 15, no_successful_backup: 6 });
  assert.equal(all.jobOutcomes?.period, "last_24_hours");
  assert.equal(all.jobOutcomes?.basis, "job_executions");
  assert.deepEqual(all.jobOutcomes?.counts, { successful: 48, partially_successful: 3, degraded_or_failed: 5, not_available: 7 });
  assert.equal(all.lastSyncedAt, null);
  const b = normalizeBackupHealth(await getDemoBackupHealth({ type: "customer", customer_id: 2 }), { type: "customer", customer_id: 2 });
  assert.ok(b.kind === "ready" && b.protectedAssets === 27 && b.jobOutcomes?.counts.successful === 20);
  const live = normalizeBackupHealth(await getBackupHealth({ type: "all" }), { type: "all" });
  assert.notEqual(live.kind, "ready");
  assert.match(read("src/components/dashboard/backup-health-panel.tsx"), /title="Backup Health"/);
});

test("Security module is unchanged and not reachable from the Backup page code", () => {
  assert.deepEqual(SECURITY_SECTIONS.map((s) => s.title), ["Security Overview", "Threats & Detections", "Identities & Endpoints", "Security Controls"]);
  assert.match(read("src/app/security/page.tsx"), /<SecuritySections \/>/);
  assert.doesNotMatch(ui, /SecuritySections|SecurityOverviewPanel/);
});
