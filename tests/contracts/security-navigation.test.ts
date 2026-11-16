import test from "node:test";
import assert from "node:assert/strict";
import { findActiveNavItem, isNavItemActive, navSections } from "@/components/sidebar/navigation";
import {
  SECURITY_LIVE_NOTICE,
  SECURITY_SECTIONS,
  securityScopeLabel,
  securitySectionMessage,
  securitySectionStatus,
} from "@/components/security/security-overview-view";

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

test("only Dashboard and Security are enabled; other modules stay planned", () => {
  const enabled = items.filter((item) => item.href).map((item) => item.id);
  assert.deepEqual(enabled, ["dashboard", "security"]);
  for (const id of ["backup", "users-devices", "customers", "reports", "compliance", "administration"]) {
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
    ...(["live", "demo"] as const).flatMap((m) => [securitySectionStatus(m).label, ...Object.values(securitySectionMessage(m))]),
  ];
  for (const text of texts) assert.doesNotMatch(text, /\d/, text);
});

test("Live mode says integrations are not connected; Demo mode is labelled as demonstration", () => {
  assert.deepEqual(securitySectionStatus("live"), { label: "Not connected", tone: "disconnected" });
  assert.match(securitySectionStatus("demo").label, /^Demo/);
  assert.match(SECURITY_LIVE_NOTICE, /not connected/);
  assert.match(securitySectionMessage("demo").body, /Demo Mode/);
});

test("scope label follows the shared customer view", () => {
  assert.equal(securityScopeLabel("all", "Demo Customer B"), "All Customers");
  assert.equal(securityScopeLabel("customer", "Demo Customer B"), "Demo Customer B");
  assert.equal(securityScopeLabel("customer", undefined), "Selected customer");
});
