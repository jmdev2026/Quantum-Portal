import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { SECURITY_SECTIONS, securityScopeLabel } from "@/components/security/security-overview-view";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import {
  DEMO_DETECTIONS_PLACEHOLDER,
  DETECTION_DISPLAY_FIELDS,
  detectionFeedView,
} from "@/components/security/threats-detections-view";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const panelSource = read("src/components/security/threats-detections-panel.tsx");
const feedSource = read("src/components/security/detection-feed.tsx");
const viewSource = read("src/components/security/threats-detections-view.ts");
const sectionsSource = read("src/components/security/security-sections.tsx");
const scopes = ["All Customers", "Demo Customer A", "Demo Customer B", "Demo Customer C"];
const modes = ["live", "demo"] as const;
const allCopy = () =>
  modes.flatMap((mode) =>
    scopes.flatMap((scope) => {
      const view = detectionFeedView(mode, scope);
      return [view.badge, view.announcement, view.emptyTitle, view.emptyBody, view.fieldsIntro];
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
    const view = detectionFeedView("live", scope);
    assert.equal(view.status, "not-connected");
    assert.equal(view.badge, "Not connected");
    assert.match(view.emptyTitle, /not connected/);
    assert.match(view.emptyBody, /does not mean no threats exist/);
    assert.doesNotMatch(Object.values(view).join(" "), /\d|synced|last sync|updated/i);
  }
});

test("Demo Mode is clearly a demonstration placeholder", () => {
  const view = detectionFeedView("demo", "All Customers");
  assert.equal(view.status, "demo-placeholder");
  assert.match(view.badge, /^Demo · Placeholder$/);
  assert.equal(view.emptyBody, DEMO_DETECTIONS_PLACEHOLDER);
  assert.equal(
    DEMO_DETECTIONS_PLACEHOLDER,
    "Individual demonstration detections have not been populated yet. Security Overview metrics are separate simulated summaries.",
  );
  assert.match(panelSource, /data-simulated[\s\S]*Demonstration only · no detection records/);
  assert.doesNotMatch(view.emptyTitle, /no threats|no detections found/i);
});

test("no fabricated detection records exist anywhere", () => {
  assert.match(panelSource, /<DetectionFeed\s+items=\{\[\]\}/);
  assert.doesNotMatch(panelSource + feedSource + viewSource, /@\/demo|@\/mocks|use(SecuritySeverity|SecurityCoverage|Insights)\b/);
  for (const dir of ["src/demo", "src/mocks", "src/services"]) {
    const files = readdirSync(new URL(`../../${dir}`, import.meta.url));
    assert.ok(!files.some((f) => /detection|threat/i.test(f)), `${dir}: ${files.join()}`);
  }
  assert.match(viewSource, /Provisional, frontend-only display shape/);
});

test("no zero-threat or healthy-security claims in either mode or scope", () => {
  for (const text of allCopy()) {
    assert.doesNotMatch(text, /\d/, text);
    assert.doesNotMatch(text, /no threats (detected|found)|all clear|healthy|you are (safe|secure)|no (active )?detections\b/i, text);
  }
});

test("customer scope comes from the shared customer view and is reflected immediately", () => {
  assert.match(panelSource, /useCustomerView\(\)/);
  assert.match(panelSource, /securityScopeLabel\(view\.mode, selectedCustomer\?\.name\)/);
  assert.match(panelSource, /data-detections-scope/);
  assert.doesNotMatch(panelSource, /CustomerSelector|aria-haspopup|role="listbox"/);
  for (const scope of scopes) {
    assert.match(detectionFeedView("live", scope).emptyBody, new RegExp(`for ${scope}`));
    for (const other of scopes.filter((s) => s !== scope)) {
      assert.doesNotMatch(detectionFeedView("live", scope).emptyBody, new RegExp(other));
    }
  }
  assert.equal(securityScopeLabel("customer", "Demo Customer B"), "Demo Customer B");
});

test("Security Overview from the previous phase is unchanged", () => {
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
  assert.doesNotMatch(ui, /<button|onClick|href=|<a\s|fetch\(|axios|@\/services\/api|guardz|datto|laravel/i);
  assert.doesNotMatch(viewSource, /guardz|datto|laravel|endpoint|https?:/i);
  assert.deepEqual([...DETECTION_DISPLAY_FIELDS], ["Detection title", "Severity", "Affected scope", "Short summary", "Source"]);
});
