import test from "node:test";
import assert from "node:assert/strict";
import {
  CLOCK_SKEW_TOLERANCE_MS,
  checkHistoricalTimestamp,
  historicalTimestampOrNull,
  parseInstant,
} from "@/services/dashboard-response";
import { normalizeAssetSummary } from "@/services/dashboard-assets";
import { normalizeSecurityCoverage } from "@/services/security-coverage";
import { normalizeSecuritySeverity } from "@/services/security-severity";
import { normalizeInsights } from "@/services/insights";
import { getBackupHealth, normalizeBackupHealth } from "@/services/backup-health";
import { getCustomerOverview, normalizeCustomerOverview } from "@/services/customer-overview";

const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);
const ALL = { type: "all" } as const;
const B = { type: "customer", customer_id: 202 } as const;
const PAST = "2026-11-04T11:00:00Z";
const AT_TOLERANCE = "2026-11-04T12:05:00Z";
const JUST_BEYOND = "2026-11-04T12:05:00.001Z";
const FAR_FUTURE = "2099-01-01T00:00:00Z";

test("valid UTC timestamps", () => {
  assert.equal(parseInstant("2026-11-04T12:00:00Z"), NOW);
  assert.equal(parseInstant("1970-01-01T00:00:00Z"), 0);
  assert.equal(parseInstant("2026-12-31T23:59:59Z"), Date.UTC(2026, 11, 31, 23, 59, 59));
});

test("valid positive and negative UTC offsets", () => {
  assert.equal(parseInstant("2026-11-04T14:00:00+02:00"), NOW);
  assert.equal(parseInstant("2026-11-04T06:30:00-05:30"), NOW);
  assert.equal(parseInstant("2026-11-04T12:00:00+00:00"), NOW);
  assert.equal(parseInstant("2026-11-04T12:00:00-00:00"), NOW);
  assert.equal(parseInstant("2026-11-05T11:59:00+23:59"), NOW);
  assert.equal(parseInstant("2026-11-04T00:01:00-11:59"), NOW);
});

test("valid fractional seconds up to nine digits", () => {
  assert.equal(parseInstant("2026-11-04T12:00:00.5Z"), NOW + 500);
  assert.equal(parseInstant("2026-11-04T12:00:00.123Z"), NOW + 123);
  assert.equal(parseInstant("2026-11-04T12:00:00.123456Z"), NOW + 123);
  assert.equal(parseInstant("2026-11-04T12:00:00.999999999Z"), NOW + 999);
  assert.equal(parseInstant("2026-11-04T12:00:00.0000000000Z"), null);
  assert.equal(parseInstant("2026-11-04T12:00:00.Z"), null);
});

test("leap years and calendar boundaries", () => {
  for (const value of ["2024-02-29T00:00:00Z", "2000-02-29T00:00:00Z", "2026-01-31T00:00:00Z", "2026-04-30T23:59:59Z"]) {
    assert.notEqual(parseInstant(value), null, value);
  }
  assert.equal(parseInstant("2026-12-31T23:00:00-01:00"), Date.UTC(2027, 0, 1));
  for (const value of ["2026-02-29T00:00:00Z", "1900-02-29T00:00:00Z", "2100-02-29T00:00:00Z"]) {
    assert.equal(parseInstant(value), null, value);
  }
});

test("invalid calendar dates are rejected, not rolled over", () => {
  for (const value of [
    "2026-02-30T10:00:00Z",
    "2026-04-31T10:00:00Z",
    "2026-13-01T10:00:00Z",
    "2026-00-10T10:00:00Z",
    "2026-10-00T10:00:00Z",
    "2026-10-32T10:00:00Z",
  ]) {
    assert.equal(parseInstant(value), null, value);
  }
});

test("invalid time components are rejected", () => {
  for (const value of [
    "2026-10-27T24:00:00Z",
    "2026-10-27T10:60:00Z",
    "2026-10-27T10:00:60Z",
    "2026-10-27T23:59:60Z",
    "2026-10-27T1:00:00Z",
    "2026-10-27T10:00Z",
  ]) {
    assert.equal(parseInstant(value), null, value);
  }
});

