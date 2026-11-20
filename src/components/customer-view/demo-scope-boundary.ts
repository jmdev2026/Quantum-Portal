import type { KnownCustomer } from "@/services/security-detections";

export function demoScopeBoundary(mode: "live" | "demo", customerId: number | null, registry: readonly KnownCustomer[] | null, failed: boolean) {
  if (mode === "live") return { kind: "unavailable" as const };
  if (failed) return { kind: "error" as const, message: "Customer directory unavailable. Retry the shared customer selector." };
  if (!registry) return { kind: "loading" as const };
  if (customerId !== null && !registry.some(customer => customer.id === customerId)) return { kind: "error" as const, message: "Selected customer is unavailable. No broader scope was loaded." };
  return null;
}

export function profileScopeAllowed(profileId: number, customerId: number | null, registry: readonly KnownCustomer[]) {
  return Number.isSafeInteger(profileId) && profileId > 0 && customerId === profileId && registry.some(customer => customer.id === profileId);
}
