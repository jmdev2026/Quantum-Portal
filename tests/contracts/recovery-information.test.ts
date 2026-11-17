import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RESTORE_UNAVAILABLE, recoveryInformation } from "@/components/backup/recovery-information-view";
import { BACKUP_SECTIONS } from "@/components/backup/backup-view";
import { buildDemoBackupAssets } from "@/demo/backup-assets";
import { buildDemoBackupHealth } from "@/demo/backup-health";
import { normalizeBackupHealth } from "@/services/backup-health";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const SCOPES = ["All Customers", "Demo Customer A", "Demo Customer B", "Demo Customer C"];
const copy = (mode: "live" | "demo", scope = "All Customers") => {
  const info = recoveryInformation(mode, scope);
  return [info.badge, ...info.areas.flatMap((a) => [a.title, a.status, a.body])].join("\n");
};

test("Recovery Information has the required heading, description and four areas in order", () => {
  const section = BACKUP_SECTIONS.find((s) => s.id === "recovery-information")!;
  assert.equal(section.title, "Recovery Information");
  assert.equal(section.description, "Recovery visibility and restore capability information for the selected customer.");
  for (const mode of ["live", "demo"] as const) {
    assert.deepEqual(
      recoveryInformation(mode, "All Customers").areas.map((a) => a.title),
      ["Recovery Visibility", "Recovery Points", "Restore Operations", "Integration Verification"],
    );
  }
  assert.match(read("src/components/backup/backup-sections.tsx"), /<RecoveryInformationPanel /);
});

test("Restore Operations states plainly that restores are not available", () => {
  assert.equal(RESTORE_UNAVAILABLE, "Restore operations are not available in Quantum Shield Command.");
  for (const mode of ["live", "demo"] as const) {
    const area = recoveryInformation(mode, "All Customers").areas.find((a) => a.id === "restore-operations")!;
    assert.ok(area.body.startsWith(RESTORE_UNAVAILABLE));
    assert.match(area.body, /cannot be requested, scheduled or approved/);
  }
});

test("Live is not connected; Demo states no actual recovery-point data exists", () => {
  assert.equal(recoveryInformation("live", "All Customers").badge, "Not connected");
  assert.match(copy("live"), /Live recovery information is not connected for All Customers/);
  assert.match(recoveryInformation("demo", "All Customers").badge, /Demo/);
  assert.match(copy("demo"), /No actual recovery-point data is available for All Customers/);
  assert.match(copy("demo"), /example assets on this page are not restorable/);
});

test("no recovery records, recovery points, dates, success history or counts are presented", () => {
  for (const mode of ["live", "demo"] as const) {
    const text = copy(mode);
    assert.doesNotMatch(text, /\d/, mode);
    assert.doesNotMatch(text, /restore (succeeded|completed|was successful)|successfully restored|last restore|recoverable|can be restored|restore now|download|schedule a restore/i, mode);
    assert.match(text, /No recovery points or dates are displayed/);
  }
  const ui = ["src/components/backup/recovery-information-panel.tsx", "src/components/backup/recovery-information-view.ts"].map(read).join("\n");
  assert.doesNotMatch(ui, /use[A-Z]\w*\(|from "@\/(services|demo|mocks)\/|<time|new Date|toLocale/);
});

test("no restore controls, disabled future actions or clickable styling", () => {
  const panel = read("src/components/backup/recovery-information-panel.tsx");
  assert.doesNotMatch(panel, /<button|<a\s|<Link|href=|onClick|role="button"|tabIndex|disabled|hover:|cursor-|<input|<select|<form/);
});

test("no unsupported provider capability, endpoint or parameter is asserted", () => {
  for (const mode of ["live", "demo"] as const) {
    const text = copy(mode);
    assert.match(text, /depend on confirming the capabilities and permissions actually supported by the Datto Endpoint Backup API/);
    assert.match(text, /No recovery capability has been confirmed/);
    assert.doesNotMatch(text, /\/api\/|endpoint (is|exists)|scope[s]?:|parameter|https?:|supports restore|restore API/i);
  }
});

test("customer scope appears in the Recovery Visibility message for every scope and mode", () => {
  for (const scope of SCOPES) {
    for (const mode of ["live", "demo"] as const) {
      assert.ok(recoveryInformation(mode, scope).areas[0].body.includes(scope), `${mode} ${scope}`);
    }
  }
});

test("regression: Backup Overview figures and protected asset examples are unchanged", () => {
  const expected = {
    all: [61, 4, 8, 28, 15, 6, 48, 3, 5, 7],
    1: [18, 2, 3, 9, 3, 1, 15, 1, 1, 2],
    2: [27, 1, 3, 11, 9, 3, 20, 1, 3, 3],
    3: [16, 1, 2, 8, 3, 2, 13, 1, 1, 2],
  } as const;
  for (const [key, values] of Object.entries(expected)) {
    const scope = key === "all" ? ({ type: "all" } as const) : ({ type: "customer", customer_id: Number(key) } as const);
    const health = normalizeBackupHealth(buildDemoBackupHealth(scope), scope);
    assert.ok(health.kind === "ready", key);
    assert.deepEqual(
      [health.protectedAssets, ...Object.values(health.freshness ?? {}), ...Object.values(health.jobOutcomes?.counts ?? {})],
      [...values],
      key,
    );
  }
  assert.deepEqual(
    buildDemoBackupAssets({ type: "all" }).data.records!.map((r) => r.name),
    ["A-01", "B-01", "C-01", "A-02", "B-02", "C-02"].map((n) => `Demo Backup Asset ${n}`),
  );
});
