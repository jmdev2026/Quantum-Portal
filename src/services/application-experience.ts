import { notificationsResponse } from "@/mocks/notifications";
import { accountProfileResponse } from "@/mocks/account-profile";
import { isRecord, parseScope, type DashboardScope } from "@/services/dashboard-response";
import type { KnownCustomer } from "@/services/security-detections";
import type { NotificationExample } from "@/components/shared-experience/experience-model";
export type ProfileExample = typeof accountProfileResponse.data;
export type ApplicationData = { notifications: NotificationExample[]; profile: ProfileExample };
export type ApplicationState = { kind: "loading" | "unavailable" } | { kind: "error"; message: string } | { kind: "ready"; data: ApplicationData };
export function normalizeNotifications(response: unknown, scope: DashboardScope, registry: readonly KnownCustomer[]): NotificationExample[] | null {
  if (!parseScope(scope) || (scope.type === "customer" && !registry.some(customer => customer.id === scope.customer_id)) || !isRecord(response) || Object.keys(response).join() !== "data" || !Array.isArray(response.data) || response.data.length > 30) return null;
  const seen = new Set<string>(); const result: NotificationExample[] = [];
  for (const row of response.data) {
    if (!isRecord(row) || !isRecord(row.customer) || typeof row.id !== "string" || seen.has(row.id)) return null;
    const customer = row.customer;
    if (!registry.some(item => item.id === customer.id && item.name === customer.name) || (scope.type === "customer" && scope.customer_id !== customer.id)) return null;
    const original = notificationsResponse.data.find(item => item.id === row.id);
    if (!original || JSON.stringify(original) !== JSON.stringify(row)) return null;
    seen.add(row.id); result.push(structuredClone(original));
  }
  return result;
}
// TODO(api): GET /application/preview — provisional local seam, not an approved Laravel endpoint
// request: { scope, mode }
// response: { kind, data?: { notifications, profile }, message? }
export async function getApplicationData(scope: DashboardScope, registry: readonly KnownCustomer[], mode: "live" | "demo"): Promise<ApplicationState> {
  if (mode === "live") return { kind: "unavailable" };
  if (!parseScope(scope) || (scope.type === "customer" && !registry.some(customer => customer.id === scope.customer_id))) return { kind: "error", message: "Invalid customer scope. No All Customers fallback is allowed." };
  await new Promise(resolve => setTimeout(resolve, 250));
  const response = { data: notificationsResponse.data.filter(row => scope.type === "all" || row.customer.id === scope.customer_id) };
  const notifications = normalizeNotifications(response, scope, registry);
  return notifications ? { kind: "ready", data: { notifications, profile: structuredClone(accountProfileResponse.data) } } : { kind: "error", message: "Application examples failed source validation." };
}