test("invalid timezone offsets are rejected", () => {
  for (const value of [
    "2026-10-27T10:00:00+24:00",
    "2026-10-27T10:00:00+05:60",
    "2026-10-27T10:00:00+0500",
    "2026-10-27T10:00:00+05",
    "2026-10-27T10:00:00 +05:00",
    "2026-10-27T10:00:00z",
    "2026-10-27T10:00:00UTC",
    "2026-10-27T10:00:00GMT+1",
  ]) {
    assert.equal(parseInstant(value), null, value);
  }
});

test("ambiguous, partial and non-string values are rejected", () => {
  for (const value of [
    "1",
    "2026",
    "2026-11",
    "2026-11-04",
    "2026-11-04T10:00:00",
    "2026-11-04T10:00:00.000",
    "2026-11-04 10:00:00Z",
    "20261104T100000Z",
    "October 27, 2026 08:00",
    "Tue, 27 Oct 2026 08:00:00 GMT",
    "11/04/2026",
    "yesterday",
    " 2026-11-04T10:00:00Z",
    "2026-11-04T10:00:00Z ",
    "",
    1_762_250_000_000,
    0,
    true,
    {},
    [],
  ]) {
    assert.equal(parseInstant(value), null, JSON.stringify(value));
  }
});

test("missing, null, valid, malformed and future timestamps are distinguished", () => {
  assert.deepEqual(checkHistoricalTimestamp(undefined, NOW), { kind: "missing" });
  assert.deepEqual(checkHistoricalTimestamp(null, NOW), { kind: "null" });
  assert.deepEqual(checkHistoricalTimestamp("2026-02-30T10:00:00Z", NOW), { kind: "malformed" });
  assert.deepEqual(checkHistoricalTimestamp(PAST, NOW), { kind: "valid", value: PAST, time: NOW - 3_600_000 });
  assert.equal(checkHistoricalTimestamp(FAR_FUTURE, NOW).kind, "future");
  for (const value of [undefined, null, "2026", FAR_FUTURE]) assert.equal(historicalTimestampOrNull(value, NOW), null);
  assert.equal(historicalTimestampOrNull(PAST, NOW), PAST);
});

test("clock-skew tolerance is five minutes and inclusive", () => {
  assert.equal(CLOCK_SKEW_TOLERANCE_MS, 300_000);
  assert.equal(checkHistoricalTimestamp(AT_TOLERANCE, NOW).kind, "valid");
  assert.equal(checkHistoricalTimestamp("2026-11-04T14:05:00+02:00", NOW).kind, "valid");
  assert.equal(checkHistoricalTimestamp(JUST_BEYOND, NOW).kind, "future");
  assert.equal(checkHistoricalTimestamp(AT_TOLERANCE, NOW - 1).kind, "future");
});

const severity = (last_synced_at: unknown) =>
  normalizeSecuritySeverity(
    { data: { scope: ALL, status: "ready", counts: { critical: 1, high: 0, medium: 0, low: 0 }, source: "s", last_synced_at } },
    ALL,
    NOW,
  );
const coverage = (last_synced_at: unknown) =>
  normalizeSecurityCoverage(
    { data: { scope: ALL, status: "ready", controls: [{ key: "mdr", status: "covered" }], source: "s", last_synced_at } },
    ALL,
    NOW,
  );
const backup = (last_synced_at: unknown, status = "ready") =>
  normalizeBackupHealth({ data: { scope: ALL, status, protected_assets: 3, source: "s", last_synced_at } }, ALL, NOW);
const insights = (last_synced_at: unknown) =>
  normalizeInsights({ data: { scope: ALL, status: "ready", insights: [], source: "s", last_synced_at } }, ALL, NOW);
const overview = (last_synced_at: unknown) =>
  normalizeCustomerOverview(
    {
      data: {
        scope: ALL,
        status: "ready",
        customers: [{ id: 1, name: "Fixture", security_reporting: "available", backup_reporting: "available" }],
        source: "s",
        last_synced_at,
      },
    },
    ALL,
    NOW,
  );
