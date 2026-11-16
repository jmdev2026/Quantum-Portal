import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customersResponse } from "@/mocks/customers";
import { buildDemoSecurityEndpoints } from "@/demo/security-endpoints";
import { buildDemoSecurityIdentities } from "@/demo/security-identities";
import { DEMO_ALL_CUSTOMER_ASSETS, DEMO_CUSTOMER_ASSETS } from "@/demo/dashboard-assets";
import { buildDemoSecurityDetections } from "@/demo/security-detections";
import { buildDemoSecuritySeverity } from "@/demo/security-severity";
import {
  VISIBILITY_AREAS,
  identitiesEndpointsAnnouncement,
  visibilityAreaView,
  visibleVisibilityRecords,
  type LoadedVisibilityRecords,
} from "@/components/security/identities-endpoints-view";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  MAX_DEMO_VISIBILITY_RECORDS,
  VISIBILITY_TEXT_LIMITS,
  getDemoVisibilityRecords,
  normalizeDemoVisibilityRecords,
  type VisibilityRecordKind,
  type VisibilityRecordsState,
} from "@/services/security-visibility-records";
import { normalizeSecuritySeverity } from "@/services/security-severity";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const customers = customersResponse.data;
const ALL: DashboardScope = { type: "all" };
const one = (id: number): DashboardScope => ({ type: "customer", customer_id: id });
const KINDS = ["identities", "endpoints"] as const;
const build = { identities: buildDemoSecurityIdentities, endpoints: buildDemoSecurityEndpoints };
const LETTERS: Record<number, string> = { 1: "A", 2: "B", 3: "C" };

const normalize = (kind: VisibilityRecordKind, scope: DashboardScope, response: unknown = build[kind](scope)) =>
  normalizeDemoVisibilityRecords(response, kind, scope, customers);
