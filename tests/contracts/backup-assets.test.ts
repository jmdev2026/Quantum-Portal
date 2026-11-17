import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customersResponse } from "@/mocks/customers";
import { buildDemoBackupAssets } from "@/demo/backup-assets";
import {
  PROTECTED_ASSETS_DISCLOSURE,
  PROTECTION_LABEL,
  protectedAssetsView,
  visibleBackupAssets,
  type LoadedBackupAssets,
} from "@/components/backup/protected-assets-view";
import { backupHealthSource, visibleBackupHealth, type LoadedBackupHealth } from "@/components/dashboard/backup-health-view";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeBackupHealth } from "@/services/backup-health";
import {
  BACKUP_ASSET_TEXT_LIMITS,
  MAX_DEMO_BACKUP_ASSETS,
  getDemoBackupAssets,
  normalizeDemoBackupAssets,
  type BackupAssetsState,
} from "@/services/backup-assets";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const customers = customersResponse.data;
const ALL: DashboardScope = { type: "all" };
const one = (id: number): DashboardScope => ({ type: "customer", customer_id: id });
const scopeOf = (customerId: number | null): DashboardScope => (customerId === null ? ALL : one(customerId));
const LETTERS: Record<number, string> = { 1: "A", 2: "B", 3: "C" };

const normalize = (scope: DashboardScope, response: unknown = buildDemoBackupAssets(scope)) =>
  normalizeDemoBackupAssets(response, scope, customers);
const ready = (state: BackupAssetsState) => {
  assert.equal(state.kind, "ready", JSON.stringify(state));
  return (state as Extract<BackupAssetsState, { kind: "ready" }>).records;
};
const isError = (state: BackupAssetsState) => assert.equal(state.kind, "error", JSON.stringify(state));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const mutated = (scope: DashboardScope, change: (records: Record<string, unknown>[], data: Record<string, unknown>) => void) => {
  const response = clone(buildDemoBackupAssets(scope));
  change(response.data.records as unknown as Record<string, unknown>[], response.data as unknown as Record<string, unknown>);
  return normalize(scope, response);
};

test("six fictional backup asset records exist with the expected names", () => {
  const names = ready(normalize(ALL)).map((r) => r.name).sort();
  assert.deepEqual(names, ["A-01", "A-02", "B-01", "B-02", "C-01", "C-02"].map((n) => `Demo Backup Asset ${n}`));
});

test("every record is fictional, unverified and from simulated demo data", () => {
  for (const record of ready(normalize(ALL))) {
    assert.match(record.visibilityNote, /^Fictional example:/);
    assert.equal(record.protectionState, "Not verified");
    assert.equal(record.source, "Simulated demo data");
    assert.equal(customers.find((c) => c.id === record.customerId)?.name, record.customerName);
    assert.ok(record.name.endsWith(`${LETTERS[record.customerId]}-01`) || record.name.endsWith(`${LETTERS[record.customerId]}-02`));
  }
  assert.ok(ready(normalize(ALL)).some((r) => r.visibilityNote === "Fictional example: endpoint backup visibility would be reviewed here when provider data becomes available."));
});

test("records carry exactly the provisional fields and nothing provider-specific", () => {
  for (const record of buildDemoBackupAssets(ALL).data.records!) {
    assert.deepEqual(Object.keys(record).sort(), ["customer", "id", "name", "protection_state", "source", "visibility_note"]);
  }
  const fixture = read("src/demo/backup-assets.ts") + read("src/services/backup-assets.ts");
  assert.doesNotMatch(fixture, /licen[cs]e|operating_system|\bos\b|storage|policy_id|agent_id|recovery_point|last_backup|hostname|serial/i);
});

