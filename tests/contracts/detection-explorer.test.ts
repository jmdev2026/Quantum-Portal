import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDemoSecurityDetections } from "@/demo/security-detections";
import { customersResponse } from "@/mocks/customers";
import { normalizeDemoSecurityDetections, type Detection } from "@/services/security-detections";
import { DEFAULT_DETECTION_FILTERS, filterDetections, selectedDetection } from "@/components/security/detection-explorer-view";
import { visibleDetections } from "@/components/security/threats-detections-view";
import { findActiveNavItem } from "@/components/sidebar/navigation";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const allScope = { type: "all" } as const;
const allState = normalizeDemoSecurityDetections(buildDemoSecurityDetections(allScope), allScope, customersResponse.data);
assert.equal(allState.kind, "ready");
const records = allState.kind === "ready" ? allState.detections : [];

test("explorer reuses six canonical examples and two for each scoped customer", () => {
  assert.equal(records.length, 6);
  for (const id of [1, 2, 3]) {
    const scope = { type: "customer", customer_id: id } as const;
    const state = normalizeDemoSecurityDetections(buildDemoSecurityDetections(scope), scope, customersResponse.data);
    assert.equal(state.kind, "ready");
    if (state.kind === "ready") {
      assert.equal(state.detections.length, 2);
      assert.ok(state.detections.every(record => record.customerId === id));
    }
  }
});

test("case-insensitive trimmed search matches only validated textual fields", () => {
  assert.equal(filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, search: "  SIGN-IN  " })[0].id, "demo-detection-b-1");
  assert.equal(filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, search: "demo customer b" }).length, 2);
  assert.equal(filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, search: "Simulated demo data" }).length, 6);
  assert.equal(filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, search: "not-a-record" }).length, 0);
});

test("severity and search combine and reset restores all examples", () => {
  assert.equal(filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, severity: "medium" }).length, 2);
  assert.equal(filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, search: "endpoint", severity: "medium" }).length, 1);
  assert.equal(filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, search: "endpoint", severity: "critical" }).length, 0);
  assert.equal(filterDetections(records, DEFAULT_DETECTION_FILTERS).length, 6);
});

test("severity and title sorting are deterministic and do not mutate canonical records", () => {
  const before = records.map(record => record.id);
  assert.equal(filterDetections(records, DEFAULT_DETECTION_FILTERS)[0].severity, "critical");
  const asc = filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, sort: "title-asc" });
  const desc = filterDetections(records, { ...DEFAULT_DETECTION_FILTERS, sort: "title-desc" });
  assert.deepEqual(desc.map(record => record.id), asc.map(record => record.id).reverse());
  assert.deepEqual(records.map(record => record.id), before);
  const tied: Detection[] = [{ ...records[0], id: "z" }, { ...records[0], id: "a" }];
  assert.deepEqual(filterDetections(tied, DEFAULT_DETECTION_FILTERS).map(record => record.id), ["a", "z"]);
});

test("detail selection uses validated current records and excludes absent/closed states", () => {
  assert.deepEqual(selectedDetection(allState, records[0].id), records[0]);
  for (const id of [null, "missing"]) assert.equal(selectedDetection(allState, id), null);
  for (const state of [{ kind: "unavailable" }, { kind: "loading" }, { kind: "error", message: "failed" }] as const) assert.equal(selectedDetection(state, records[0].id), null);
});

test("late responses, customer changes and Live cannot disclose old detail records", () => {
  const loaded = { mode: "demo", customerId: null, state: allState } as const;
  for (const id of [1, 2, 3, -1]) assert.equal(selectedDetection(visibleDetections(loaded, "demo", id), records[0].id), null);
  assert.equal(visibleDetections(loaded, "live", null).kind, "unavailable");
  assert.equal(selectedDetection(visibleDetections(loaded, "live", null), records[0].id), null);
  assert.equal(visibleDetections({ ...loaded, mode: "live" }, "demo", null).kind, "loading");
});

test("invalid scope and wrong-scope records are still rejected by unchanged normalizer", () => {
  const invalid = { type: "customer", customer_id: -1 } as const;
  assert.equal(normalizeDemoSecurityDetections(buildDemoSecurityDetections(invalid), invalid, customersResponse.data).kind, "error");
  const scope = { type: "customer", customer_id: 2 } as const;
  const response = buildDemoSecurityDetections(scope);
  response.data.detections = buildDemoSecurityDetections(allScope).data.detections;
  assert.equal(normalizeDemoSecurityDetections(response, scope, customersResponse.data).kind, "error");
});

test("direct nested navigation stays in Security and reuses the existing hook", () => {
  assert.equal(findActiveNavItem("/security/detections")?.id, "security");
  assert.match(read("src/app/security/detections/page.tsx"), /<DetectionExplorer \/>/);
  const explorer = read("src/components/security/detection-explorer.tsx");
  assert.match(explorer, /useSecurityDetections/);
  assert.match(explorer, /key=\{`\$\{mode\}:\$\{customerId\}`\}/);
  assert.match(explorer, /href="\/security"/);
  assert.doesNotMatch(explorer, /fetch\(|localStorage|status-filter/);
});

test("details use native modal focus and Escape paths with no fabricated investigation fields", () => {
  const detail = read("src/components/security/detection-detail.tsx");
  assert.match(detail, /showModal\(\)/);
  assert.match(detail, /onCancel=/);
  assert.match(detail, /trigger\.focus\(\)/);
  assert.match(detail, /onClick=\{onClose\}/);
  for (const field of ["title", "customerName", "severity", "summary", "source"]) assert.ok(detail.includes(`record.${field}`));
  assert.doesNotMatch(detail, /record\.(status|category|created_at|ip|evidence|caseId)/);
});
