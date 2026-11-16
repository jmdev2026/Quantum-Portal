import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SECURITY_SECTIONS } from "@/components/security/security-overview-view";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import {
  VISIBILITY_AREAS,
  identitiesEndpointsAnnouncement,
  visibilityAreaView,
  type VisibilityAreaView,
} from "@/components/security/identities-endpoints-view";
import type { VisibilityRecordsState } from "@/services/security-visibility-records";
import { buildDemoSecurityDetections } from "@/demo/security-detections";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const panelSource = read("src/components/security/identities-endpoints-panel.tsx");
const cardSource = read("src/components/security/visibility-area-card.tsx");
const viewSource = read("src/components/security/identities-endpoints-view.ts");
const sectionsSource = read("src/components/security/security-sections.tsx");
const ui = panelSource + cardSource;
const scopes = ["All Customers", "Demo Customer A", "Demo Customer B", "Demo Customer C"];
const [identities, endpoints] = VISIBILITY_AREAS;
const states: VisibilityRecordsState[] = [
  { kind: "unavailable" },
  { kind: "loading" },
  { kind: "error", message: "Demonstration records could not be loaded." },
];
const textOf = (view: VisibilityAreaView) => (view.status === "simulated" ? [view.badge, view.sampleNote] : [view.badge, view.title, view.body]);
const allCopy = () =>
  scopes.flatMap((scope) => [
    identitiesEndpointsAnnouncement("live", states[0], states[0], scope),
    identitiesEndpointsAnnouncement("demo", states[1], states[1], scope),
    ...states.flatMap((state) => VISIBILITY_AREAS.flatMap((area) => textOf(visibilityAreaView(state, area, scope)))),
  ]);

test("Identities & Endpoints section exists and renders through its own panel", () => {
  assert.match(sectionsSource, /section\.id === "identities-endpoints"\) return <IdentitiesEndpointsPanel/);
  assert.match(panelSource, /aria-labelledby=\{`\$\{section\.id\}-title`\}/);
  assert.match(panelSource, /<h2 id=\{`\$\{section\.id\}-title`\}/);
  assert.match(panelSource, /md:col-span-2/);
});

