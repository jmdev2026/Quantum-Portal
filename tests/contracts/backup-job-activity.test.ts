import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customersResponse } from "@/mocks/customers";
import { buildDemoBackupJobActivity } from "@/demo/backup-job-activity";
import { buildDemoBackupHealth } from "@/demo/backup-health";
import {
  JOB_ACTIVITY_DISCLOSURE,
  jobActivityView,
  visibleBackupJobs,
  type LoadedBackupJobs,
} from "@/components/backup/backup-job-activity-view";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import { JOB_OUTCOMES, normalizeBackupHealth } from "@/services/backup-health";
import {
  BACKUP_JOB_TEXT_LIMITS,
  MAX_DEMO_BACKUP_JOBS,
  getDemoBackupJobActivity,
  normalizeDemoBackupJobActivity,
  type BackupJobsState,
} from "@/services/backup-job-activity";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const customers = customersResponse.data;
const ALL: DashboardScope = { type: "all" };
const one = (id: number): DashboardScope => ({ type: "customer", customer_id: id });
const scopeOf = (customerId: number | null): DashboardScope => (customerId === null ? ALL : one(customerId));

const normalize = (scope: DashboardScope, response: unknown = buildDemoBackupJobActivity(scope)) =>
  normalizeDemoBackupJobActivity(response, scope, customers);
const ready = (state: BackupJobsState) => {
  assert.equal(state.kind, "ready", JSON.stringify(state));
  return (state as Extract<BackupJobsState, { kind: "ready" }>).records;
};
const isError = (state: BackupJobsState, label = "") => assert.equal(state.kind, "error", `${label} ${JSON.stringify(state)}`);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const mutated = (scope: DashboardScope, change: (records: Record<string, unknown>[], data: Record<string, unknown>) => void) => {
  const response = clone(buildDemoBackupJobActivity(scope));
  change(response.data.records as unknown as Record<string, unknown>[], response.data as unknown as Record<string, unknown>);
  return normalize(scope, response);
};

const EXPECTED = [
  ["Demo Backup Job A-01", 1, "successful"],
  ["Demo Backup Job B-01", 2, "degraded_or_failed"],
  ["Demo Backup Job C-01", 3, "successful"],
  ["Demo Backup Job A-02", 1, "partially_successful"],
  ["Demo Backup Job B-02", 2, "successful"],
  ["Demo Backup Job C-02", 3, "partially_successful"],
] as const;

test("All Customers uses an explicit fixture of six fictional jobs", () => {
  const fixture = read("src/demo/backup-job-activity.ts");
  assert.match(fixture, /const DEMO_ALL_BACKUP_JOBS = \[/);
  assert.doesNotMatch(fixture, /flatMap|Object\.values\(DEMO_BACKUP_JOBS\)|concat/);
  const records = ready(normalize(ALL));
  assert.deepEqual(records.map((r) => [r.title, r.customerId, r.outcome]), EXPECTED);
});

test("Customers A, B and C each get exactly their own two jobs", () => {
  for (const id of [1, 2, 3]) {
    const records = ready(normalize(one(id)));
    assert.deepEqual(
      records.map((r) => [r.title, r.customerId, r.outcome]),
      EXPECTED.filter(([, customerId]) => customerId === id),
      `customer ${id}`,
    );
    const name = customers.find((c) => c.id === id)!.name;
    for (const record of records) assert.equal(record.customerName, name);
  }
});

test("outcomes use the canonical Backup Health keys, and no example invents a Not Available job", () => {
  const keys = new Set(JOB_OUTCOMES.map((o) => o.key));
  for (const record of ready(normalize(ALL))) assert.ok(keys.has(record.outcome), record.outcome);
  assert.ok(!ready(normalize(ALL)).some((r) => r.outcome === "not_available"));
});

test("IDs and titles are unique; every record is fictional plain text from simulated demo data", () => {
  const records = ready(normalize(ALL));
  assert.equal(new Set(records.map((r) => r.id)).size, 6);
  assert.equal(new Set(records.map((r) => r.title)).size, 6);
  for (const record of records) {
    assert.match(record.id, /^demo-backup-job-[a-c]-0[12]$/);
    assert.match(record.description, /^Fictional example:/);
    assert.equal(record.source, "Simulated demo data");
    assert.doesNotMatch(record.title + record.description, /[<>&]/);
  }
});

test("records carry only the provisional fields: no timestamps, provider IDs, sizes or restore references", () => {
  for (const record of buildDemoBackupJobActivity(ALL).data.records!) {
    assert.deepEqual(Object.keys(record).sort(), ["customer", "description", "id", "outcome", "source", "title"]);
  }
  const fixture = read("src/demo/backup-job-activity.ts");
  assert.doesNotMatch(fixture, /\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}|started|finished|duration|size|bytes|GB|policy|agent|snapshot|recovery|restore|log/i);
});

