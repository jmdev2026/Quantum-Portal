import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("each Dashboard summary has an explicit usable destination", () => {
  const actions = [
    ["issues-by-severity-panel", "/security/detections"],
    ["security-coverage-panel", "/security#security-controls-title"],
    ["insights-panel", "/security/insights"],
    ["backup-health-panel", "/backup#backup-overview-title"],
    ["customer-overview-panel", "/customers"],
  ];
  for (const [name, href] of actions) {
    assert.ok(read(`src/components/dashboard/${name}.tsx`).includes(`href: "${href}"`), name);
    assert.ok(existsSync(new URL(`../../src/app${href.split("#")[0]}/page.tsx`, import.meta.url)), href);
  }
  const assets = read("src/components/dashboard/asset-summary.tsx");
  assert.match(assets, /href="\/users-devices#user-account-visibility-title"/);
  assert.match(assets, /href="\/users-devices#device-endpoint-visibility-title"/);
});

test("anchor destinations exist and have a sticky-header offset", () => {
  assert.match(read("src/components/users-devices/users-devices-view.ts"), /id: "user-account-visibility"/);
  assert.match(read("src/components/users-devices/users-devices-view.ts"), /id: "device-endpoint-visibility"/);
  assert.match(read("src/components/users-devices/users-devices-sections.tsx"), /const titleId = `\$\{section.id\}-title`/);
  assert.match(read("src/components/security/security-controls-panel.tsx"), /id=\{`\$\{section.id\}-title`\}/);
  assert.match(read("src/components/backup/backup-overview-panel.tsx"), /id="backup-overview"/);
  assert.match(read("src/app/globals.css"), /scroll-margin-top: 6rem/);
});

test("drilldown links use Next navigation without scope replacement or nested controls", () => {
  const link = read("src/components/dashboard/drilldown-link.tsx");
  assert.match(link, /import Link from "next\/link"/);
  assert.match(link, /focus-visible:ring-2/);
  assert.doesNotMatch(link, /<button|selectAll|setMode|location\./);
  assert.match(read("src/components/dashboard/dashboard-panel.tsx"), /<DrilldownLink href=\{action.href\}/);
  const insights = read("src/app/security/insights/page.tsx");
  assert.match(insights, /<InsightsPanel showNavigation=\{false\}/);
  assert.doesNotMatch(insights, /Provider|fetch\(/);
});
