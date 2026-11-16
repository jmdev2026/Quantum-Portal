import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customersResponse } from "@/mocks/customers";
import { buildDemoSecurityDetections, demoDetectionRecords } from "@/demo/security-detections";
import { buildDemoSecuritySeverity } from "@/demo/security-severity";
import {
  DETECTIONS_SEPARATION_NOTICE,
  detectionFeedView,
  toDetectionDisplayItem,
  visibleDetections,
  type LoadedDetections,
} from "@/components/security/threats-detections-view";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  DETECTION_TEXT_LIMITS,
  MAX_DEMO_DETECTIONS,
  getDemoSecurityDetections,
  normalizeDemoSecurityDetections,
  type DetectionsState,
} from "@/services/security-detections";
import { SEVERITY_LEVELS, normalizeSecuritySeverity } from "@/services/security-severity";

const customers = customersResponse.data;
const ALL: DashboardScope = { type: "all" };
const one = (id: number): DashboardScope => ({ type: "customer", customer_id: id });
const normalize = (scope: DashboardScope) => normalizeDemoSecurityDetections(buildDemoSecurityDetections(scope), scope, customers);
const ready = (state: DetectionsState) => {
  assert.equal(state.kind, "ready", JSON.stringify(state));
  return state.kind === "ready" ? state.detections : [];
};
const valid = () => structuredClone(buildDemoSecurityDetections(ALL));
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const EXPECTED = {
  1: [
    ["demo-detection-a-1", "Suspicious email link example", "high"],
    ["demo-detection-a-2", "Unusual endpoint process example", "medium"],
  ],
  2: [
    ["demo-detection-b-1", "Illustrative sign-in anomaly", "critical"],
    ["demo-detection-b-2", "Externally reachable service example", "high"],
  ],
  3: [
    ["demo-detection-c-1", "Unexpected mailbox forwarding rule example", "medium"],
    ["demo-detection-c-2", "Unrecognized endpoint execution example", "low"],
  ],
} as const;
const shape = (list: { id: string; title: string; severity: string }[]) => list.map((d) => [d.id, d.title, d.severity]);

test("six valid fictional records exist in total", () => {
  const all = ready(normalize(ALL));
  assert.equal(all.length, 6);
  for (const d of all) assert.equal(d.source, "Simulated demo data");
});

test("exactly two records per demo customer", () => {
  const all = ready(normalize(ALL));
  for (const id of [1, 2, 3]) assert.equal(all.filter((d) => d.customerId === id).length, 2, String(id));
});

test("All Customers feed is the explicit six-record fixture", () => {
  const all = ready(normalize(ALL));
  assert.deepEqual(
    all.map((d) => d.id),
    ["demo-detection-b-1", "demo-detection-a-1", "demo-detection-b-2", "demo-detection-a-2", "demo-detection-c-1", "demo-detection-c-2"],
  );
  assert.match(read("src/demo/security-detections.ts"), /DEMO_ALL_CUSTOMER_DETECTION_REFS: readonly/);
});

for (const [id, name] of [[1, "A"], [2, "B"], [3, "C"]] as const) {
  test(`Customer ${name} feed shows only its two records`, () => {
    const list = ready(normalize(one(id)));
    assert.deepEqual(shape(list), EXPECTED[id]);
    assert.ok(list.every((d) => d.customerId === id && d.customerName === `Demo Customer ${name}`));
  });
}

test("record IDs are unique and stable", () => {
  const ids = ready(normalize(ALL)).map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ready(normalize(ALL)).map((d) => d.id));
  for (const id of ids) assert.match(id, /^demo-detection-[abc]-\d$/);
});

test("severities use the existing severity levels", () => {
  for (const d of ready(normalize(ALL))) assert.ok((SEVERITY_LEVELS as readonly string[]).includes(d.severity));
});

test("customer identity matches the canonical customer list", () => {
  for (const d of ready(normalize(ALL))) {
    assert.equal(customers.find((c) => c.id === d.customerId)?.name, d.customerName);
    assert.equal(toDetectionDisplayItem(d).scopeLabel, d.customerName);
  }
});

test("content is concise plain text with no markup", () => {
  for (const d of ready(normalize(ALL))) {
    for (const [text, limit] of [[d.title, DETECTION_TEXT_LIMITS.title], [d.summary, DETECTION_TEXT_LIMITS.summary]] as const) {
      assert.ok(text.length > 0 && text.length <= limit);
      assert.doesNotMatch(text, /[<>]|https?:|www\./);
    }
    assert.match(d.summary, /^Fictional example/);
  }
  const markup = valid();
  markup.data.detections![0].title = "<img src=x onerror=alert(1)>";
  assert.equal(normalizeDemoSecurityDetections(markup, ALL, customers).kind, "error");
});

