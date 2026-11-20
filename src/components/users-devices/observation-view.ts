import type { VisibilityRecord } from "@/services/security-visibility-records";
export type ObservationFilters = { search: string; customer: string; visibility: string; sort: string };
export const initialObservationFilters = (): ObservationFilters => ({ search: "", customer: "all", visibility: "all", sort: "name-asc" });
export const OBSERVATION_SORTS = ["name-asc", "name-desc", "customer"] as const;
export function updateObservationFilters(filters: ObservationFilters, field: keyof ObservationFilters, value: string, records: readonly VisibilityRecord[]) {
  if (field === "sort" && !OBSERVATION_SORTS.includes(value as typeof OBSERVATION_SORTS[number])) return filters;
  if (field === "customer" && value !== "all" && !records.some(record => String(record.customerId) === value)) return filters;
  if (field === "visibility" && value !== "all" && !records.some(record => record.protectionVisibility === value)) return filters;
  return { ...filters, [field]: field === "search" ? value.slice(0, 200) : value };
}
export function filterObservations(records: readonly VisibilityRecord[], filters: ObservationFilters) {
  const query = filters.search.slice(0, 200).trim().toLowerCase();
  return records.filter(record => (filters.customer === "all" || String(record.customerId) === filters.customer) && (filters.visibility === "all" || record.protectionVisibility === filters.visibility) && [record.name, record.customerName, record.observation, record.protectionVisibility, record.source].some(value => value.toLowerCase().includes(query))).sort((a, b) => (filters.sort === "customer" ? a.customerName.localeCompare(b.customerName, "en") : a.name.localeCompare(b.name, "en") * (filters.sort === "name-desc" ? -1 : 1)) || a.id.localeCompare(b.id, "en"));
}
export function selectObservation(records: readonly VisibilityRecord[], id: string | null) { return records.find(record => record.id === id) ?? null; }
