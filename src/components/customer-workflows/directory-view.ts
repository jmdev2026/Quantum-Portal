import type { CustomerPortfolioRecord } from "@/services/customer-overview";
export type DirectoryFilters = { search: string; reporting: string; sort: string };
export const initialDirectoryFilters = (): DirectoryFilters => ({ search: "", reporting: "all", sort: "name-asc" });
export function filterCustomerDirectory(records: readonly CustomerPortfolioRecord[], filters: DirectoryFilters) {
  const query = filters.search.slice(0, 200).trim().toLowerCase();
  return records.filter(record => record.name.toLowerCase().includes(query) && (filters.reporting === "all" || record.securityReporting === filters.reporting || record.backupReporting === filters.reporting)).sort((a, b) => (filters.sort === "id" ? a.id - b.id : a.name.localeCompare(b.name, "en") * (filters.sort === "name-desc" ? -1 : 1)) || a.id - b.id);
}
