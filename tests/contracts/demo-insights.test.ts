import test from "node:test";
import assert from "node:assert/strict";
import { customersResponse } from "@/mocks/customers";
import {
  buildDemoInsights,
  DEMO_ALL_CUSTOMER_INSIGHTS,
  DEMO_CUSTOMER_INSIGHTS,
  DEMO_INSIGHTS_SOURCE,
  type DemoInsight,
} from "@/demo/insights";
import { DEMO_ALL_CUSTOMER_COVERAGE, DEMO_CUSTOMER_COVERAGE } from "@/demo/security-coverage";
import {
  getDemoInsights,
  getInsights,
  INSIGHT_CATEGORIES,
  INSIGHT_PRIORITIES,
  INSIGHT_TEXT_LIMITS,
  normalizeInsights,
  type InsightsState,
} from "@/services/insights";
import { insightsSource, visibleInsights, type LoadedInsights } from "@/components/dashboard/insights-view";
import { SECURITY_CONTROLS } from "@/services/security-coverage";
import type { DashboardScope } from "@/services/dashboard-response";

const ALL = { type: "all" } as const;
const scopeOf = (id: number | null): DashboardScope => (id === null ? ALL : { type: "customer", customer_id: id });
const VIEWS = [
  { id: null, count: 5, categories: { security: 2, tip: 1, operations: 2 } },
  { id: 1, count: 3, categories: { security: 1, tip: 2, operations: 0 } },
  { id: 2, count: 4, categories: { security: 2, tip: 1, operations: 1 } },
  { id: 3, count: 3, categories: { security: 1, tip: 1, operations: 1 } },
];
const fixtureFor = (id: number | null): DemoInsight[] =>
  id === null ? DEMO_ALL_CUSTOMER_INSIGHTS : DEMO_CUSTOMER_INSIGHTS.get(id)!;
const controlsFor = (id: number | null) =>
  id === null ? DEMO_ALL_CUSTOMER_COVERAGE.controls : DEMO_CUSTOMER_COVERAGE.get(id)!.controls;
const labelOf = Object.fromEntries(SECURITY_CONTROLS.map((c) => [c.key, c.label]));
const statusText = { covered: "Covered", needs_attention: "Needs attention", unknown: "Unknown" } as const;

test("insight fixtures are keyed by the existing demo customer IDs", () => {
  const ids = customersResponse.data.map((customer) => customer.id).sort();
  assert.deepEqual([...DEMO_CUSTOMER_INSIGHTS.keys()].sort(), ids);
});

test("each view returns the specified number of insights through the existing normalizer", () => {
  for (const { id, count } of VIEWS) {
    const state = normalizeInsights(buildDemoInsights(scopeOf(id)), scopeOf(id));
    assert.equal(state.kind, "ready", String(id));
    assert.equal(state.kind === "ready" && state.insights.length, count);
    assert.equal(state.kind === "ready" && state.hiddenCount, 0);
  }
});

test("category counts per view match the fixture records", () => {
  for (const { id, categories } of VIEWS) {
    const state = normalizeInsights(buildDemoInsights(scopeOf(id)), scopeOf(id));
    assert.ok(state.kind === "ready");
    for (const category of INSIGHT_CATEGORIES) {
      assert.equal(state.insights.filter((i) => i.category === category).length, categories[category], `${id} ${category}`);
    }
  }
});

test("IDs are unique within and across views; categories and priorities are valid", () => {
  const all: string[] = [];
  for (const { id } of VIEWS) {
    const fixture = fixtureFor(id);
    assert.equal(new Set(fixture.map((i) => i.id)).size, fixture.length);
    all.push(...fixture.map((i) => i.id));
    for (const insight of fixture) {
      assert.ok((INSIGHT_CATEGORIES as readonly string[]).includes(insight.category));
      assert.ok(insight.priority === null || (INSIGHT_PRIORITIES as readonly string[]).includes(insight.priority));
    }
  }
  assert.equal(new Set(all).size, all.length);
});

test("text stays within limits so nothing is truncated, and contains no links or markup", () => {
  for (const { id } of VIEWS) {
    for (const insight of fixtureFor(id)) {
      assert.ok(insight.id.length <= INSIGHT_TEXT_LIMITS.id);
      assert.ok(insight.title.length <= INSIGHT_TEXT_LIMITS.title, insight.id);
      assert.ok(insight.summary.length <= INSIGHT_TEXT_LIMITS.summary, insight.id);
      assert.doesNotMatch(insight.title + insight.summary, /https?:|www\.|<[a-z/]|javascript:/i);
      assert.doesNotMatch(insight.title + insight.summary, /guardz|datto/i);
    }
  }
});

test("every insight is labelled with the synthetic source and has no timestamps", () => {
  for (const { id } of VIEWS) {
    const response = buildDemoInsights(scopeOf(id));
    assert.equal(response.data.source, DEMO_INSIGHTS_SOURCE);
    assert.equal(response.data.last_synced_at, null);
    for (const insight of response.data.insights!) {
      assert.equal(insight.source, DEMO_INSIGHTS_SOURCE);
      assert.equal(insight.observed_at, null);
      assert.equal(insight.updated_at, null);
    }
    const state = normalizeInsights(response, scopeOf(id));
    assert.ok(state.kind === "ready" && state.insights.every((i) => i.observedAt === null && i.updatedAt === null));
  }
});

