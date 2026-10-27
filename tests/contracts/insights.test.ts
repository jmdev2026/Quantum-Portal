import test from "node:test";
import assert from "node:assert/strict";
import {
  getInsights,
  INSIGHT_TEXT_LIMITS,
  MAX_DISPLAYED_INSIGHTS,
  normalizeInsights as n,
} from "@/services/insights";

const ALL = { type: "all" } as const;
const B = { type: "customer", customer_id: 2 } as const;
const sync = { source: "test-source", last_synced_at: "2026-10-27T08:00:00Z" };
const item = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  category: "security",
  title: "Fixture title",
  summary: "Fixture summary",
  priority: "high",
  source: "fixture-provider",
  observed_at: "2026-10-26T10:00:00Z",
  updated_at: "2026-10-27T07:00:00Z",
  ...overrides,
});
const res = (data: Record<string, unknown>) => ({ data: { scope: ALL, ...sync, ...data } });
const ready = (insights: unknown) => n(res({ status: "ready", insights }), ALL);

test("ready returns normalized insights and sync info", () => {
  assert.deepEqual(ready([item()]), {
    kind: "ready",
    insights: [
      {
        id: "1",
        category: "security",
        title: "Fixture title",
        summary: "Fixture summary",
        priority: "high",
        source: "fixture-provider",
        observedAt: "2026-10-26T10:00:00Z",
        updatedAt: "2026-10-27T07:00:00Z",
      },
    ],
    hiddenCount: 0,
    source: "test-source",
    lastSyncedAt: "2026-10-27T08:00:00Z",
  });
});

test("all three categories and every priority are accepted", () => {
  const insights = ["security", "tip", "operations"].flatMap((category, c) =>
    ["critical", "high", "medium", "low", "informational", null, undefined].map((priority, p) =>
      item({ id: `${c}-${p}`, category, priority }),
    ),
  );
  const s = ready(insights);
  assert.equal(s.kind, "ready");
  assert.equal(s.kind === "ready" && s.insights.length, 21);
  assert.equal(s.kind === "ready" && s.insights.filter((i) => i.priority === null).length, 6);
});

test("backend order is preserved (no client-side ranking)", () => {
  const s = ready([item({ id: 3, priority: "low" }), item({ id: 1, priority: "critical" }), item({ id: 2 })]);
  assert.deepEqual(s.kind === "ready" && s.insights.map((i) => i.id), ["3", "1", "2"]);
});

test("stale keeps insights and is identified as stale", () => {
  const s = n(res({ status: "stale", insights: [item()] }), ALL);
  assert.equal(s.kind, "stale");
  assert.equal(s.kind === "stale" && s.insights.length, 1);
});

test("ready with an empty list is valid and distinct from unavailable", () => {
  const s = ready([]);
  assert.equal(s.kind, "ready");
  assert.deepEqual(s.kind === "ready" && s.insights, []);
});

test("empty status is preserved separately from unavailable", () => {
  assert.equal(n(res({ status: "empty", insights: [] }), ALL).kind, "empty");
  assert.equal(n(res({ status: "unavailable", insights: null }), ALL).kind, "unavailable");
});

test("empty and unavailable never carry insights, even if sent", () => {
  for (const status of ["empty", "unavailable"]) {
    assert.deepEqual(n(res({ status, insights: [item()] }), ALL), {
      kind: status,
      source: "test-source",
      lastSyncedAt: "2026-10-27T08:00:00Z",
    });
  }
});

test("missing or non-array insight collection is rejected for ready and stale", () => {
  for (const status of ["ready", "stale"]) {
    for (const bad of [undefined, null, "x", 1, { 0: item() }]) {
      assert.equal(n(res({ status, insights: bad }), ALL).kind, "error", `${status} ${JSON.stringify(bad)}`);
    }
  }
});

test("duplicate insight ids are rejected", () => {
  assert.equal(ready([item({ id: 7 }), item({ id: 7 })]).kind, "error");
  assert.equal(ready([item({ id: "abc" }), item({ id: " abc " })]).kind, "error");
  assert.equal(ready([item({ id: 7 }), item({ id: "7" })]).kind, "error");
});

for (const [label, overrides] of [
  ["unknown category", { category: "backup" }],
  ["missing category", { category: undefined }],
  ["unknown priority", { priority: "urgent" }],
  ["numeric priority", { priority: 1 }],
  ["missing id", { id: undefined }],
  ["negative id", { id: -1 }],
  ["decimal id", { id: 1.5 }],
  ["blank id", { id: "  " }],
  ["over-long id", { id: "x".repeat(INSIGHT_TEXT_LIMITS.id + 1) }],
  ["object id", { id: { value: 1 } }],
  ["missing title", { title: undefined }],
  ["blank title", { title: "   " }],
  ["non-string title", { title: 42 }],
  ["missing summary", { summary: null }],
  ["non-string summary", { summary: ["a"] }],
] as const) {
  test(`${label} rejects the response`, () => {
    assert.equal(ready([item(), item({ id: 99, ...overrides })]).kind, "error");
  });
}

