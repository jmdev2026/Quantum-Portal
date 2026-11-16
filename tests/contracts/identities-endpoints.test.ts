import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { SECURITY_SECTIONS, securitySectionMessage, securitySectionStatus } from "@/components/security/security-overview-view";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";
import {
  VISIBILITY_AREAS,
  identitiesEndpointsAnnouncement,
  visibilityAreaView,
} from "@/components/security/identities-endpoints-view";
import { buildDemoSecurityDetections } from "@/demo/security-detections";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const panelSource = read("src/components/security/identities-endpoints-panel.tsx");
const cardSource = read("src/components/security/visibility-area-card.tsx");
const viewSource = read("src/components/security/identities-endpoints-view.ts");
const sectionsSource = read("src/components/security/security-sections.tsx");
const ui = panelSource + cardSource;
const modes = ["live", "demo"] as const;
const scopes = ["All Customers", "Demo Customer A", "Demo Customer B", "Demo Customer C"];
const [identities, endpoints] = VISIBILITY_AREAS;
const allCopy = () =>
  modes.flatMap((mode) =>
    scopes.flatMap((scope) => [
      identitiesEndpointsAnnouncement(mode, scope),
      ...VISIBILITY_AREAS.flatMap((area) => Object.values(visibilityAreaView(mode, area, scope))),
    ]),
  );

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
    const id = visibilityAreaView("live", identities, scope);
    const ep = visibilityAreaView("live", endpoints, scope);
    assert.equal(id.title, "Identity security information is not connected.");
    assert.equal(ep.title, "Endpoint security information is not connected.");
    for (const view of [id, ep]) {
      assert.equal(view.status, "not-connected");
      assert.equal(view.badge, "Not connected");
      assert.match(view.body, /does not mean there are no/);
    }
  }
});

test("Demo Mode shows the placeholder wording", () => {
  for (const scope of scopes) {
    const id = visibilityAreaView("demo", identities, scope);
    const ep = visibilityAreaView("demo", endpoints, scope);
    assert.equal(id.title, "Demonstration identity records have not been populated yet.");
    assert.equal(ep.title, "Demonstration endpoint records have not been populated yet.");
    for (const view of [id, ep]) {
      assert.equal(view.status, "demo-placeholder");
      assert.equal(view.badge, "Demo · No records yet");
      assert.match(view.body, /next development step/);
    }
  }
  assert.match(identitiesEndpointsAnnouncement("demo", "All Customers"), /demonstration placeholders/);
});

test("no fabricated identity records", () => {
  assert.doesNotMatch(ui + viewSource, /@\/(demo|mocks)\/|use[A-Z]\w*Identit|identities\s*[:=]\s*\[|<ul[^>]*aria-label="[^"]*identit/i);
  assert.doesNotMatch(ui + viewSource, /@[a-z0-9-]+\.[a-z]{2,}|\b(john|jane|admin)\b/i);
  assert.ok(!readdirSync(new URL("../../src/demo", import.meta.url)).some((f) => /identit|endpoint|device/.test(f)));
});

test("no fabricated endpoint records", () => {
  assert.doesNotMatch(ui + viewSource, /use[A-Z]\w*(Endpoint|Device)|(endpoints|devices)\s*[:=]\s*\[|data-endpoint=|data-identity=/);
  assert.doesNotMatch(ui + viewSource, /\b(LAPTOP|DESKTOP|WIN)-[A-Z0-9]+|serial|hostname/i);
  assert.ok(!readdirSync(new URL("../../src/services", import.meta.url)).some((f) => /identit|endpoint|device/.test(f)));
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
  for (const mode of modes) {
    for (const scope of scopes) {
      const texts = [identitiesEndpointsAnnouncement(mode, scope), ...VISIBILITY_AREAS.map((a) => visibilityAreaView(mode, a, scope).body)];
      for (const text of texts) {
        assert.match(text, new RegExp(`for ${scope}`));
        for (const other of scopes.filter((s) => s !== scope)) assert.doesNotMatch(text, new RegExp(other));
      }
    }
  }
});

test("no unsupported provider features or integrations", () => {
  const code = (ui + viewSource).replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /fetch\(|axios|@\/services\/|guardz|datto|laravel|https?:|useEffect|setInterval/i);
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

test("Security Controls placeholder is unchanged", () => {
  const controls = SECURITY_SECTIONS.find((s) => s.id === "security-controls")!;
  assert.equal(controls.description, "Status of the security controls applied to protected environments.");
  assert.doesNotMatch(sectionsSource, /section\.id === "security-controls"/);
  assert.match(sectionsSource, /data-state="empty"/);
  assert.equal(securitySectionStatus("demo").label, "Demo · No data yet");
  assert.equal(securitySectionMessage("live").title, "Security integration not connected");
});
