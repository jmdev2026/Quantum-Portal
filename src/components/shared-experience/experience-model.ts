import { SECURITY_CAPABILITIES, PLANNED_SECURITY_CAPABILITIES } from "@/components/security/security-capability-directory";
import { REPORTS } from "@/components/reports/report-model";
export const SHARED_ROUTES = ["sign-in", "access-denied", "account", "notifications", "help"] as const;
export const DESTINATIONS = [
  { href: "/", title: "Dashboard", category: "Overview" },
  { href: "/security", title: "Security Overview", category: "Security" },
  ...SECURITY_CAPABILITIES.map(item => ({ href: `/security/${item.id}`, title: `${item.title} ${item.id.toUpperCase()}`, category: "Security" })),
  ...PLANNED_SECURITY_CAPABILITIES.map(item => ({ href: item.href, title: item.title, category: "Security" })),
  { href: "/security/detections", title: "Security Detection Explorer", category: "Security" },
  { href: "/security/insights", title: "Security Insights", category: "Security" },
  { href: "/backup", title: "Backup & Recovery", category: "Backup" },
  { href: "/backup/assets", title: "Backup Assets", category: "Backup" },
  { href: "/backup/jobs", title: "Backup Jobs", category: "Backup" },
  { href: "/backup/recovery", title: "Recovery Information", category: "Backup" },
  { href: "/customers", title: "Customer Portfolio", category: "Management" },
  { href: "/customers/onboarding", title: "Customer Onboarding Preview", category: "Management" },
  { href: "/users-devices", title: "Users & Devices", category: "Management" },
  { href: "/users-devices/users", title: "User Observation Explorer", category: "Management" },
  { href: "/users-devices/devices", title: "Device Observation Explorer", category: "Management" },
  { href: "/reports", title: "Reports Library", category: "Reports" },
  ...REPORTS.map(item => ({ href: `/reports/${item.id}`, title: item.title, category: "Reports" })),
  { href: "/compliance", title: "Compliance Overview", category: "Governance" },
  ...["framework", "controls", "assessments", "evidence"].map(item => ({ href: `/compliance/${item}`, title: `Compliance ${item}`, category: "Governance" })),
  { href: "/administration", title: "Administration Overview", category: "Governance" },
  ...["access", "integrations", "audit", "settings"].map(item => ({ href: `/administration/${item}`, title: `Administration ${item}`, category: "Governance" })),
  ...SHARED_ROUTES.map(item => ({ href: `/${item}`, title: ({ "sign-in": "Sign-in Design", "access-denied": "Access State Preview", account: "Account Preview", notifications: "Notification Center", help: "Help & Support" })[item], category: "Application" })),
] as const;
export function searchDestinations(query: string, category = "All") { const terms = query.slice(0, 120).trim().toLowerCase().split(/\s+/); return DESTINATIONS.filter(item => (category === "All" || item.category === category) && terms.every(term => `${item.title} ${item.category}`.toLowerCase().includes(term))); }
export function safeDestination(value: unknown): string { return typeof value === "string" && DESTINATIONS.some(item => item.href === value) ? value : "/"; }
export const ACCESS_STATES = [
  { id: "required", title: "Sign-in required", code: "401 design", text: "Future protected access requires an authenticated session. Authentication is not connected; this is a presentation preview." },
  { id: "invalid", title: "Invalid credentials", code: "Authentication error design", text: "Future sign-in errors must avoid revealing whether an account exists. No credentials were entered or checked here." },
  { id: "loading", title: "Authentication pending", code: "Loading design", text: "Presentation of a future request in progress only. No authentication request is running." },
  { id: "mfa", title: "MFA challenge", code: "Challenge design", text: "Future verification requires an authorized challenge and bounded attempts. No code was sent, collected or verified." },
  { id: "mfa-unavailable", title: "MFA unavailable", code: "Unavailable design", text: "The future verification service cannot currently be demonstrated. No challenge or fallback bypass is available." },
  { id: "recovery", title: "Account recovery requested", code: "Recovery design", text: "Future recovery should use a generic response regardless of account existence. No reset email or token was created." },
  { id: "expired", title: "Session expired", code: "401 design", text: "Future session expiration must clear sensitive cached information and require reauthentication. No session or expiration timer exists here." },
  { id: "forbidden", title: "Permission denied", code: "403 design", text: "An authenticated principal may still lack permission. Only the future backend can supply that decision; no role is inferred from customer selection." },
  { id: "scope", title: "Invalid or unauthorized customer scope", code: "Scope denial design", text: "Reject the requested scope rather than widening to All Customers. Route parameters and browser selectors cannot grant access." },
  { id: "revoked", title: "Customer membership revoked", code: "Revocation design", text: "Future revoked access requires resource revalidation and removal of sensitive cached records. No actual membership was revoked here." },
  { id: "privileged", title: "Privileged action unavailable", code: "Capability boundary", text: "Privileged operations need independently authorized server actions. This frontend cannot perform or authorize them." },
  { id: "disabled", title: "Account disabled", code: "Account restriction design", text: "Future restricted-account handling must avoid sensitive account details and follow verified support policy. No account status was checked." },
  { id: "unavailable", title: "Authentication service unavailable", code: "Unavailable", text: "Laravel authentication is not implemented. Do not enter actual credentials; no sign-in operation is available." },
  { id: "reauthenticate", title: "Reauthentication required", code: "401 design", text: "Future sensitive actions may require fresh authentication. No protected action or reauthentication exchange exists here." },
  { id: "signed-out", title: "Account signed out", code: "Sign-out design", text: "Future sign-out must invalidate server sessions and clear private caches. This is not confirmation of an actual sign-out." },
  { id: "changed", title: "Permission changed", code: "Revalidation design", text: "Future permission changes must revalidate protected resources and discard stale private content. No permissions were changed." },
] as const;
export type AccessStateId = typeof ACCESS_STATES[number]["id"];
export const NOTIFICATION_CATEGORIES = ["Security", "Dark Web", "Backup", "Compliance", "Reports", "Awareness Training"] as const;
export type NotificationExample = { id: string; customer: { id: number; name: string }; category: typeof NOTIFICATION_CATEGORIES[number]; title: string; description: string; state: "Unreviewed example"; source: "simulated_design"; created_at: string; timestamp_basis: "fixture_authoring" };
export function filterNotifications(rows: NotificationExample[], query: string, category: string, status: string, sort: string, reviewed: readonly string[]) {
  return rows.filter(row => `${row.title} ${row.description} ${row.category}`.toLowerCase().includes(query.slice(0, 120).trim().toLowerCase()) && (category === "All" || row.category === category) && (status === "All" || (reviewed.includes(row.id) ? "Reviewed locally" : row.state) === status)).sort((a, b) => (sort === "descending" ? -1 : 1) * (a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en")));
}