test("All Customers has an explicit list of six; each customer gets only its own two", () => {
  assert.match(read("src/demo/backup-assets.ts"), /const DEMO_ALL_BACKUP_ASSETS = \[/);
  assert.doesNotMatch(read("src/demo/backup-assets.ts"), /flatMap|Object\.values\(DEMO_BACKUP_ASSETS\)|concat/);
  assert.equal(ready(normalize(ALL)).length, 6);
  assert.deepEqual(ready(normalize(ALL)).map((r) => r.customerId), [1, 2, 3, 1, 2, 3]);
  for (const id of [1, 2, 3]) {
    const records = ready(normalize(one(id)));
    assert.equal(records.length, 2);
    assert.ok(records.every((r) => r.customerId === id && r.name.includes(`${LETTERS[id]}-`)));
  }
});

test("unknown customer IDs return a safe error and no records", async () => {
  for (const id of [0, 4, 99]) {
    const response = await getDemoBackupAssets(one(id));
    assert.equal(response.data.status, "error");
    assert.equal(response.data.records, null);
    isError(normalize(one(id), response));
  }
});

test("validator accepts the canonical fixture for every scope", () => {
  for (const scope of [ALL, one(1), one(2), one(3)]) ready(normalize(scope));
});

const RECORD_MUTATIONS: Record<string, (r: Record<string, unknown>[]) => void> = {
  "missing id": (r) => delete r[0].id,
  "duplicate id": (r) => (r[1].id = r[0].id),
  "duplicate name": (r) => (r[3].name = r[0].name),
  "blank name": (r) => (r[0].name = "   "),
  "name outside the demo pattern": (r) => (r[0].name = "Reception PC"),
  "name letter not matching customer": (r) => (r[0].name = "Demo Backup Asset B-09"),
  "wrong customer id": (r) => ((r[0].customer as Record<string, unknown>).id = 9),
  "non-integer customer id": (r) => ((r[0].customer as Record<string, unknown>).id = "1"),
  "customer name mismatch": (r) => ((r[0].customer as Record<string, unknown>).name = "Demo Customer B"),
  "extra customer field": (r) => ((r[0].customer as Record<string, unknown>).slug = "x"),
  "wrong source": (r) => (r[0].source = "Datto Endpoint Backup"),
  "blank note": (r) => (r[0].visibility_note = ""),
  "note not fictional": (r) => (r[0].visibility_note = "Endpoint backup visibility would be reviewed here."),
  "missing protection": (r) => delete r[0].protection_state,
  "protected claim": (r) => (r[0].protection_state = "Protected"),
  "verified claim": (r) => (r[0].protection_state = "Verified"),
  "backup exists claim": (r) => (r[0].visibility_note = "Fictional example: this device is backed up nightly."),
  "agent claim": (r) => (r[0].visibility_note = "Fictional example: the agent is installed on this device."),
  "success claim": (r) => (r[0].visibility_note = "Fictional example: backup completed without errors."),
  "policy claim": (r) => (r[0].visibility_note = "Fictional example: a policy is assigned to this device."),
  "restore claim": (r) => (r[0].visibility_note = "Fictional example: restore was verified last week."),
  "recovery claim": (r) => (r[0].visibility_note = "Fictional example: this device is recoverable."),
  "health claim": (r) => (r[0].visibility_note = "Fictional example: this device is healthy."),
  "unexpected field": (r) => (r[0].agent_id = "x"),
  "markup in note": (r) => (r[0].visibility_note = "Fictional example: <img src=x onerror=alert(1)>"),
  "script url": (r) => (r[0].visibility_note = "Fictional example: javascript:alert(1)"),
  "html entity": (r) => (r[0].visibility_note = "Fictional example: &lt;b&gt;"),
  "email address": (r) => (r[0].visibility_note = "Fictional example: contact jane@example.org"),
  "ip address": (r) => (r[0].visibility_note = "Fictional example: device at 10.0.0.12"),
  "mac address": (r) => (r[0].visibility_note = "Fictional example: adapter 00:1A:2B:3C:4D:5E"),
  "hostname": (r) => (r[0].visibility_note = "Fictional example: reception.corp device"),
  "windows device name": (r) => (r[0].visibility_note = "Fictional example: DESKTOP-7Q2K9LM entry"),
  "uuid": (r) => (r[0].id = "3f2504e0-4f89-11d3-9a0c-0305e82c3301"),
  "phone number": (r) => (r[0].visibility_note = "Fictional example: call +44 20 7946 0958"),
  "url": (r) => (r[0].visibility_note = "Fictional example: see https://portal.test"),
  "overlong name": (r) => (r[0].name = `Demo Backup Asset A-01${" ".repeat(BACKUP_ASSET_TEXT_LIMITS.name)}`),
  "overlong note": (r) => (r[0].visibility_note = `Fictional example: ${"x".repeat(BACKUP_ASSET_TEXT_LIMITS.visibilityNote)}`),
  "overlong id": (r) => (r[0].id = "a".repeat(BACKUP_ASSET_TEXT_LIMITS.id + 1)),
  "non-object record": (r) => (r[0] = "Demo Backup Asset A-01" as unknown as Record<string, unknown>),
};

for (const [name, change] of Object.entries(RECORD_MUTATIONS)) {
  test(`validator rejects: ${name}`, () => isError(mutated(ALL, change)));
}

test("validator rejects records outside the requested customer", () => {
  isError(normalize(one(2), buildDemoBackupAssets(one(1))));
  const response = clone(buildDemoBackupAssets(one(2)));
  response.data.records!.push(clone(buildDemoBackupAssets(one(3)).data.records![0]));
  isError(normalize(one(2), response));
});

test("validator rejects a wrong scope, status, source, shape or too many records", () => {
  isError(normalize(ALL, buildDemoBackupAssets(one(1))));
  isError(normalize(one(1), buildDemoBackupAssets(ALL)));
  isError(mutated(ALL, (_, d) => (d.source = "Datto Endpoint Backup")));
  isError(mutated(ALL, (_, d) => (d.status = "stale")));
  isError(mutated(ALL, (_, d) => (d.records = null)));
  isError(mutated(ALL, (_, d) => (d.extra = true)));
  isError(normalize(ALL, null));
  isError(normalize(ALL, { data: [] }));
  isError(
    mutated(ALL, (records) => {
      const base = records[0];
      for (let i = records.length; i <= MAX_DEMO_BACKUP_ASSETS; i++) records.push({ ...base, id: `x-${i}`, name: `Demo Backup Asset A-${10 + i}` });
    }),
  );
});

test("error messages from the response are sanitized", () => {
  const state = mutated(ALL, (_, d) => {
    d.status = "error";
    d.records = null;
    d.message = "<script>alert(1)</script>";
  });
  assert.deepEqual(state, { kind: "error", message: "Example assets could not be shown." });
});

test("Protected Assets view: Live is not connected and makes no claim", () => {
  const live = protectedAssetsView({ kind: "unavailable" }, "All Customers");
  assert.equal(live.status, "not-connected");
  assert.equal(live.badge, "Not connected");
  assert.match(live.body, /Datto Endpoint Backup is not connected/);
  assert.match(live.body, /does not mean there are no assets/);
  assert.doesNotMatch(live.title + live.body, /\d/);
});

test("Protected Assets view: Demo shows the disclosure, label and never an n-of-total count", () => {
  const view = protectedAssetsView(normalize(ALL), "All Customers");
  assert.equal(view.status, "simulated");
  assert.equal(view.badge, "Simulated");
  assert.equal(
    PROTECTED_ASSETS_DISCLOSURE,
    "Illustrative asset samples only. This list is not a complete endpoint backup inventory, and protection has not been verified.",
  );
  assert.equal(PROTECTION_LABEL, "Protection not verified");
  const panel = read("src/components/backup/protected-assets-panel.tsx");
  assert.match(panel, /PROTECTED_ASSETS_DISCLOSURE/);
  assert.match(panel, /PROTECTION_LABEL/);
  assert.doesNotMatch(panel, /records\.length|\bof\s*\{|useBackupHealth|\.protectedAssets\b/);
  assert.doesNotMatch(panel, /<button|onClick|href=|<input|<select|search|filter/i);
});

test("Protected Assets view: loading, error and empty states", () => {
  assert.equal(protectedAssetsView({ kind: "loading" }, "x").status, "loading");
  const error = protectedAssetsView({ kind: "error", message: "Example assets did not match the selected customer view." }, "x");
  assert.equal(error.status, "error");
  assert.equal(protectedAssetsView({ kind: "ready", records: [] }, "Demo Customer A").status, "demo-empty");
});

// Simulates the hooks: each load is tagged with the view it was requested for, and only the
// gate decides what is shown. Responses may resolve out of order.
type View = { mode: DashboardMode; customerId: number | null };
async function loadAssets(view: View): Promise<LoadedBackupAssets> {
  const scope = scopeOf(view.customerId);
  return { ...view, state: normalizeDemoBackupAssets(await getDemoBackupAssets(scope), scope, customers) };
}
async function loadHealth(view: View): Promise<LoadedBackupHealth> {
  const scope = scopeOf(view.customerId);
  return { ...view, state: normalizeBackupHealth(await backupHealthSource(view.mode)(scope), scope) };
}

function assertConsistent(view: View, assets: BackupAssetsState, health: ReturnType<typeof visibleBackupHealth>) {
  if (view.mode === "live") {
    assert.equal(assets.kind, "unavailable");
    assert.notEqual(health.kind, "ready");
    return;
  }
  if (assets.kind === "ready") {
    for (const r of assets.records) if (view.customerId !== null) assert.equal(r.customerId, view.customerId);
    assert.equal(assets.records.length, view.customerId === null ? 6 : 2);
  }
  if (health.kind === "ready") {
    const expected: Record<string, number> = { all: 61, 1: 18, 2: 27, 3: 16 };
    assert.equal(health.protectedAssets, expected[view.customerId ?? "all"]);
  }
}

test("isolation: All -> A -> B -> C -> All in Demo shows only the current view", async () => {
  for (const customerId of [null, 1, 2, 3, null]) {
    const view: View = { mode: "demo", customerId };
    const assets = visibleBackupAssets(await loadAssets(view), view.mode, view.customerId);
    const health = visibleBackupHealth(await loadHealth(view), view.mode, view.customerId);
    assert.equal(assets.kind, "ready");
    assert.equal(health.kind, "ready");
    assertConsistent(view, assets, health);
  }
});

test("isolation: Live <-> Demo never leaks demo values into Live", async () => {
  for (const customerId of [null, 1, 2, 3]) {
    const demo = await loadAssets({ mode: "demo", customerId });
    const demoHealth = await loadHealth({ mode: "demo", customerId });
    assert.equal(visibleBackupAssets(demo, "live", customerId).kind, "unavailable");
    assert.equal(visibleBackupHealth(demoHealth, "live", customerId).kind, "loading");
    const liveHealth = await loadHealth({ mode: "live", customerId });
    assert.equal(visibleBackupHealth(liveHealth, "demo", customerId).kind, "loading");
    assert.equal(visibleBackupHealth(liveHealth, "live", customerId).kind, "unavailable");
  }
});

test("isolation: rapid switching with out-of-order responses never mixes views", async () => {
  const sequence: View[] = [
    { mode: "demo", customerId: null },
    { mode: "demo", customerId: 1 },
    { mode: "live", customerId: 1 },
    { mode: "demo", customerId: 2 },
    { mode: "demo", customerId: 3 },
    { mode: "live", customerId: null },
    { mode: "demo", customerId: null },
    { mode: "demo", customerId: 2 },
  ];
  const assetLoads = await Promise.all(sequence.map(loadAssets));
  const healthLoads = await Promise.all(sequence.map(loadHealth));
  // Every response resolving late (in any order) is checked against every later view.
  for (const current of sequence) {
    for (let i = 0; i < sequence.length; i++) {
      const assets = visibleBackupAssets(assetLoads[i], current.mode, current.customerId);
      const health = visibleBackupHealth(healthLoads[i], current.mode, current.customerId);
      const same = sequence[i].mode === current.mode && sequence[i].customerId === current.customerId;
      if (!same && current.mode === "demo") {
        assert.equal(assets.kind, "loading");
        assert.equal(health.kind, "loading");
      }
      assertConsistent(current, assets, health);
    }
  }
});

test("isolation: hooks discard cancelled responses and reload starts in Live", () => {
  for (const file of ["src/components/backup/use-backup-assets.ts", "src/components/dashboard/use-backup-health.ts"]) {
    const source = read(file);
    assert.match(source, /let cancelled = false/, file);
    assert.match(source, /if \(!cancelled\) setLoaded/, file);
    assert.match(source, /cancelled = true/, file);
  }
  const assetsHook = read("src/components/backup/use-backup-assets.ts");
  assert.match(assetsHook, /if \(mode !== "demo"\) return;/);
  assert.match(assetsHook, /return visibleBackupAssets\(loaded, mode, customerId\)/);
  const provider = read("src/components/dashboard-mode/dashboard-mode-provider.tsx");
  assert.match(provider, /useState<DashboardMode>\("live"\)/);
  assert.doesNotMatch(provider, /localStorage|sessionStorage|cookie/);
});

test("asset service and fixture make no network calls, writes or credential use", () => {
  const sources = ["src/services/backup-assets.ts", "src/demo/backup-assets.ts", "src/components/backup/use-backup-assets.ts"].map(read).join("\n");
  assert.doesNotMatch(sources, /fetch\(|axios|XMLHttpRequest|supabase|localStorage|TODO\(api\)|\/api\/|token|api[_-]?key|import\.meta\.env|process\.env/i);
});