const ready = (state: VisibilityRecordsState) => {
  assert.equal(state.kind, "ready", JSON.stringify(state));
  return (state as Extract<VisibilityRecordsState, { kind: "ready" }>).records;
};
const errorOf = (state: VisibilityRecordsState) => {
  assert.equal(state.kind, "error", JSON.stringify(state));
  return (state as Extract<VisibilityRecordsState, { kind: "error" }>).message;
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const mutated = (kind: VisibilityRecordKind, scope: DashboardScope, change: (records: Record<string, unknown>[]) => void) => {
  const response = clone(build[kind](scope));
  change(response.data.records as unknown as Record<string, unknown>[]);
  return normalize(kind, scope, response);
};

test("1. six fictional identity records exist", () => {
  const names = ready(normalize("identities", ALL)).map((r) => r.name).sort();
  assert.deepEqual(names, ["A-01", "A-02", "B-01", "B-02", "C-01", "C-02"].map((n) => `Demo Account ${n}`));
});

test("2. six fictional endpoint records exist", () => {
  const names = ready(normalize("endpoints", ALL)).map((r) => r.name).sort();
  assert.deepEqual(names, ["A-01", "A-02", "B-01", "B-02", "C-01", "C-02"].map((n) => `Demo Endpoint ${n}`));
});

test("3. each customer has two identities and two endpoints", () => {
  for (const kind of KINDS) for (const id of [1, 2, 3]) assert.equal(ready(normalize(kind, one(id))).length, 2);
});

test("4. All Customers is an explicit fixture of six records each", () => {
  for (const kind of KINDS) {
    const records = ready(normalize(kind, ALL));
    assert.equal(records.length, 6);
    assert.deepEqual(records.map((r) => r.customerId), [1, 2, 3, 1, 2, 3]);
  }
  assert.match(read("src/demo/security-identities.ts"), /const DEMO_ALL_IDENTITIES = \[/);
  assert.match(read("src/demo/security-endpoints.ts"), /const DEMO_ALL_ENDPOINTS = \[/);
  assert.doesNotMatch(read("src/demo/visibility-records.ts"), /flatMap|Object\.values\(set\.byCustomer\)|concat/);
});

for (const id of [1, 2, 3]) {
  test(`${4 + id}. Demo Customer ${LETTERS[id]} view shows only its own records`, () => {
    for (const kind of KINDS) {
      const records = ready(normalize(kind, one(id)));
      assert.ok(records.every((r) => r.customerId === id && r.customerName === `Demo Customer ${LETTERS[id]}`));
      assert.ok(records.every((r) => r.name.endsWith(` ${LETTERS[id]}-01`) || r.name.endsWith(` ${LETTERS[id]}-02`)));
    }
  });
}

test("8. canonical customer names and IDs are used", () => {
  const canonical = new Map(customers.map((c) => [c.id, c.name]));
  for (const kind of KINDS) {
    for (const r of ready(normalize(kind, ALL))) assert.equal(canonical.get(r.customerId), r.customerName);
  }
  for (const kind of KINDS) {
    assert.match(errorOf(mutated(kind, ALL, (rs) => ((rs[0].customer as { name: string }).name = "Customer A"))), /invalid/);
    assert.match(errorOf(mutated(kind, ALL, (rs) => ((rs[0].customer as { id: number }).id = 9))), /invalid/);
  }
});

test("9. record IDs and names are unique across both lists", () => {
  const all = KINDS.flatMap((kind) => ready(normalize(kind, ALL)));
  assert.equal(new Set(all.map((r) => r.id)).size, 12);
  assert.equal(new Set(all.map((r) => r.name)).size, 12);
  const detectionIds = buildDemoSecurityDetections(ALL).data.detections!.map((d) => d.id);
  assert.ok(all.every((r) => !detectionIds.includes(r.id)));
});

test("10. scope and kind mismatches are rejected", () => {
  for (const kind of KINDS) {
    assert.match(errorOf(normalize(kind, one(1), build[kind](one(2)))), /did not match/);
    assert.match(errorOf(normalize(kind, ALL, build[kind](one(1)))), /did not match/);
    assert.match(errorOf(normalize(kind, one(1), build[kind](ALL))), /did not match/);
    assert.match(errorOf(mutated(kind, one(1), (rs) => ((rs[0].customer as { id: number; name: string }) = { id: 2, name: "Demo Customer B" }))), /out-of-scope/);
  }
  assert.match(errorOf(normalize("identities", ALL, buildDemoSecurityEndpoints(ALL))), /unexpected format/);
  assert.match(errorOf(normalize("endpoints", ALL, buildDemoSecurityIdentities(ALL))), /unexpected format/);
});

test("11. unknown customer IDs give a safe error with no fallback", () => {
  for (const kind of KINDS) {
    for (const bad of [0, 4, 99, -1]) {
      const response = build[kind](one(bad));
      assert.equal(response.data.records, null);
      assert.equal(errorOf(normalize(kind, one(bad), response)), "No demonstration data exists for this customer.");
    }
  }
});

test("12. duplicate records are rejected", () => {
  for (const kind of KINDS) {
    assert.match(errorOf(mutated(kind, ALL, (rs) => rs.push(clone(rs[0])))), /duplicate/);
    assert.match(errorOf(mutated(kind, ALL, (rs) => (rs[1].id = rs[0].id))), /duplicate/);
    assert.match(errorOf(mutated(kind, ALL, (rs) => (rs[3].name = rs[0].name))), /duplicate/);
  }
});

test("13. malformed, over-long, marked-up and mis-shaped records are rejected", () => {
  const breakers: ((r: Record<string, unknown>) => void)[] = [
    (r) => delete r.id,
    (r) => (r.id = "  "),
    (r) => (r.name = ""),
    (r) => (r.name = "Jane Smith"),
    (r) => (r.observation = ""),
    (r) => (r.observation = "A real sign-in review."),
    (r) => (r.observation = `Fictional ${"x".repeat(VISIBILITY_TEXT_LIMITS.observation)}`),
    (r) => (r.observation = "Fictional <b>example</b>"),
    (r) => (r.protection_visibility = "Protected"),
    (r) => (r.source = "Guardz"),
    (r) => (r.extra = "field"),
    (r) => (r.customer = "Demo Customer A"),
  ];
  for (const kind of KINDS) {
    for (const breaker of breakers) assert.match(errorOf(mutated(kind, ALL, (rs) => breaker(rs[0]))), /invalid/);
    assert.match(errorOf(normalize(kind, ALL, null)), /unexpected format/);
    assert.match(errorOf(normalize(kind, ALL, { data: { ...build[kind](ALL).data, records: "six" } })), /unexpected format/);
    assert.match(errorOf(normalize(kind, ALL, { data: { ...build[kind](ALL).data, source: "Live" } })), /unexpected format/);
    const many = Array.from({ length: MAX_DEMO_VISIBILITY_RECORDS + 1 }, () => build[kind](ALL).data.records![0]);
    assert.match(errorOf(normalize(kind, ALL, { data: { ...build[kind](ALL).data, records: many } })), /Too many/);
  }
});

test("14. no private or real-looking identifiers in the fixtures", () => {
  const fixtures = (read("src/demo/security-identities.ts") + read("src/demo/security-endpoints.ts")).replace(/^import .*$/gm, "");
  assert.doesNotMatch(fixtures, /@|https?:|www\.|\b\d{1,3}(\.\d{1,3}){3}\b|serial|hostname|hardware|mac address|\b(windows|macos|ubuntu)\b/i);
  for (const kind of KINDS) {
    for (const r of ready(normalize(kind, ALL))) {
      assert.match(r.observation, /^Fictional example/);
      assert.match(r.protectionVisibility, /^Not verified\./);
      assert.equal(r.source, "Simulated demo data");
      assert.doesNotMatch(`${r.observation} ${r.protectionVisibility}`, /\b(is|are) (compromised|protected|monitored|healthy|high risk)\b|agent (is )?deployed/i);
    }
  }
  assert.match(errorOf(mutated("identities", ALL, (rs) => (rs[0].observation = "Fictional example for user@example.test"))), /invalid/);
  assert.match(errorOf(mutated("endpoints", ALL, (rs) => (rs[0].observation = "Fictional example on 10.0.0.12"))), /invalid/);
});

test("15. no timestamps are inserted", () => {
  for (const kind of KINDS) {
    const response = build[kind](ALL);
    assert.doesNotMatch(JSON.stringify(response), /_at"|\d{4}-\d{2}-\d{2}|sync/i);
    assert.match(errorOf(mutated(kind, ALL, (rs) => (rs[0].last_seen_at = "2026-01-01T00:00:00Z"))), /invalid/);
  }
});

test("16. no provider or network requests are made", async () => {
  const sources = ["src/services/security-visibility-records.ts", "src/demo/visibility-records.ts", "src/components/security/use-visibility-records.ts"]
    .map(read)
    .join("\n")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(sources, /fetch\(|axios|XMLHttpRequest|WebSocket|guardz|datto|laravel|token|credential|insert\(|update\(/i);
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (() => {
    calls += 1;
    throw new Error("network");
  }) as typeof fetch;
  try {
    for (const kind of KINDS) ready(normalize(kind, ALL, await getDemoVisibilityRecords(kind, ALL)));
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(calls, 0);
});

test("17. Live Mode is unavailable with the exact not-connected wording", () => {
  const loaded = { mode: "demo" as const, customerId: null, state: normalize("identities", ALL) };
  const state = visibleVisibilityRecords(loaded, "live", null);
  assert.deepEqual(state, { kind: "unavailable" });
  const [identities, endpoints] = VISIBILITY_AREAS.map((area) => visibilityAreaView(state, area, "All Customers"));
  assert.ok(identities.status === "not-connected" && endpoints.status === "not-connected");
  assert.equal(identities.title, "Identity security information is not connected.");
  assert.equal(endpoints.title, "Endpoint security information is not connected.");
  assert.doesNotMatch(JSON.stringify([identities, endpoints]), /\b0\b|no threats|synced|connected to/i);
});

test("18. Demo Mode shows simulated records labelled as an illustrative sample", () => {
  for (const area of VISIBILITY_AREAS) {
    const view = visibilityAreaView(normalize(area.id, one(2)), area, "Demo Customer B");
    assert.equal(view.status, "simulated");
    if (view.status !== "simulated") return;
    assert.equal(view.badge, "Simulated");
    assert.equal(view.records.length, 2);
    assert.match(view.sampleNote, /Illustrative sample only\. Not a complete list/);
  }
  const ids = normalize("identities", ALL);
  assert.match(identitiesEndpointsAnnouncement("demo", ids, normalize("endpoints", ALL), "All Customers"), /simulated, fictional example records/);
  const panel = read("src/components/security/identities-endpoints-panel.tsx");
  const card = read("src/components/security/visibility-area-card.tsx");
  assert.equal(panel.match(/data-simulated/g)?.length, 1);
  assert.doesNotMatch(card, /data-simulated/);
  assert.match(card, /\(fictional example\)/);
  assert.match(card, /Protection visibility \(unverified\)/);
  assert.match(card, /Source:/);
});

test("19. Demo to Live clears records immediately", () => {
  for (const kind of KINDS) {
    const loaded = { mode: "demo" as const, customerId: 1, state: normalize(kind, one(1)) };
    assert.equal(visibleVisibilityRecords(loaded, "demo", 1).kind, "ready");
    assert.deepEqual(visibleVisibilityRecords(loaded, "live", 1), { kind: "unavailable" });
  }
});

test("20. rapid or out-of-order customer switching never shows another customer's records", () => {
  for (const kind of KINDS) {
    const lateForA: LoadedVisibilityRecords = { mode: "demo" as const, customerId: 1, state: normalize(kind, one(1)) };
    for (const current of [null, 2, 3]) assert.deepEqual(visibleVisibilityRecords(lateForA, "demo", current), { kind: "loading" });
    const lateForAll: LoadedVisibilityRecords = { mode: "demo" as const, customerId: null, state: normalize(kind, ALL) };
    for (const current of [1, 2, 3]) assert.deepEqual(visibleVisibilityRecords(lateForAll, "demo", current), { kind: "loading" });
    const liveLoaded = { mode: "live" as const, customerId: 2, state: { kind: "loading" } as const };
    assert.deepEqual(visibleVisibilityRecords(liveLoaded, "demo", 2), { kind: "loading" });
  }
  const hook = read("src/components/security/use-visibility-records.ts");
  assert.match(hook, /if \(!cancelled\)/);
  assert.match(hook, /cancelled = true/);
});

test("21. dashboard Users and Devices figures are unchanged and not derived from records", () => {
  assert.equal(DEMO_ALL_CUSTOMER_ASSETS.users, 146);
  assert.equal(DEMO_ALL_CUSTOMER_ASSETS.devices, 83);
  assert.deepEqual([...DEMO_CUSTOMER_ASSETS].map(([id, a]) => [id, a.users, a.devices]), [
    [1, 62, 35],
    [2, 48, 27],
    [3, 36, 21],
  ]);
  const ui = ["identities-endpoints-panel.tsx", "visibility-area-card.tsx", "identities-endpoints-view.ts", "use-visibility-records.ts"]
    .map((f) => read(`src/components/security/${f}`))
    .join("\n");
  assert.doesNotMatch(ui, /\{[^}]*\.length\}|asset|users:|devices:|coverage|severity|insight/i);
});

test("22. Security Overview figures are unchanged", () => {
  const totals = [ALL, one(1), one(2), one(3)].map((scope) => {
    const state = normalizeSecuritySeverity(buildDemoSecuritySeverity(scope), scope);
    assert.equal(state.kind, "ready");
    return state.kind === "ready" ? state.total : null;
  });
  assert.deepEqual(totals, [80, 24, 31, 25]);
});

test("23. the six detections are unchanged", () => {
  assert.deepEqual(
    buildDemoSecurityDetections(ALL).data.detections!.map((d) => [d.id, d.severity, d.customer.id]),
    [
      ["demo-detection-b-1", "critical", 2],
      ["demo-detection-a-1", "high", 1],
      ["demo-detection-b-2", "high", 2],
      ["demo-detection-a-2", "medium", 1],
      ["demo-detection-c-1", "medium", 3],
      ["demo-detection-c-2", "low", 3],
    ],
  );
});

test("24. no administrative or response controls exist", () => {
  const ui = read("src/components/security/identities-endpoints-panel.tsx") + read("src/components/security/visibility-area-card.tsx");
  assert.doesNotMatch(ui, /<button|onClick|href=|<a\s|<input|<select|<form|tabIndex|dangerouslySetInnerHTML|setInterval/);
  const copy = KINDS.flatMap((kind) => ready(normalize(kind, ALL)).flatMap((r) => [r.observation, r.protectionVisibility])).join(" ");
  assert.doesNotMatch(
    `${ui} ${copy}`,
    /quarantine|isolat|disable|reset password|enforce mfa|remediat|install|provision|remote command|\bexport\b(?! function)|refresh|view details|search|filter|paginat/i,
  );
});