test("no example claims an actual backup succeeded or that a restore is possible", () => {
  for (const record of ready(normalize(ALL))) {
    assert.doesNotMatch(record.description, /backed up|backup (completed|succeeded)|restor|recover|verified|healthy|protected|last 24 hours|recently/i);
  }
});

test("job examples are never used to derive the Backup Overview outcome totals", () => {
  const health = normalizeBackupHealth(buildDemoBackupHealth(ALL), ALL);
  assert.ok(health.kind === "ready");
  assert.deepEqual(health.jobOutcomes?.counts, { successful: 48, partially_successful: 3, degraded_or_failed: 5, not_available: 7 });
  const sources = [
    "src/demo/backup-health.ts",
    "src/services/backup-health.ts",
    "src/components/backup/backup-overview-panel.tsx",
    "src/components/backup/backup-overview-view.ts",
    "src/components/dashboard/use-backup-health.ts",
  ].map(read).join("\n");
  assert.doesNotMatch(sources, /backup-job-activity|useBackupJobActivity|BackupJob\b/);
  const jobUi = ["src/components/backup/backup-job-activity-panel.tsx", "src/components/backup/backup-job-activity-view.ts"].map(read).join("\n");
  assert.doesNotMatch(jobUi, /useBackupHealth|jobOutcomes|counts|records\.length\s*\}|\bof\s*\{|success rate|%/);
  assert.equal(
    JOB_ACTIVITY_DISCLOSURE,
    "Illustrative backup job examples only. These records are separate from the Backup Overview job-execution summaries and do not represent actual backup activity.",
  );
});

test("validator accepts the canonical fixture for every scope", () => {
  for (const scope of [ALL, one(1), one(2), one(3)]) ready(normalize(scope));
});

test("validator rejects invalid records", () => {
  const cases: [string, (r: Record<string, unknown>[]) => void][] = [
    ["missing id", (r) => delete r[0].id],
    ["blank id", (r) => (r[0].id = " ")],
    ["duplicate id", (r) => (r[1].id = r[0].id)],
    ["duplicate title", (r) => (r[3].title = r[0].title)],
    ["blank title", (r) => (r[0].title = "")],
    ["title pattern", (r) => (r[0].title = "Nightly Server Job")],
    ["title letter mismatch", (r) => (r[0].title = "Demo Backup Job B-09")],
    ["blank description", (r) => (r[0].description = "  ")],
    ["not fictional", (r) => (r[0].description = "A backup job outcome would appear here.")],
    ["invalid outcome", (r) => (r[0].outcome = "failed")],
    ["outcome label instead of key", (r) => (r[0].outcome = "Successful")],
    ["wrong source", (r) => (r[0].source = "Datto Endpoint Backup")],
    ["string customer id", (r) => ((r[0].customer as Record<string, unknown>).id = "1")],
    ["unknown customer id", (r) => ((r[0].customer as Record<string, unknown>).id = 9)],
    ["customer name mismatch", (r) => ((r[0].customer as Record<string, unknown>).name = "Demo Customer B")],
    ["extra customer field", (r) => ((r[0].customer as Record<string, unknown>).email = "x")],
    ["extra field", (r) => (r[0].started_at = "2026-01-01T00:00:00Z")],
    ["provider id field", (r) => (r[0].job_id = "abc")],
    ["markup", (r) => (r[0].description = "Fictional example: <b>bold</b>")],
    ["script url", (r) => (r[0].description = "Fictional example: javascript:alert(1)")],
    ["entity", (r) => (r[0].description = "Fictional example: &lt;img&gt;")],
    ["email", (r) => (r[0].description = "Fictional example: contact ops@example.com")],
    ["ip", (r) => (r[0].description = "Fictional example: server 10.0.0.12")],
    ["url", (r) => (r[0].description = "Fictional example: see https://portal.example")],
    ["domain", (r) => (r[0].description = "Fictional example: reported by backup.contoso.com")],
    ["uuid", (r) => (r[0].description = "Fictional example: 123e4567-e89b-12d3-a456-426614174000")],
    ["hex provider id", (r) => (r[0].description = "Fictional example: reference 9f86d081884c7d65")],
    ["provider id wording", (r) => (r[0].description = "Fictional example: job id shown here")],
    ["iso date", (r) => (r[0].description = "Fictional example: ran on 2026-11-16")],
    ["clock time", (r) => (r[0].description = "Fictional example: ran at 02:30")],
    ["slash date", (r) => (r[0].description = "Fictional example: ran on 11/16/26")],
    ["month date", (r) => (r[0].description = "Fictional example: ran on Nov 16")],
    ["relative time", (r) => (r[0].description = "Fictional example: ran 3 hours ago")],
    ["recent claim", (r) => (r[0].description = "Fictional example: this job ran yesterday")],
    ["success claim", (r) => (r[0].description = "Fictional example: the backup completed for this laptop")],
    ["backed up claim", (r) => (r[0].description = "Fictional example: the device was backed up")],
    ["restore claim", (r) => (r[0].description = "Fictional example: files can be restored from this job")],
    ["recovery claim", (r) => (r[0].description = "Fictional example: a recovery point was created")],
    ["verified claim", (r) => (r[0].description = "Fictional example: outcome verified by the provider")],
    ["long description", (r) => (r[0].description = `Fictional example: ${"x".repeat(BACKUP_JOB_TEXT_LIMITS.description)}`)],
    ["long title", (r) => (r[0].title = `Demo Backup Job A-${"1".repeat(BACKUP_JOB_TEXT_LIMITS.title)}`)],
    ["non-object record", (r) => (r[0] = "job" as unknown as Record<string, unknown>)],
  ];
  for (const [label, change] of cases) isError(mutated(ALL, change), label);
});

