import test from "node:test";
import assert from "node:assert/strict";
import { JOB_OUTCOMES, getBackupHealth, normalizeBackupHealth as n } from "@/services/backup-health";

const ALL = { type: "all" } as const;
const B = { type: "customer", customer_id: 2 } as const;
const counts = { successful: 48, partially_successful: 3, degraded_or_failed: 2, not_available: 1 };
const window = { window_start: "2026-10-26T08:00:00Z", window_end: "2026-10-27T08:00:00Z" };
const outcomes = (extra: Record<string, unknown> = {}) => ({ period: "last_24_hours", basis: "job_executions", counts, ...extra });
const res = (data: Record<string, unknown>, scope: unknown = ALL) => ({
  data: { scope, source: "datto-endpoint-backup", last_synced_at: "2026-10-27T08:00:00Z", ...data },
});
const ready = (job_outcomes: unknown, extra: Record<string, unknown> = {}, scope: unknown = ALL, requested = ALL as typeof ALL | typeof B) =>
  n(res({ status: "ready", job_outcomes, ...extra }, scope), requested);
const jobs = (s: ReturnType<typeof n>) => (s.kind === "ready" || s.kind === "stale" ? s.jobOutcomes : undefined);
const isError = (s: ReturnType<typeof n>) => assert.equal(s.kind, "error");

test("contract defines exactly four outcome categories in order", () => {
  assert.deepEqual(
    JOB_OUTCOMES.map((o) => o.key),
    ["successful", "partially_successful", "degraded_or_failed", "not_available"],
  );
});

test("valid outcomes return counts, period, basis and window", () => {
  assert.deepEqual(jobs(ready(outcomes(window))), {
    period: "last_24_hours",
    basis: "job_executions",
    windowStart: "2026-10-26T08:00:00Z",
    windowEnd: "2026-10-27T08:00:00Z",
    counts,
  });
});

test("both measurement bases are accepted and preserved", () => {
  for (const basis of ["job_executions", "asset_statuses"]) {
    assert.equal(jobs(ready(outcomes({ basis })))?.basis, basis);
  }
});

test("outcomes alone satisfy the at-least-one-metric rule", () => {
  const s = ready(outcomes(), { protected_assets: null, freshness: null });
  assert.equal(s.kind, "ready");
  assert.equal(s.kind === "ready" && s.protectedAssets, null);
  assert.equal(s.kind === "ready" && s.freshness, null);
});

test("explicit zero counts are verified zero", () => {
  const zeros = { successful: 0, partially_successful: 0, degraded_or_failed: 0, not_available: 0 };
  assert.deepEqual(jobs(ready(outcomes({ counts: zeros })))?.counts, zeros);
});

test("null or missing categories stay null, never zero", () => {
  const c = jobs(ready(outcomes({ counts: { successful: 5, degraded_or_failed: null } })))?.counts;
  assert.deepEqual(c, { successful: 5, partially_successful: null, degraded_or_failed: null, not_available: null });
});

test("outcome block with no reported counts is not verified activity", () => {
  for (const c of [{}, { successful: null, not_available: null }, null, undefined]) {
    assert.equal(jobs(ready(outcomes({ counts: c }), { protected_assets: 4 })), null);
  }
  isError(ready(outcomes({ counts: {} })));
});

test("missing or null job_outcomes is not reported while other metrics remain", () => {
  for (const value of [null, undefined]) {
    const s = ready(value, { protected_assets: 7 });
    assert.equal(s.kind === "ready" && s.protectedAssets, 7);
    assert.equal(jobs(s), null);
  }
});

test("invalid counts are rejected", () => {
  for (const value of [-1, 1.5, "3", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, true, {}, []]) {
    isError(ready(outcomes({ counts: { ...counts, degraded_or_failed: value } })));
  }
});

test("unknown outcome category keys are rejected", () => {
  isError(ready(outcomes({ counts: { ...counts, failed: 1 } })));
  isError(ready(outcomes({ counts: { ...counts, success_rate: 90 } })));
});

test("unknown job_outcomes fields and malformed structures are rejected", () => {
  isError(ready(outcomes({ success_percentage: 90 })));
  for (const value of [[], "x", 3, true]) isError(ready(value));
  for (const c of [[], "x", 5]) isError(ready(outcomes({ counts: c })));
});

test("measurement basis is validated before counts are accepted", () => {
  for (const basis of [undefined, null, "", "jobs", "JOB_EXECUTIONS", 1]) isError(ready(outcomes({ basis })));
});

test("reporting period must be last_24_hours", () => {
  for (const period of [undefined, null, "last_7_days", "24h", 24]) isError(ready(outcomes({ period })));
});

test("window timestamps are optional individually", () => {
  const s = jobs(ready(outcomes({ window_start: "2026-10-26T08:00:00Z" })));
  assert.equal(s?.windowStart, "2026-10-26T08:00:00Z");
  assert.equal(s?.windowEnd, null);
  assert.equal(jobs(ready(outcomes()))?.windowStart, null);
});

test("invalid or misordered window timestamps are rejected", () => {
  isError(ready(outcomes({ window_start: "not-a-date" })));
  isError(ready(outcomes({ window_end: 12345 })));
  isError(ready(outcomes({ window_start: window.window_end, window_end: window.window_start })));
  isError(ready(outcomes({ window_start: window.window_end, window_end: window.window_end })));
});

test("outcomes are never summed, compared to protected assets or freshness, or turned into a rate", () => {
  const freshness = { less_than_1_hour: 1 };
  const s = ready(outcomes(), { protected_assets: 1, freshness });
  assert.equal(s.kind, "ready");
  assert.deepEqual(jobs(s)?.counts, counts);
  assert.deepEqual(Object.keys(jobs(s) ?? {}).sort(), ["basis", "counts", "period", "windowEnd", "windowStart"]);
});

test("stale keeps outcomes", () => {
  const s = n(res({ status: "stale", job_outcomes: outcomes() }), ALL);
  assert.equal(s.kind, "stale");
  assert.deepEqual(jobs(s)?.counts, counts);
});

test("empty and unavailable never carry outcomes", () => {
  for (const status of ["empty", "unavailable"]) {
    const s = n(res({ status, job_outcomes: outcomes() }), ALL);
    assert.equal("jobOutcomes" in s, false);
  }
});

test("invalid outcomes reject the response even when other metrics are valid", () => {
  isError(ready(outcomes({ counts: { successful: -2 } }), { protected_assets: 10 }));
});

test("wrong-scope responses with outcomes are rejected", () => {
  isError(ready(outcomes(), {}, B, ALL));
  isError(ready(outcomes(), {}, ALL, B));
  isError(ready(outcomes(), {}, { type: "customer", customer_id: 3 }, B));
  assert.equal(ready(outcomes(), {}, B, B).kind, "ready");
});

test("mock returns null job outcomes for every scope", async () => {
  for (const scope of [ALL, B]) {
    const response = await getBackupHealth(scope);
    assert.equal(response.data.job_outcomes, null);
    assert.equal(n(response, scope).kind, "unavailable");
  }
});
