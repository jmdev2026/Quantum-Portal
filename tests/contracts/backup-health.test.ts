import test from "node:test";
import assert from "node:assert/strict";
import { FRESHNESS_BUCKETS, getBackupHealth, normalizeBackupHealth as n } from "@/services/backup-health";

const ALL = { type: "all" } as const;
const B = { type: "customer", customer_id: 2 } as const;
const freshness = {
  less_than_1_hour: 40,
  "1_to_3_hours": 12,
  "4_to_24_hours": 5,
  more_than_24_hours: 2,
  no_successful_backup: 1,
};
const sync = { source: "datto-endpoint-backup", last_synced_at: "2026-10-27T08:00:00Z" };
const res = (data: Record<string, unknown>, scope: unknown = ALL) => ({ data: { scope, ...sync, ...data } });
const ready = (data: Record<string, unknown>) => n(res({ status: "ready", ...data }), ALL);
const isError = (s: ReturnType<typeof n>) => assert.equal(s.kind, "error");

test("ready returns protected assets, all five buckets and sync info", () => {
  assert.deepEqual(ready({ protected_assets: 60, freshness }), {
    kind: "ready",
    protectedAssets: 60,
    freshness,
    jobOutcomes: null,
    source: "datto-endpoint-backup",
    lastSyncedAt: "2026-10-27T08:00:00Z",
  });
});

test("contract defines exactly five freshness categories in order", () => {
  assert.deepEqual(
    FRESHNESS_BUCKETS.map((b) => b.key),
    ["less_than_1_hour", "1_to_3_hours", "4_to_24_hours", "more_than_24_hours", "no_successful_backup"],
  );
});

test("explicit zero is a valid protected asset count", () => {
  const s = ready({ protected_assets: 0, freshness: null });
  assert.equal(s.kind === "ready" && s.protectedAssets, 0);
});

test("explicit zero buckets stay zero and are not treated as unavailable", () => {
  const zeros = Object.fromEntries(FRESHNESS_BUCKETS.map((b) => [b.key, 0]));
  const s = ready({ protected_assets: null, freshness: zeros });
  assert.deepEqual(s.kind === "ready" && s.freshness, zeros);
});

test("null or missing protected asset count is unavailable, not zero", () => {
  for (const data of [{ protected_assets: null, freshness }, { freshness }]) {
    const s = ready(data);
    assert.equal(s.kind === "ready" && s.protectedAssets, null);
  }
});

test("invalid protected asset counts are rejected", () => {
  for (const value of [-1, 1.5, "10", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, true, {}, []]) {
    isError(ready({ protected_assets: value, freshness }));
  }
});

test("invalid bucket counts are rejected", () => {
  for (const value of [-1, 2.5, "3", NaN, Infinity, false, {}]) {
    isError(ready({ protected_assets: 5, freshness: { ...freshness, more_than_24_hours: value } }));
  }
});

test("partial buckets: missing or null buckets become unavailable, reported ones are kept", () => {
  const s = ready({ freshness: { less_than_1_hour: 3, "4_to_24_hours": null } });
  assert.deepEqual(s.kind === "ready" && s.freshness, {
    less_than_1_hour: 3,
    "1_to_3_hours": null,
    "4_to_24_hours": null,
    more_than_24_hours: null,
    no_successful_backup: null,
  });
  assert.equal(s.kind === "ready" && s.protectedAssets, null);
});

test("freshness with every bucket null collapses to unavailable", () => {
  const s = ready({ protected_assets: 4, freshness: { less_than_1_hour: null } });
  assert.equal(s.kind === "ready" && s.freshness, null);
});

test("freshness buckets are never summed into or checked against protected assets", () => {
  const s = ready({ protected_assets: 3, freshness });
  assert.equal(s.kind === "ready" && s.protectedAssets, 3);
  assert.deepEqual(s.kind === "ready" && s.freshness, freshness);
});

test("malformed freshness structures and unknown bucket keys are rejected", () => {
  for (const value of [[], "x", 5, true, { ...freshness, over_7_days: 1 }]) {
    isError(ready({ protected_assets: 5, freshness: value }));
  }
});

test("ready or stale without any valid metric is rejected", () => {
  for (const status of ["ready", "stale"]) {
    isError(n(res({ status, protected_assets: null, freshness: null }), ALL));
    isError(n(res({ status }), ALL));
  }
});

test("stale keeps data and timestamps", () => {
  const s = n(res({ status: "stale", protected_assets: 9, freshness }), ALL);
  assert.equal(s.kind, "stale");
  assert.equal(s.kind === "stale" && s.lastSyncedAt, "2026-10-27T08:00:00Z");
  assert.equal(s.kind === "stale" && s.protectedAssets, 9);
});

test("missing or unparseable timestamp and blank source become null", () => {
  const s = n({ data: { scope: ALL, status: "stale", protected_assets: 1, source: "  ", last_synced_at: "not-a-date" } }, ALL);
  assert.equal(s.kind === "stale" && s.lastSyncedAt, null);
  assert.equal(s.kind === "stale" && s.source, null);
  const t = n({ data: { scope: ALL, status: "ready", protected_assets: 1 } }, ALL);
  assert.equal(t.kind === "ready" && t.lastSyncedAt, null);
});

test("empty and unavailable carry no counts even if the response includes them", () => {
  for (const status of ["empty", "unavailable"] as const) {
    const s = n(res({ status, protected_assets: 50, freshness }), ALL);
    assert.deepEqual(s, { kind: status, source: "datto-endpoint-backup", lastSyncedAt: "2026-10-27T08:00:00Z" });
  }
});

test("error status uses provided message or a fallback", () => {
  assert.deepEqual(n(res({ status: "error", message: "Datto sync failed" }), ALL), {
    kind: "error",
    message: "Datto sync failed",
  });
  const s = n(res({ status: "error", message: "" }), ALL);
  assert.equal(s.kind === "error" && s.message, "The backup provider reported an error.");
});

test("unknown status is rejected", () => {
  for (const status of ["ok", "READY", "", null, undefined, 1]) isError(n(res({ status, protected_assets: 1 }), ALL));
});

test("malformed responses are rejected", () => {
  for (const value of [null, undefined, "x", 1, [], {}, { data: null }, { data: [] }, { data: "ready" }]) {
    isError(n(value, ALL));
  }
});

test("scope mismatch or malformed scope is rejected", () => {
  isError(n(res({ status: "ready", protected_assets: 1 }, B), ALL));
  isError(n(res({ status: "ready", protected_assets: 1 }, ALL), B));
  isError(n(res({ status: "ready", protected_assets: 1 }, { type: "customer", customer_id: 3 }), B));
  isError(n(res({ status: "ready", protected_assets: 1 }, { type: "customer", customer_id: "2" }), B));
  isError(n(res({ status: "ready", protected_assets: 1 }, null), ALL));
});

test("matching customer scope is accepted", () => {
  assert.equal(n(res({ status: "ready", protected_assets: 7 }, B), B).kind, "ready");
});

test("mock echoes requested scope, is unavailable and returns no numbers", async () => {
  for (const scope of [ALL, B]) {
    const response = await getBackupHealth(scope);
    assert.deepEqual(response.data.scope, scope);
    assert.equal(response.data.status, "unavailable");
    assert.equal(response.data.protected_assets, null);
    assert.equal(response.data.freshness, null);
    assert.deepEqual(n(response, scope), { kind: "unavailable", source: null, lastSyncedAt: null });
  }
});
