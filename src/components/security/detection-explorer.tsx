"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Radar } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { useSecurityDetections } from "@/components/security/use-security-detections";
import { detectionFeedView, DETECTIONS_SEPARATION_NOTICE } from "@/components/security/threats-detections-view";
import { DEFAULT_DETECTION_FILTERS, filterDetections, selectedDetection, type DetectionFilters } from "@/components/security/detection-explorer-view";
import { DetectionDetail } from "@/components/security/detection-detail";
import type { DetectionsState } from "@/services/security-detections";

const control = "min-h-11 w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none focus-visible:ring-2 focus-visible:ring-shield-400";
const action = "inline-flex min-h-10 items-center justify-center rounded-lg border border-ink-600 px-3 py-2 text-sm font-medium text-shield-300 hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400";
const severityTone = { critical: "text-red-300", high: "text-orange-300", medium: "text-amber-signal", low: "text-sky-300" };

export function DetectionExplorer() {
  const { mode } = useDashboardMode();
  const { view, selectedCustomer } = useCustomerView();
  const { state, retry } = useSecurityDetections();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const scope = mode === "live" ? "Customer scope unavailable" : customerId === null ? "All Customers" : selectedCustomer?.name ?? "Customer unavailable";
  return <ExplorerContent key={`${mode}:${customerId}`} state={state} scope={scope} demo={mode === "demo"} retry={retry} />;
}

function ExplorerContent({ state, scope, demo, retry }: { state: DetectionsState; scope: string; demo: boolean; retry: () => void }) {
  const [filters, setFilters] = useState<DetectionFilters>({ ...DEFAULT_DETECTION_FILTERS });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const feed = detectionFeedView(state, scope);
  const records = state.kind === "ready" ? state.detections : [];
  const visible = filterDetections(records, filters);
  const selected = selectedDetection(state, selectedId);
  const reset = () => setFilters({ ...DEFAULT_DETECTION_FILTERS });

  return <div className="space-y-6">
    <Link href="/security" className={action}>Back to Security</Link>
    <header className="space-y-4"><div className="flex items-center gap-3 text-shield-300"><Radar aria-hidden className="h-6 w-6" /><span className="font-mono text-xs uppercase tracking-widest">Detection visibility</span></div><h1 className="text-3xl font-semibold leading-tight text-ink-100 sm:text-4xl">Detection Explorer</h1><p className="text-sm leading-relaxed text-ink-300">Explore validated example observations, refine the displayed records and open their investigation preview.</p><p className="break-words text-sm text-ink-100">Scope: {scope}</p></header>
    <p className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-ink-300">{demo ? `Demonstration only · fictional records. ${DETECTIONS_SEPARATION_NOTICE}` : "Security reporting is not connected. No records are shown; this does not mean no threats exist."}</p>
    {state.kind === "ready" ? <>
      <div className="grid gap-4 rounded-2xl border border-ink-700 bg-ink-900 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <label className="space-y-2 text-sm text-ink-300"><span className="flex items-center gap-2"><Search aria-hidden className="h-4 w-4" />Search example detections</span><input type="search" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Title, observation, customer or source" className={control} /></label>
        <label className="space-y-2 text-sm text-ink-300"><span>Severity</span><select value={filters.severity} onChange={event => setFilters({ ...filters, severity: event.target.value as DetectionFilters["severity"] })} className={control}><option value="all">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label className="space-y-2 text-sm text-ink-300"><span>Sort examples</span><select value={filters.sort} onChange={event => setFilters({ ...filters, sort: event.target.value as DetectionFilters["sort"] })} className={control}><option value="severity">Severity: highest first</option><option value="title-asc">Title: A–Z</option><option value="title-desc">Title: Z–A</option></select></label>
        <button type="button" onClick={reset} className={`${action} self-end`}>Clear search and filters</button>
      </div>
      <p role="status" className="text-sm text-ink-300">{visible.length} of {records.length} example detections shown. Not the total security issue count.</p>
      {visible.length ? <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900"><table className="w-full table-fixed text-left text-sm"><caption className="sr-only">Fictional example detections for {scope}</caption><thead className="border-b border-ink-700 bg-ink-950 text-ink-300"><tr><th scope="col" className="p-4">Detection</th><th scope="col" className="hidden w-40 p-4 md:table-cell">Customer</th><th scope="col" className="hidden w-28 p-4 md:table-cell">Severity</th><th scope="col" className="w-28 p-4">Details</th></tr></thead><tbody className="divide-y divide-ink-800">{visible.map(record => <tr key={record.id} data-customer-id={record.customerId}><th scope="row" className="p-4 font-normal"><p className="break-words font-medium text-ink-100">{record.title}</p><p className="mt-2 break-words leading-relaxed text-ink-350">{record.summary}</p><p className="mt-2 text-xs text-ink-300 md:hidden">{record.customerName} · <span className={`capitalize ${severityTone[record.severity]}`}>{record.severity}</span></p></th><td className="hidden break-words p-4 text-ink-300 md:table-cell">{record.customerName}</td><td className={`hidden p-4 capitalize md:table-cell ${severityTone[record.severity]}`}>{record.severity}</td><td className="p-2 sm:p-4"><button type="button" onClick={() => setSelectedId(record.id)} aria-label={`View details: ${record.title}`} aria-haspopup="dialog" className={action}>Details</button></td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-ink-700 p-6 text-sm text-ink-100"><h2 className="font-semibold">{records.length ? "No matching example detections" : feed.emptyTitle}</h2><p className="mt-2 leading-relaxed text-ink-300">{records.length ? "Try another search or clear the filters. No matches is not a statement about real security threats." : feed.emptyBody}</p><button type="button" onClick={reset} className={`${action} mt-4`}>Reset explorer</button></div>}
      <p className="text-xs leading-relaxed text-ink-350">The canonical examples have no status, detection-type or timestamp fields. Those filters and timelines are intentionally not fabricated.</p>
    </> : <section aria-busy={state.kind === "loading"} className="rounded-2xl border border-ink-700 bg-ink-900 p-6"><h2 className="text-lg font-semibold text-ink-100">{feed.emptyTitle}</h2><p role={state.kind === "error" ? "alert" : "status"} className="mt-3 text-sm leading-relaxed text-ink-300">{feed.emptyBody}</p>{state.kind === "error" && <button type="button" onClick={retry} className={`${action} mt-4`}>Retry example detections</button>}</section>}
    {selected && <DetectionDetail record={selected} onClose={() => setSelectedId(null)} />}
  </div>;
}
