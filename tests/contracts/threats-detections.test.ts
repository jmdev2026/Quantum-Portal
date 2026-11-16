import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SECURITY_SECTIONS, securityScopeLabel } from "@/components/security/security-overview-view";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import { DETECTION_DISPLAY_FIELDS, detectionFeedView } from "@/components/security/threats-detections-view";
import type { DetectionsState } from "@/services/security-detections";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const panelSource = read("src/components/security/threats-detections-panel.tsx");
const feedSource = read("src/components/security/detection-feed.tsx");
const viewSource = read("src/components/security/threats-detections-view.ts");
const sectionsSource = read("src/components/security/security-sections.tsx");
const scopes = ["All Customers", "Demo Customer A", "Demo Customer B", "Demo Customer C"];
const nonRecordStates: DetectionsState[] = [
  { kind: "unavailable" },
  { kind: "loading" },
  { kind: "error", message: "No demonstration data exists for this customer." },
  { kind: "ready", detections: [] },
];
const allCopy = () =>
  nonRecordStates.flatMap((state) =>
    scopes.flatMap((scope) => {
      const view = detectionFeedView(state, scope);
      return [view.badge, view.announcement, view.emptyTitle, view.emptyBody];
    }),
  );

test("Threats & Detections renders through its own panel on the Security page", () => {
  assert.ok(SECURITY_SECTIONS.some((s) => s.id === "threats-detections"));
  assert.match(sectionsSource, /section\.id === "threats-detections"\) return <ThreatsDetectionsPanel/);
  assert.match(panelSource, /aria-labelledby=\{`\$\{section\.id\}-title`\}/);
  assert.match(panelSource, /<h2 id=\{`\$\{section\.id\}-title`\}/);
  assert.match(panelSource, /<h3[^>]*>Detection feed<\/h3>/);
});

test("title and supporting description match the specification", () => {
  const section = SECURITY_SECTIONS.find((s) => s.id === "threats-detections")!;
  assert.equal(section.title, "Threats & Detections");
  assert.equal(section.description, "Review security detections and investigation information for the selected customer view.");
});

test("Live Mode is clearly unavailable, with no count or sync time", () => {
  for (const scope of scopes) {
    const view = detectionFeedView({ kind: "unavailable" }, scope);
    assert.equal(view.status, "not-connected");
    assert.equal(view.badge, "Not connected");
    assert.match(view.emptyTitle, /not connected/);
    assert.match(view.emptyBody, /does not mean no threats exist/);
    assert.doesNotMatch(Object.values(view).join(" "), /\d|synced|last sync|updated/i);
  }
});

test("no zero-threat or healthy-security claims in any non-record state", () => {
  for (const text of allCopy()) {
    assert.doesNotMatch(text, /\d/, text);
    assert.doesNotMatch(text, /no threats (detected|found)|all clear|healthy|you are (safe|secure)|no (active )?detections\b/i, text);
  }
});

test("customer scope comes from the shared customer view", () => {
  assert.match(panelSource, /useCustomerView\(\)/);
  assert.match(panelSource, /securityScopeLabel\(view\.mode, selectedCustomer\?\.name\)/);
  assert.match(panelSource, /data-detections-scope/);
  assert.doesNotMatch(panelSource, /CustomerSelector|aria-haspopup|role="listbox"/);
  for (const scope of scopes) {
    const body = detectionFeedView({ kind: "unavailable" }, scope).emptyBody;
    assert.match(body, new RegExp(`for ${scope}`));
    for (const other of scopes.filter((s) => s !== scope)) assert.doesNotMatch(body, new RegExp(other));
  }
  assert.equal(securityScopeLabel("customer", "Demo Customer B"), "Demo Customer B");
});

test("Security Overview is unchanged", () => {
  const overview = SECURITY_SECTIONS.find((s) => s.id === "security-overview")!;
  assert.equal(overview.description, "Summary of reported security figures for the selected scope.");
  assert.match(sectionsSource, /section\.id === "security-overview"\) return <SecurityOverviewPanel/);
  const loading = { kind: "loading" } as const;
  assert.deepEqual(
    securityOverviewMetrics({ severity: loading, coverage: loading, insights: loading }).map((m) => m.label),
    ["Open Security Issues", "Critical Issues", "Security Coverage", "Security Insights"],
  );
});

test("Identities & Endpoints and Security Controls remain placeholders", () => {
  const routed = [...sectionsSource.matchAll(/section\.id === "([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(routed, ["security-overview", "threats-detections"]);
  assert.match(sectionsSource, /data-state="empty"/);
  assert.deepEqual(
    SECURITY_SECTIONS.slice(2).map((s) => s.title),
    ["Identities & Endpoints", "Security Controls"],
  );
});

test("no actions, links or provider integrations are introduced", () => {
  const ui = panelSource + feedSource;
  assert.doesNotMatch(ui, /<button|onClick|href=|<a\s|fetch\(|axios|@\/services\/api|guardz|datto|laravel|dangerouslySetInnerHTML/i);
  assert.doesNotMatch(viewSource, /guardz|datto|laravel|https?:/i);
  assert.deepEqual([...DETECTION_DISPLAY_FIELDS], ["Detection title", "Severity", "Affected scope", "Short summary", "Source"]);
});