test("validator rejects wrong scope, wrong-customer records, bad shape and too many records", () => {
  isError(normalize(one(2), buildDemoBackupJobActivity(one(1))));
  isError(normalize(ALL, buildDemoBackupJobActivity(one(1))));
  isError(normalize(one(1), buildDemoBackupJobActivity(ALL)));
  const mixed = clone(buildDemoBackupJobActivity(one(2)));
  mixed.data.records!.push(clone(buildDemoBackupJobActivity(one(3)).data.records![0]));
  isError(normalize(one(2), mixed));
  isError(mutated(ALL, (_, d) => (d.source = "Datto Endpoint Backup")));
  isError(mutated(ALL, (_, d) => (d.status = "partial")));
  isError(mutated(ALL, (_, d) => (d.records = "none")));
  isError(mutated(ALL, (_, d) => (d.extra = true)));
  isError(normalize(ALL, null));
  isError(normalize(ALL, { data: [] }));
  const many = mutated(ALL, (r) => {
    while (r.length <= MAX_DEMO_BACKUP_JOBS) r.push({ ...r[0], id: `demo-backup-job-a-${r.length}`, title: `Demo Backup Job A-${r.length}` });
  });
  assert.ok(many.kind === "error" && /Too many/.test(many.message));
});

test("unknown customer IDs return a safe error, never another customer's jobs", async () => {
  for (const id of [0, 4, 99]) {
    const response = await getDemoBackupJobActivity(one(id));
    assert.equal(response.data.status, "error");
    assert.equal(response.data.records, null);
    const state = normalize(one(id), response);
    assert.ok(state.kind === "error" && state.message === "No demonstration data exists for this customer.");
  }
});

test("error messages are sanitized", () => {
  const state = mutated(ALL, (_, d) => {
    d.status = "error";
    d.records = null;
    d.message = "<script>alert(1)</script>";
  });
  assert.ok(state.kind === "error" && !/</.test(state.message));
});

test("Live view: not connected, no records, no counts and no success or failure claim", () => {
  for (const scope of ["All Customers", "Demo Customer B"]) {
    const live = jobActivityView({ kind: "unavailable" }, scope);
    assert.ok(live.status === "not-connected");
    assert.equal(live.badge, "Not connected");
    assert.match(live.body, /does not mean there are no failed jobs/);
    assert.doesNotMatch(live.title + live.body, /\d|synced|succeeded|working normally/i);
  }
  assert.deepEqual(visibleBackupJobs({ mode: "demo", customerId: null, state: normalize(ALL) }, "live", null), { kind: "unavailable" });
});

