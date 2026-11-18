import test from "node:test";
import assert from "node:assert/strict";
import { findActiveNavItem, isNavItemActive, navSections } from "@/components/sidebar/navigation";
import {
  SECURITY_LIVE_NOTICE,
  SECURITY_SECTIONS,
  securityScopeLabel,
} from "@/components/security/security-overview-view";
import {
  SIMULATED_CONTROLS_EXPLANATION,
  SIMULATED_STATUS_MEANINGS,
  securityControlsView,
} from "@/components/security/security-controls-view";

const liveControls = securityControlsView({ kind: "unavailable", source: null, lastSyncedAt: null }, false, "All Customers");

const items = navSections.flatMap((section) => section.items);
const byId = (id: string) => items.find((item) => item.id === id)!;

test("Security is a navigable destination at /security", () => {
  assert.equal(byId("security").href, "/security");
  assert.equal(findActiveNavItem("/security")?.id, "security");
  assert.equal(findActiveNavItem("/security/details")?.id, "security");
  assert.equal(findActiveNavItem("/securityx"), undefined);
});

test("Dashboard and Security are never active together", () => {
  assert.equal(isNavItemActive(byId("dashboard"), "/security"), false);
  assert.equal(isNavItemActive(byId("security"), "/"), false);
  assert.equal(findActiveNavItem("/")?.id, "dashboard");
});

test("seven modules are enabled; Administration stays planned", () => {
  const enabled = items.filter((item) => item.href).map((item) => item.id);
  assert.deepEqual(enabled, ["dashboard", "security", "backup", "users-devices", "customers", "reports", "compliance"]);
  for (const id of ["administration"]) {
    assert.equal(byId(id).href, undefined, id);
  }
});

test("Security page has the four foundation sections in order", () => {
  assert.deepEqual(
    SECURITY_SECTIONS.map((s) => s.title),
    ["Security Overview", "Threats & Detections", "Identities & Endpoints", "Security Controls"],
  );
  assert.equal(new Set(SECURITY_SECTIONS.map((s) => s.id)).size, 4);
});

test("section copy carries no figures in either mode", () => {
  const texts = [
    SECURITY_LIVE_NOTICE,
    ...SECURITY_SECTIONS.flatMap((s) => [s.title, s.description]),
    SIMULATED_CONTROLS_EXPLANATION,
    ...SIMULATED_STATUS_MEANINGS.map((m) => m.meaning),
    liveControls.badge,
    liveControls.announcement,
    ...Object.values(liveControls.message!),
  ];
  for (const text of texts) assert.doesNotMatch(text, /\d/, text);
});

test("Live mode says integrations are not connected; Demo mode is labelled as demonstration", () => {
  assert.equal(liveControls.badge, "Not connected");
  assert.match(SECURITY_LIVE_NOTICE, /not connected/);
  assert.match(SIMULATED_CONTROLS_EXPLANATION, /simulated examples/);
});

test("scope label follows the shared customer view", () => {
  assert.equal(securityScopeLabel("all", "Demo Customer B"), "All Customers");
  assert.equal(securityScopeLabel("customer", "Demo Customer B"), "Demo Customer B");
  assert.equal(securityScopeLabel("customer", undefined), "Selected customer");
});
