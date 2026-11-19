import type { CapabilityId, CapabilityRecord, CapabilityState } from "@/services/security-capability-types";
import { SEVERITY_LEVELS } from "@/services/security-severity";

export type CapabilityFilters = { search: string; category: string; severity: string; protection: string; status: string; sort: "name-asc" | "name-desc" | "severity" };
export const DEFAULT_CAPABILITY_FILTERS: CapabilityFilters = { search: "", category: "all", severity: "all", protection: "all", status: "all", sort: "name-asc" };
export const resetCapabilityFilters = (): CapabilityFilters => ({ ...DEFAULT_CAPABILITY_FILTERS });
export function filterCapabilityRecords(records: readonly CapabilityRecord[], filters: CapabilityFilters): CapabilityRecord[] {
  const search = filters.search.trim().toLowerCase();
  return records.filter(record =>
    [record.name, record.observation, record.customerName, record.source, record.assetLabel ?? "", record.category ?? ""].join(" ").toLowerCase().includes(search) &&
    (filters.category === "all" || record.category === filters.category) &&
    (filters.severity === "all" || record.severity === filters.severity) &&
    (filters.status === "all" || record.status === filters.status) &&
    (filters.protection === "all" || (filters.protection === "not-verified" && /not verified|unverified/i.test(record.protectionVisibility ?? "")))
  ).sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en");
    if (filters.sort === "name-desc") return -byName;
    if (filters.sort === "severity") return SEVERITY_LEVELS.indexOf(a.severity ?? "low") - SEVERITY_LEVELS.indexOf(b.severity ?? "low") || byName;
    return byName;
  });
}
export type LoadedCapability = { capability: CapabilityId; mode: "demo" | "live"; customerId: number | null; attempt: number; state: CapabilityState };
export function visibleCapabilityState(loaded: LoadedCapability, capability: CapabilityId, mode: "demo" | "live", customerId: number | null, attempt: number): CapabilityState {
  if (mode === "live") return { kind: "unavailable" };
  return loaded.capability === capability && loaded.mode === mode && loaded.customerId === customerId && loaded.attempt === attempt ? loaded.state : { kind: "loading" };
}
export const selectedCapabilityRecord = (state: CapabilityState, id: string | null) => state.kind === "ready" ? state.records.find(record => record.id === id) ?? null : null;
export function capabilityStateMessage(state: CapabilityState): { title: string; body: string } {
  if (state.kind === "loading") return { title: "Loading fictional observations", body: "Preparing only the selected customer’s demonstration records." };
  if (state.kind === "error") return { title: "Example observations unavailable", body: state.message };
  if (state.kind === "unavailable") return { title: "Reporting not connected", body: "No provider observations are available. This does not mean zero risks or full protection. Switch to Demo only to inspect fictional examples." };
  return { title: "No fictional observations supplied", body: "An empty example dataset says nothing about real threats, assets or protection." };
}
export const categoryLabel = (value: string) => value.replaceAll("-", " ");
