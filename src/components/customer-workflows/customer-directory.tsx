"use client";

import { useState, type ReactNode } from "react";
import type { CustomerPortfolioRecord } from "@/services/customer-overview";
import { action, control } from "@/components/customer-workflows/workflow-ui";

import { filterCustomerDirectory, initialDirectoryFilters } from "@/components/customer-workflows/directory-view";
export function CustomerDirectory({ records, children }: { records: readonly CustomerPortfolioRecord[]; children: (records: CustomerPortfolioRecord[]) => ReactNode }) {
  const [filters, setFilters] = useState(initialDirectoryFilters);
  const displayed = filterCustomerDirectory(records, filters);
  const statuses = [...new Set(records.flatMap(record => [record.securityReporting, record.backupReporting]))].sort();
  return <div className="grid gap-4"><div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm text-ink-300">Search customer name<input type="search" maxLength={200} className={control} value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} /></label><label className="text-sm text-ink-300">Reporting availability<select className={control} value={filters.reporting} onChange={event => setFilters({ ...filters, reporting: event.target.value })}><option value="all">All availability</option>{statuses.map(status => <option key={status} value={status}>{status === "available" ? "Demo data present" : status}</option>)}</select></label><label className="text-sm text-ink-300">Sort customers<select className={control} value={filters.sort} onChange={event => setFilters({ ...filters, sort: event.target.value })}><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="id">Customer ID</option></select></label><button className={action} onClick={() => setFilters(initialDirectoryFilters())}>Reset filters</button></div><p role="status" className="text-sm text-ink-300">Showing {displayed.length} of {records.length} customers in this scope.</p>{displayed.length ? children(displayed) : <p className="rounded-lg border border-ink-700 p-4 text-sm text-ink-300">{records.length ? "No customers match these filters. Reset filters to see this scope." : "No customers are available in this scope."}</p>}</div>;
}