const asset = (last_synced_at: unknown) => {
  const result = normalizeAssetSummary(
    { data: { scope: ALL, metrics: [{ key: "users", status: "ready", value: 4, source: "s", last_synced_at }] } },
    ALL,
    NOW,
  );
  return result.ok ? result.metrics.users : { kind: "error" as const, message: result.message };
};
const syncOf = (state: object) => ("lastSyncedAt" in state ? state.lastSyncedAt : "not-applicable");

const panels = { asset, severity, coverage, backup, insights, overview };

test("every panel rejects future, malformed and ambiguous sync times while keeping its data", () => {
  for (const [name, normalize] of Object.entries(panels)) {
    for (const value of [PAST, AT_TOLERANCE]) assert.equal(syncOf(normalize(value)), value, `${name} ${value}`);
    for (const value of [JUST_BEYOND, FAR_FUTURE, "2026-02-30T10:00:00Z", "2026-11-04", "1", "2026-11-04T10:00:00", 5, null, undefined]) {
      const state = normalize(value);
      assert.equal(state.kind, "ready", `${name} ${String(value)} keeps data`);
      assert.equal(syncOf(state), null, `${name} ${String(value)} shows "Sync time not provided"`);
    }
  }
});

test("stale data keeps its stale state with valid or rejected sync times", () => {
  assert.deepEqual(backup(PAST, "stale"), {
    kind: "stale",
    protectedAssets: 3,
    freshness: null,
    jobOutcomes: null,
    source: "s",
    lastSyncedAt: PAST,
  });
  const future = backup(FAR_FUTURE, "stale");
  assert.equal(future.kind, "stale");
  assert.equal(syncOf(future), null);
});

test("empty and unavailable states use null sync time when the timestamp is future", () => {
  for (const status of ["empty", "unavailable"]) {
    assert.deepEqual(backup(FAR_FUTURE, status), { kind: status, source: "s", lastSyncedAt: null });
  }
});

test("insight observed and updated times reject future and ambiguous values", () => {
  const item = (extra: Record<string, unknown>) => ({ id: 1, category: "tip", title: "T", summary: "S", source: "s", ...extra });
  const state = normalizeInsights(
    {
      data: {
        scope: ALL,
        status: "ready",
        source: "s",
        last_synced_at: PAST,
        insights: [
          item({ id: 1, observed_at: PAST, updated_at: AT_TOLERANCE }),
          item({ id: 2, observed_at: FAR_FUTURE, updated_at: "2026-11-04" }),
          item({ id: 3, observed_at: "2026-02-30T00:00:00Z", updated_at: JUST_BEYOND }),
        ],
      },
    },
    ALL,
    NOW,
  );
  assert.ok(state.kind === "ready");
  assert.deepEqual(
    state.insights.map((i) => [i.observedAt, i.updatedAt]),
    [[PAST, AT_TOLERANCE], [null, null], [null, null]],
  );
});

test("customer records with future or malformed sync times are rejected; missing or null stay unsynced", () => {
  const record = (extra: Record<string, unknown>) =>
    normalizeCustomerOverview(
      {
        data: {
          scope: B,
          status: "ready",
          source: "s",
          last_synced_at: PAST,
          customers: [{ id: 202, name: "Fixture B", security_reporting: "available", backup_reporting: "stale", ...extra }],
        },
      },
      B,
      NOW,
    );
  for (const value of [JUST_BEYOND, FAR_FUTURE, "2026-02-30T10:00:00Z", "2026-11-04", "2026-11-04T10:00:00"]) {
    assert.equal(record({ last_synced_at: value }).kind, "error", value);
  }
  for (const [extra, expected] of [[{ last_synced_at: AT_TOLERANCE }, AT_TOLERANCE], [{ last_synced_at: null }, null], [{}, null]] as const) {
    const state = record(extra);
    assert.ok(state.kind === "ready");
    assert.equal(state.customers[0].lastSyncedAt, expected);
  }
  assert.equal(record({ last_synced_at: PAST }).kind, "ready");
  assert.equal(normalizeCustomerOverview({ data: { scope: B, status: "ready", customers: [{ id: 101, name: "A", security_reporting: "available", backup_reporting: "available" }], source: "s" } }, B, NOW).kind, "error");
});

