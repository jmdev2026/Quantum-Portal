import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { findActiveNavItem, isNavItemActive, navSections } from "@/components/sidebar/navigation";
import {
  BACKUP_DEMO_PAGE_NOTICE,
  BACKUP_LIVE_NOTICE,
  BACKUP_PROVIDER_NAME,
  BACKUP_SECTIONS,
  RECOVERY_DISCLAIMER,
  backupAnnouncement,
  backupSectionState,
} from "@/components/backup/backup-view";
import { SECURITY_SECTIONS } from "@/components/security/security-overview-view";
import { getBackupHealth, getDemoBackupHealth, normalizeBackupHealth } from "@/services/backup-health";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const items = navSections.flatMap((section) => section.items);
const byId = (id: string) => items.find((item) => item.id === id)!;
const BACKUP_UI = ["src/app/backup/page.tsx", "src/components/backup/backup-intro.tsx", "src/components/backup/backup-sections.tsx"];
const ui = BACKUP_UI.map(read).join("\n");
const viewSource = read("src/components/backup/backup-view.ts");
const SCOPES = ["All Customers", "Demo Customer A", "Demo Customer B", "Demo Customer C"];
const allCopy = (scope: string) => [
  BACKUP_LIVE_NOTICE,
  BACKUP_DEMO_PAGE_NOTICE,
  RECOVERY_DISCLAIMER,
  ...BACKUP_SECTIONS.flatMap((s) => [s.title, s.description, s.plannedLabel, ...s.planned]),
  ...(["live", "demo"] as const).flatMap((m) => [...Object.values(backupSectionState(m, scope)), backupAnnouncement(m, scope)]),
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
  for (const id of ["users-devices", "customers", "reports", "compliance", "administration"]) assert.equal(byId(id).href, undefined, id);
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
  assert.match(read("src/components/backup/backup-sections.tsx"), /BACKUP_SECTIONS\.map/);
});

test("Live Mode is explicitly unavailable and does not imply zero issues or success", () => {
  const live = backupSectionState("live", "All Customers");
  assert.equal(live.badge, "Not connected");
  assert.match(BACKUP_LIVE_NOTICE, /not connected/);
  assert.match(live.body, /does not mean there are zero backup issues or that any backups have succeeded/);
  assert.match(backupAnnouncement("live", "All Customers"), /not connected/);
});

test("Demo Mode shows placeholder copy and points to the separate Dashboard summaries", () => {
  const demo = backupSectionState("demo", "Demo Customer B");
  assert.match(demo.badge, /Demo/);
  assert.match(demo.body, /later updates/);
  assert.match(demo.body, /No provider connection exists/);
  assert.equal(
    BACKUP_DEMO_PAGE_NOTICE,
    "Detailed backup demonstration information has not been added to this page yet. The main Dashboard contains separate simulated Backup Health summaries.",
  );
  assert.match(read("src/components/backup/backup-intro.tsx"), /<DemoModeNotice \/>/);
});

test("customer scope comes from the shared provider and appears in every section state", () => {
  for (const file of ["src/components/backup/backup-intro.tsx", "src/components/backup/backup-sections.tsx"]) {
    const source = read(file);
    assert.match(source, /useCustomerView\(\)/, file);
    assert.match(source, /useDashboardMode\(\)/, file);
    assert.doesNotMatch(source, /CustomerSelector|createContext|useState/, file);
  }
  for (const scope of SCOPES) {
    for (const mode of ["live", "demo"] as const) {
      assert.match(backupSectionState(mode, scope).body, new RegExp(scope), `${mode} ${scope}`);
      assert.match(backupAnnouncement(mode, scope), new RegExp(scope));
    }
  }
});

test("no invented backup statistics, percentages or success rates", () => {
  for (const text of allCopy("All Customers")) {
    assert.doesNotMatch(text.replace(BACKUP_PROVIDER_NAME, ""), /\d/, text);
    assert.doesNotMatch(text, /success rate|%/i, text);
  }
  assert.doesNotMatch(ui + viewSource, /\b\d+(\.\d+)?%|successRate|success_rate/);
});

test("no fictional asset or job records and no data sources on the Backup page", () => {
  assert.doesNotMatch(ui + viewSource, /@\/(demo|mocks|services)\//);
  assert.doesNotMatch(ui + viewSource, /useBackupHealth|getDemoBackupHealth|fetch\(|axios/);
  assert.doesNotMatch(ui + viewSource, /Demo (Endpoint|Asset|Job)|hostname|agent_id|job_id/i);
});

test("no successful sync timestamps", () => {
  assert.doesNotMatch(ui + viewSource, /<time|Last synced|toLocaleString|new Date|lastSyncedAt/);
});

test("no restore actions or other interactive controls in the backup sections", () => {
  const sections = read("src/components/backup/backup-sections.tsx");
  assert.doesNotMatch(sections, /<button|<a\s|<Link|href=|onClick|role="button"|cursor-pointer|tabIndex|<input|<select|<form/);
  assert.match(RECOVERY_DISCLAIMER, /does not restore data/);
  for (const text of allCopy("All Customers")) assert.doesNotMatch(text, /restore now|start restore|download|export/i, text);
  const recovery = BACKUP_SECTIONS.find((s) => s.id === "recovery-information")!;
  assert.match(recovery.plannedLabel, /pending provider verification/i);
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