test("Demo view: Simulated badge with records; loading, error and empty states are distinct", () => {
  const view = jobActivityView(normalize(ALL), "All Customers");
  assert.ok(view.status === "simulated" && view.records.length === 6);
  assert.equal(view.badge, "Simulated");
  const statuses = [
    jobActivityView({ kind: "loading" }, "x").status,
    jobActivityView({ kind: "error", message: "m" }, "x").status,
    jobActivityView({ kind: "ready", records: [] }, "x").status,
  ];
  assert.deepEqual(statuses, ["loading", "error", "demo-empty"]);
});

type View = { mode: DashboardMode; customerId: number | null };
const load = async (view: View): Promise<LoadedBackupJobs> => {
  const scope = scopeOf(view.customerId);
  return { ...view, state: normalize(scope, await getDemoBackupJobActivity(scope)) };
};
const customersIn = (state: BackupJobsState) => (state.kind === "ready" ? [...new Set(state.records.map((r) => r.customerId))] : []);

test("isolation: All -> A -> B -> C -> All shows only the current customer's jobs", async () => {
  for (const customerId of [null, 1, 2, 3, null]) {
    const state = visibleBackupJobs(await load({ mode: "demo", customerId }), "demo", customerId);
    assert.deepEqual(customersIn(state), customerId === null ? [1, 2, 3] : [customerId]);
  }
});

test("isolation: Demo -> Live clears records, Live -> Demo never shows stale records", async () => {
  for (const customerId of [null, 1, 2, 3]) {
    const demo = await load({ mode: "demo", customerId });
    assert.equal(visibleBackupJobs(demo, "live", customerId).kind, "unavailable");
    const fromLive: LoadedBackupJobs = { mode: "live", customerId, state: { kind: "loading" } };
    assert.equal(visibleBackupJobs(fromLive, "demo", customerId).kind, "loading");
  }
});

test("isolation: rapid switching with out-of-order responses never mixes views", async () => {
  const sequence: View[] = [
    { mode: "demo", customerId: null },
    { mode: "demo", customerId: 1 },
    { mode: "live", customerId: 1 },
    { mode: "demo", customerId: 3 },
    { mode: "demo", customerId: 2 },
  ];
  const responses = await Promise.all(sequence.map(load));
  const current = sequence.at(-1)!;
  for (const late of responses.slice().reverse()) {
    const shown = visibleBackupJobs(late, current.mode, current.customerId);
    if (shown.kind === "ready") assert.deepEqual(customersIn(shown), [2]);
    else assert.equal(shown.kind, "loading");
  }
  const otherCustomer = visibleBackupJobs(responses[3], "demo", 2);
  assert.equal(otherCustomer.kind, "loading");
});

test("hook discards cancelled responses, waits for Demo and reload starts in Live", () => {
  const hook = read("src/components/backup/use-backup-job-activity.ts");
  assert.match(hook, /let cancelled = false/);
  assert.match(hook, /if \(!cancelled\) setLoaded/);
  assert.match(hook, /cancelled = true/);
  assert.match(hook, /if \(mode !== "demo"\) return;/);
  assert.match(hook, /return visibleBackupJobs\(loaded, mode, customerId\)/);
  const provider = read("src/components/dashboard-mode/dashboard-mode-provider.tsx");
  assert.match(provider, /useState<DashboardMode>\("live"\)/);
  assert.doesNotMatch(provider, /localStorage|sessionStorage|cookie/);
});

test("job rows are read-only and the service makes no network calls, writes or credential use", () => {
  const panel = read("src/components/backup/backup-job-activity-panel.tsx");
  assert.doesNotMatch(panel, /<button|<a\s|<Link|href=|onClick|tabIndex|hover:|cursor-pointer|<time/);
  assert.match(panel, /JOB_ACTIVITY_DISCLOSURE/);
  const sources = ["src/services/backup-job-activity.ts", "src/demo/backup-job-activity.ts", "src/components/backup/use-backup-job-activity.ts"].map(read).join("\n");
  assert.doesNotMatch(sources, /fetch\(|axios|XMLHttpRequest|supabase|localStorage|TODO\(api\)|\/api\/|token|api[_-]?key|import\.meta\.env|process\.env/i);
});