test("non-object insight entries are rejected", () => {
  for (const bad of [null, "insight", 5, [item()]]) {
    assert.equal(ready([bad]).kind, "error", JSON.stringify(bad));
  }
});

test("long text is bounded to display limits", () => {
  const s = ready([item({ title: "T".repeat(1000), summary: "S".repeat(5000), source: "P".repeat(500) })]);
  assert.ok(s.kind === "ready");
  const [insight] = s.insights;
  assert.equal(insight.title.length, INSIGHT_TEXT_LIMITS.title);
  assert.equal(insight.summary.length, INSIGHT_TEXT_LIMITS.summary);
  assert.equal(insight.source?.length, INSIGHT_TEXT_LIMITS.source);
  assert.ok(insight.title.endsWith("…") && insight.summary.endsWith("…"));
});

test("whitespace is collapsed so text cannot inflate the layout", () => {
  const s = ready([item({ title: "  Line\n\n\none\t\ttwo  ", summary: "a\n\n\n\n\nb" })]);
  assert.equal(s.kind === "ready" && s.insights[0].title, "Line one two");
  assert.equal(s.kind === "ready" && s.insights[0].summary, "a b");
});

test("markup in provider text is kept as inert plain text", () => {
  const payload = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
  const s = ready([item({ title: payload, summary: payload })]);
  assert.equal(s.kind === "ready" && s.insights[0].title, payload);
});

test("collections over the display cap are trimmed and the overflow counted", () => {
  const many = Array.from({ length: MAX_DISPLAYED_INSIGHTS + 7 }, (_, i) => item({ id: i }));
  const s = ready(many);
  assert.equal(s.kind === "ready" && s.insights.length, MAX_DISPLAYED_INSIGHTS);
  assert.equal(s.kind === "ready" && s.hiddenCount, 7);
});

test("invalid timestamps and blank sources become null", () => {
  const s = n(
    res({ status: "ready", source: " ", last_synced_at: "later", insights: [item({ observed_at: "x", updated_at: 5, source: "" })] }),
    ALL,
  );
  assert.ok(s.kind === "ready");
  assert.equal(s.source, null);
  assert.equal(s.lastSyncedAt, null);
  assert.deepEqual([s.insights[0].observedAt, s.insights[0].updatedAt, s.insights[0].source], [null, null, null]);
});

test("error status keeps a bounded provider message or falls back", () => {
  assert.deepEqual(n(res({ status: "error", message: "Provider timeout" }), ALL), { kind: "error", message: "Provider timeout" });
  const fallback = n(res({ status: "error" }), ALL);
  assert.ok(fallback.kind === "error" && fallback.message.length > 0);
  const long = n(res({ status: "error", message: "m".repeat(2000) }), ALL);
  assert.ok(long.kind === "error" && long.message.length <= 200);
});

test("unknown or missing status is rejected", () => {
  assert.equal(n(res({ status: "connected", insights: [item()] }), ALL).kind, "error");
  assert.equal(n(res({ insights: [item()] }), ALL).kind, "error");
});

test("response for a different customer is rejected", () => {
  assert.equal(n({ data: { scope: { type: "customer", customer_id: 3 }, status: "ready", insights: [item()] } }, B).kind, "error");
});

test("All Customers response is rejected for a single customer view, and vice versa", () => {
  assert.equal(n({ data: { scope: ALL, status: "ready", insights: [item()] } }, B).kind, "error");
  assert.equal(n({ data: { scope: B, status: "ready", insights: [item()] } }, ALL).kind, "error");
});

test("missing or malformed scope is rejected", () => {
  for (const scope of [undefined, null, {}, { type: "customer" }, { type: "customer", customer_id: "2" }]) {
    assert.equal(n({ data: { scope, status: "ready", insights: [] } }, B).kind, "error", JSON.stringify(scope));
  }
});

test("matching customer scope is accepted", () => {
  assert.equal(n({ data: { scope: B, status: "ready", insights: [item()] } }, B).kind, "ready");
});

test("malformed responses are rejected", () => {
  for (const bad of [null, undefined, "x", 4, [], {}, { data: null }, { data: [] }]) {
    assert.equal(n(bad, ALL).kind, "error", JSON.stringify(bad));
  }
});

test("mock service reports unavailable for All Customers with no insights", async () => {
  const response = await getInsights(ALL);
  assert.deepEqual(response.data.scope, ALL);
  assert.equal(response.data.status, "unavailable");
  assert.equal(response.data.insights, null);
  assert.equal(n(response, ALL).kind, "unavailable");
});

test("mock service echoes the selected customer scope", async () => {
  const response = await getInsights(B);
  assert.deepEqual(response.data.scope, B);
  assert.equal(response.data.insights, null);
  assert.equal(n(response, B).kind, "unavailable");
});