test("insights agree with the demo control statuses for the same view", () => {
  for (const { id } of VIEWS) {
    const controls = controlsFor(id);
    for (const insight of fixtureFor(id)) {
      for (const { key, status } of insight.relatesTo) {
        assert.equal(controls[key], status, `${insight.id} ${key}`);
        assert.ok(insight.summary.includes(labelOf[key]), `${insight.id} names ${key}`);
        assert.ok(insight.summary.includes(statusText[status]), `${insight.id} states ${status}`);
      }
    }
  }
});

test("insights never describe a Covered control as needing attention, or vice versa", () => {
  for (const { id } of VIEWS) {
    const controls = controlsFor(id);
    for (const insight of fixtureFor(id)) {
      for (const control of SECURITY_CONTROLS) {
        const named = insight.summary.includes(control.label);
        if (!named) continue;
        const claimed = (Object.keys(statusText) as (keyof typeof statusText)[]).filter((s) =>
          insight.summary.includes(`${control.label} is marked ${statusText[s]}`) ||
          insight.summary.includes(`${control.label} shows ${statusText[s]}`),
        );
        for (const s of claimed) assert.equal(controls[control.key], s, `${insight.id} ${control.key}`);
      }
    }
  }
});

test("unknown or invalid customer IDs never fall back to other customers' insights", () => {
  for (const id of [0, 4, 99, -1, 1.5, Number.NaN]) {
    const response = buildDemoInsights(scopeOf(id));
    assert.equal(response.data.status, "error", String(id));
    assert.equal(response.data.insights, null);
    if (Number.isSafeInteger(id) && id > 0) assert.equal(normalizeInsights(response, scopeOf(id)).kind, "error");
  }
});

test("a demo response for one view is rejected under another view", () => {
  const pairs: [DashboardScope, DashboardScope][] = [
    [scopeOf(1), scopeOf(2)],
    [scopeOf(2), scopeOf(3)],
    [ALL, scopeOf(1)],
    [scopeOf(3), ALL],
  ];
  for (const [sent, requested] of pairs) {
    assert.deepEqual(normalizeInsights(buildDemoInsights(sent), requested), {
      kind: "error",
      message: "Insights did not match the selected customer view.",
    });
  }
});

test("existing validation still rejects tampered demo insights", () => {
  const mutate = (change: (r: ReturnType<typeof buildDemoInsights>) => void) => {
    const response = buildDemoInsights(scopeOf(2));
    change(response);
    return normalizeInsights(response, scopeOf(2)).kind;
  };
  assert.equal(mutate((r) => (r.data.insights![1].id = r.data.insights![0].id)), "error");
  assert.equal(mutate((r) => (r.data.insights![0].category = "backup" as "tip")), "error");
  assert.equal(mutate((r) => (r.data.insights![0].priority = "urgent" as "high")), "error");
  assert.equal(mutate((r) => (r.data.insights![0].title = "  ")), "error");
});

test("demo service returns the fixture without sharing mutable objects", async () => {
  const first = await getDemoInsights(scopeOf(1));
  first.data.insights![0].title = "changed";
  const second = await getDemoInsights(scopeOf(1));
  assert.notEqual(second.data.insights![0].title, "changed");
  assert.equal(DEMO_CUSTOMER_INSIGHTS.get(1)![0].title, "Review phishing simulation activity");
});

test("live mode uses the unavailable service and never returns insights", async () => {
  assert.equal(insightsSource("live"), getInsights);
  assert.equal(insightsSource("demo"), getDemoInsights);
  for (const { id } of VIEWS) {
    const state = normalizeInsights(await insightsSource("live")(scopeOf(id)), scopeOf(id));
    assert.equal(state.kind, "unavailable");
    assert.equal("insights" in state, false);
  }
});

const readyFor = (id: number | null): InsightsState => normalizeInsights(buildDemoInsights(scopeOf(id)), scopeOf(id));

test("data tagged for another mode or customer is hidden immediately", () => {
  const demoAll: LoadedInsights = { mode: "demo", customerId: null, state: readyFor(null) };
  const demoA: LoadedInsights = { mode: "demo", customerId: 1, state: readyFor(1) };
  const loading = { kind: "loading" };
  assert.deepEqual(visibleInsights(demoAll, "live", null), loading);
  assert.deepEqual(visibleInsights(demoA, "live", 1), loading);
  assert.deepEqual(visibleInsights(demoA, "demo", 2), loading);
  assert.deepEqual(visibleInsights(demoA, "demo", null), loading);
  assert.deepEqual(visibleInsights(demoAll, "demo", 3), loading);
  assert.equal(visibleInsights(demoA, "demo", 1), demoA.state);
  assert.equal(visibleInsights(demoAll, "demo", null), demoAll.state);
});

test("out-of-order responses: a late response for an earlier request is never displayed", async () => {
  // Requests: Demo All, Demo A, Demo B, Demo C, Live C; replies arrive in reverse order.
  const requests = [
    { mode: "demo", customerId: null },
    { mode: "demo", customerId: 1 },
    { mode: "demo", customerId: 2 },
    { mode: "demo", customerId: 3 },
    { mode: "live", customerId: 3 },
  ] as const;
  const current = requests[requests.length - 1];
  for (const request of [...requests].reverse()) {
    const scope = scopeOf(request.customerId);
    const state = normalizeInsights(await insightsSource(request.mode)(scope), scope);
    const visible = visibleInsights({ ...request, state }, current.mode, current.customerId);
    if (request === current) assert.equal(visible.kind, "unavailable");
    else assert.deepEqual(visible, { kind: "loading" });
  }
});