test("no timestamps, provider IDs, emails, IPs or serials in records", () => {
  const raw = JSON.stringify(demoDetectionRecords(ALL));
  assert.doesNotMatch(raw, /_at"|timestamp|date|\d{4}-\d{2}-\d{2}|@|\b\d{1,3}(\.\d{1,3}){3}\b|serial|guardz|provider_id|external_id|https?:/i);
  for (const record of demoDetectionRecords(ALL)!) {
    assert.deepEqual(Object.keys(record).sort(), ["customer", "id", "severity", "source", "summary", "title"]);
  }
});

test("Live Mode is unavailable and shows no records", () => {
  const loaded: LoadedDetections = { mode: "demo", customerId: null, state: normalize(ALL) };
  assert.deepEqual(visibleDetections(loaded, "live", null), { kind: "unavailable" });
  assert.equal(detectionFeedView({ kind: "unavailable" }, "All Customers").status, "not-connected");
  assert.doesNotMatch(read("src/components/security/use-security-detections.ts"), /getSecurityDetections\(|fetch\(/);
  assert.match(read("src/components/security/use-security-detections.ts"), /if \(mode !== "demo"\) return;/);
});

test("demo records are displayed only in Demo Mode for the loaded scope", () => {
  const loaded: LoadedDetections = { mode: "demo", customerId: 2, state: normalize(one(2)) };
  const visible = visibleDetections(loaded, "demo", 2);
  assert.equal(ready(visible).length, 2);
  const view = detectionFeedView(visible, "Demo Customer B");
  assert.equal(view.status, "simulated");
  assert.equal(view.badge, "Simulated");
  assert.match(view.announcement, /Simulated example detections for Demo Customer B/);
});

test("Demo → Live clears records in the same render", () => {
  const loaded: LoadedDetections = { mode: "demo", customerId: null, state: normalize(ALL) };
  for (const customerId of [null, 1, 2, 3]) {
    assert.equal(visibleDetections({ ...loaded, customerId }, "live", customerId).kind, "unavailable");
  }
});

test("scope mismatch is rejected, including stale and out-of-order results", () => {
  assert.equal(normalizeDemoSecurityDetections(buildDemoSecurityDetections(one(1)), one(2), customers).kind, "error");
  assert.equal(normalizeDemoSecurityDetections(buildDemoSecurityDetections(ALL), one(1), customers).kind, "error");
  const wrongRecord = structuredClone(buildDemoSecurityDetections(one(2)));
  wrongRecord.data.detections![0] = structuredClone(buildDemoSecurityDetections(one(3)).data.detections![0]);
  assert.equal(normalizeDemoSecurityDetections(wrongRecord, one(2), customers).kind, "error");
  const stale: LoadedDetections = { mode: "demo", customerId: 1, state: normalize(one(1)) };
  for (const next of [null, 2, 3]) assert.equal(visibleDetections(stale, "demo", next).kind, "loading");
});

test("invalid customer IDs return an error, never another customer's data", async () => {
  for (const id of [999, 0, -1]) {
    const state = normalizeDemoSecurityDetections(await getDemoSecurityDetections(one(id)), one(id), customers);
    assert.equal(state.kind, "error", String(id));
  }
  assert.equal(demoDetectionRecords(one(999)), null);
});

test("duplicate IDs are rejected", () => {
  const dup = valid();
  dup.data.detections![1].id = dup.data.detections![0].id;
  assert.equal(normalizeDemoSecurityDetections(dup, ALL, customers).kind, "error");
});

test("malformed records and responses are rejected", () => {
  const mutations: ((r: ReturnType<typeof valid>) => void)[] = [
    (r) => ((r.data.detections![0] as { severity: string }).severity = "severe"),
    (r) => (r.data.detections![0].title = "   "),
    (r) => (r.data.detections![0].summary = "x".repeat(DETECTION_TEXT_LIMITS.summary + 1)),
    (r) => (r.data.detections![0].customer = { id: 1, name: "Demo Customer B" }),
    (r) => (r.data.detections![0].customer = { id: 1.5, name: "Demo Customer A" }),
    (r) => (r.data.detections![0].source = "Guardz"),
    (r) => (r.data.detections![0].id = ""),
    (r) => (r.data.detections = Array.from({ length: MAX_DEMO_DETECTIONS + 1 }, (_, i) => ({ ...r.data.detections![0], id: `d-${i}` }))),
    (r) => ((r.data as { detections: unknown }).detections = "nope"),
    (r) => ((r.data as { status: string }).status = "unknown"),
  ];
  for (const [index, mutate] of mutations.entries()) {
    const response = valid();
    mutate(response);
    assert.equal(normalizeDemoSecurityDetections(response, ALL, customers).kind, "error", `mutation ${index}`);
  }
  assert.equal(normalizeDemoSecurityDetections(null, ALL, customers).kind, "error");
  assert.equal(normalizeDemoSecurityDetections({ data: [] }, ALL, customers).kind, "error");
});

test("detections are not reconciled with security issue totals", () => {
  const totals = { all: 80, 1: 24, 2: 31, 3: 25 } as const;
  for (const [key, scope] of [["all", ALL], [1, one(1)], [2, one(2)], [3, one(3)]] as const) {
    const severity = normalizeSecuritySeverity(buildDemoSecuritySeverity(scope), scope);
    assert.equal(severity.kind === "ready" ? severity.total : null, totals[key]);
    assert.notEqual(ready(normalize(scope)).length, totals[key]);
  }
  const sources = [
    "src/services/security-detections.ts",
    "src/demo/security-detections.ts",
    "src/components/security/use-security-detections.ts",
    "src/components/security/threats-detections-panel.tsx",
  ].map(read);
  for (const source of sources) {
    assert.doesNotMatch(source, /import[^;]*(security-severity-view|security-coverage|use-security-severity|insights)/);
  }
  assert.equal(
    DETECTIONS_SEPARATION_NOTICE,
    "Example detection records only. This illustrative feed is separate from the Security Overview issue totals.",
  );
});

test("Security Overview metrics are unaffected by the detection feed", () => {
  const overview = read("src/components/security/security-overview-metrics.ts") + read("src/components/security/security-overview-panel.tsx");
  assert.doesNotMatch(overview, /detection/i);
  const severity = normalizeSecuritySeverity(buildDemoSecuritySeverity(one(2)), one(2));
  const loading = { kind: "loading" } as const;
  const metrics = securityOverviewMetrics({ severity, coverage: loading, insights: loading });
  assert.deepEqual(
    metrics.slice(0, 2).map((m) => (m.value.kind === "value" ? m.value.value : m.value.kind)),
    ["31", "2"],
  );
});
