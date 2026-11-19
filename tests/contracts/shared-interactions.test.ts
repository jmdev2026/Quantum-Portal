import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("header Help opens a native modal with a close path and truthful boundaries", () => {
  const header = read("src/components/header/app-header.tsx");
  const help = read("src/components/header/portal-help.tsx");
  assert.match(header, /<PortalHelp \/>/);
  assert.doesNotMatch(header, /label="Help"/);
  assert.match(help, /showModal\(\)/);
  assert.match(help, /<dialog/);
  assert.match(help, /aria-labelledby="portal-help-title"/);
  assert.match(help, /dialogRef\.current\?\.close\(\)/);
  assert.match(help, /Live reporting is not connected/);
  assert.match(help, /Selection is not authorization/);
  assert.doesNotMatch(help, /localStorage|fetch\(|getDemo/);
});

test("customer scope explanation describes filtering without claiming authorization", () => {
  const selector = read("src/components/customer-selector/customer-selector.tsx");
  assert.match(selector, /filters fictional summaries and records/);
  assert.match(selector, /does not grant or control access/);
  assert.doesNotMatch(selector, /Choosing a customer does not filter data/);
});

test("desktop and mobile navigation section labels use instance-specific identifiers", () => {
  const nav = read("src/components/sidebar/sidebar-nav.tsx");
  assert.match(nav, /const baseId = useId\(\)/);
  assert.match(nav, /aria-labelledby=\{`\$\{baseId\}-nav-section-\$\{section.id\}`\}/);
  assert.match(nav, /id=\{`\$\{baseId\}-nav-section-\$\{section.id\}`\}/);
});