const counts = { successful: 10, partially_successful: 1, degraded_or_failed: 0, not_available: 0 };
const windowed = (window: Record<string, unknown>, now = NOW) =>
  normalizeBackupHealth(
    {
      data: {
        scope: ALL,
        status: "ready",
        protected_assets: 3,
        source: "s",
        last_synced_at: PAST,
        job_outcomes: { period: "last_24_hours", basis: "job_executions", counts, ...window },
      },
    },
    ALL,
    now,
  );
const windowOf = (state: ReturnType<typeof normalizeBackupHealth>) =>
  state.kind === "ready" && state.jobOutcomes ? [state.jobOutcomes.windowStart, state.jobOutcomes.windowEnd] : state.kind;

test("backup reporting windows accept ordered strict boundaries and keep the last_24_hours period", () => {
  const state = windowed({ window_start: "2026-11-03T12:00:00Z", window_end: "2026-11-04T12:00:00Z" });
  assert.deepEqual(windowOf(state), ["2026-11-03T12:00:00Z", "2026-11-04T12:00:00Z"]);
  assert.equal(state.kind === "ready" && state.jobOutcomes?.period, "last_24_hours");
  assert.deepEqual(windowOf(windowed({ window_start: "2026-11-03T14:00:00+02:00", window_end: "2026-11-04T06:00:00-06:00" })), [
    "2026-11-03T14:00:00+02:00",
    "2026-11-04T06:00:00-06:00",
  ]);
  assert.deepEqual(windowOf(windowed({ window_end: AT_TOLERANCE })), [null, AT_TOLERANCE]);
  assert.deepEqual(windowOf(windowed({ window_start: null, window_end: null })), [null, null]);
});

test("equal, reversed, offset-reversed, malformed and future backup windows are rejected", () => {
  for (const window of [
    { window_start: "2026-11-04T12:00:00Z", window_end: "2026-11-04T12:00:00Z" },
    { window_start: "2026-11-04T14:00:00+02:00", window_end: "2026-11-04T12:00:00Z" },
    { window_start: "2026-11-04T12:00:00Z", window_end: "2026-11-03T12:00:00Z" },
    { window_start: "2026-11-04T10:00:00Z", window_end: "2026-11-04T05:00:00-04:00" },
    { window_start: "2026-11-03", window_end: "2026-11-04T12:00:00Z" },
    { window_start: "2026-11-03T12:00:00", window_end: "2026-11-04T12:00:00Z" },
    { window_start: "2026-02-30T12:00:00Z" },
    { window_end: 1_762_250_000_000 },
    { window_end: JUST_BEYOND },
    { window_start: "2026-11-04T13:00:00Z", window_end: "2026-11-05T13:00:00Z" },
    { window_start: FAR_FUTURE },
  ]) {
    assert.equal(windowed(window).kind, "error", JSON.stringify(window));
  }
});

test("a window ending in the past is not treated as sync evidence", () => {
  const state = normalizeBackupHealth(
    {
      data: {
        scope: ALL,
        status: "ready",
        protected_assets: 3,
        source: "s",
        job_outcomes: { period: "last_24_hours", basis: "job_executions", counts, window_start: "2026-11-03T11:00:00Z", window_end: PAST },
      },
    },
    ALL,
    NOW,
  );
  assert.ok(state.kind === "ready");
  assert.equal(state.lastSyncedAt, null);
});

test("customer scope checks still run before timestamps are considered", () => {
  const response = { data: { scope: ALL, status: "ready", protected_assets: 3, source: "s", last_synced_at: PAST } };
  assert.equal(normalizeBackupHealth(response, B, NOW).kind, "error");
  assert.equal(normalizeSecuritySeverity({ data: { ...response.data, counts: { critical: 0, high: 0, medium: 0, low: 1 } } }, B, NOW).kind, "error");
});

test("unavailable mock dashboard data stays unchanged and timestamp-free", async () => {
  const health = await getBackupHealth(B);
  assert.deepEqual(normalizeBackupHealth(health, B, NOW), { kind: "unavailable", source: null, lastSyncedAt: null });
  const overview = await getCustomerOverview(ALL);
  assert.equal(normalizeCustomerOverview(overview, ALL, NOW).kind, "unavailable");
});