test("both content areas render as separate cards", () => {
  assert.deepEqual(VISIBILITY_AREAS.map((a) => a.id), ["identities", "endpoints"]);
  assert.match(panelSource, /VISIBILITY_AREAS\.map\(\(area\) => \(\s*<VisibilityAreaCard/);
  assert.match(panelSource, /md:grid-cols-2/);
  assert.match(cardSource, /<h3 id=\{titleId\}/);
  assert.match(cardSource, /role="group"/);
  assert.match(cardSource, /data-area-badge/);
});

test("titles and descriptions match the specification", () => {
  const section = SECURITY_SECTIONS.find((s) => s.id === "identities-endpoints")!;
  assert.equal(section.title, "Identities & Endpoints");
  assert.equal(section.description, "Review identity and endpoint security visibility for the selected customer.");
  assert.deepEqual(VISIBILITY_AREAS.map((a) => a.title), ["Identities", "Endpoints"]);
  for (const area of VISIBILITY_AREAS) assert.ok(area.description.length > 0 && area.description.length <= 100);
});

test("Live Mode shows the required not-connected wording", () => {
  for (const scope of scopes) {
    const id = visibilityAreaView({ kind: "unavailable" }, identities, scope);
    const ep = visibilityAreaView({ kind: "unavailable" }, endpoints, scope);
    assert.ok(id.status === "not-connected" && ep.status === "not-connected");
    assert.equal(id.title, "Identity security information is not connected.");
    assert.equal(ep.title, "Endpoint security information is not connected.");
    for (const view of [id, ep]) {
      assert.equal(view.badge, "Not connected");
      assert.match(view.body, /does not mean there are no/);
    }
  }
});

test("Demo Mode placeholder wording from the foundation step is gone", () => {
  assert.doesNotMatch(viewSource + ui, /have not been populated yet|next development step|No records yet|demo-placeholder/);
});

test("no real-looking identity or device identifiers in the display code", () => {
  assert.doesNotMatch(ui + viewSource, /@[a-z0-9-]+\.[a-z]{2,}|\b(john|jane|admin)\b/i);
  assert.doesNotMatch(ui + viewSource, /\b(LAPTOP|DESKTOP|WIN)-[A-Z0-9]+|serial|hostname/i);
});

test("no zero, healthy or protected claims and no copied metric totals", () => {
  for (const text of allCopy()) {
    assert.doesNotMatch(text, /\d/, text);
    assert.doesNotMatch(text, /(?<!there are )\b(no|zero) (users|identities|devices|endpoints)\b|all (protected|secure)|are (protected|secure|healthy)|synced|last sync|guardz/i, text);
  }
  assert.doesNotMatch(ui + viewSource, /use-asset-summary|use-security-coverage|use-security-severity|use-insights|ITDR|MDR/);
});

test("scope comes from the shared customer view and stays in sync", () => {
  assert.match(panelSource, /useCustomerView\(\)/);
  assert.match(panelSource, /useDashboardMode\(\)/);
  assert.match(panelSource, /securityScopeLabel\(view\.mode, selectedCustomer\?\.name\)/);
  assert.match(panelSource, /data-visibility-scope/);
  assert.doesNotMatch(ui, /CustomerSelector|DashboardModeProvider|CustomerViewProvider|aria-haspopup|localStorage|sessionStorage/);
  for (const scope of scopes) {
    const texts = [
      identitiesEndpointsAnnouncement("live", states[0], states[0], scope),
      identitiesEndpointsAnnouncement("demo", states[1], states[1], scope),
      ...VISIBILITY_AREAS.flatMap((a) => [states[0], states[1]].map((state) => textOf(visibilityAreaView(state, a, scope)).at(-1)!)),
    ];
    for (const text of texts) {
      assert.match(text, new RegExp(`for ${scope}`));
      for (const other of scopes.filter((s) => s !== scope)) assert.doesNotMatch(text, new RegExp(other));
    }
  }
});

test("no unsupported provider features or integrations", () => {
  const code = (ui + viewSource).replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /fetch\(|axios|guardz|datto|laravel|https?:|setInterval/i);
  assert.match(viewSource, /Provisional, display-only/);
});

test("no actionable controls are introduced", () => {
  assert.doesNotMatch(ui, /<button|onClick|href=|<a\s|<input|<select|tabIndex|dangerouslySetInnerHTML/);
  const copy = [...allCopy(), ...VISIBILITY_AREAS.flatMap((a) => [a.title, a.description, ...a.fields])].join(" ");
  assert.doesNotMatch(copy, /quarantine|isolat|disable|reset password|remediat|install|provision|export|refresh|view details/i);
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

test("existing detection records are unchanged", () => {
  assert.deepEqual(
    buildDemoSecurityDetections({ type: "all" }).data.detections!.map((d) => [d.id, d.severity, d.customer.id]),
    [
      ["demo-detection-b-1", "critical", 2],
      ["demo-detection-a-1", "high", 1],
      ["demo-detection-b-2", "high", 2],
      ["demo-detection-a-2", "medium", 1],
      ["demo-detection-c-1", "medium", 3],
      ["demo-detection-c-2", "low", 3],
    ],
  );
  assert.match(sectionsSource, /section\.id === "threats-detections"\) return <ThreatsDetectionsPanel/);
});

test("Security Controls is routed to its own panel", () => {
  const controls = SECURITY_SECTIONS.find((s) => s.id === "security-controls")!;
  assert.equal(controls.description, "Review security control reporting and visibility for the selected customer.");
  assert.match(sectionsSource, /section\.id === "security-controls"\) return <SecurityControlsPanel/);
  assert.match(sectionsSource, /section\.id === "identities-endpoints"\) return <IdentitiesEndpointsPanel/);
});
