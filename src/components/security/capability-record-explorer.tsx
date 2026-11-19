"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CAPABILITY_CATEGORIES, ILLUSTRATIVE_STATUSES, type CapabilityState, type NewCapabilityId } from "@/services/security-capability-types";
import { SEVERITY_LEVELS } from "@/services/security-severity";
import { filterCapabilityRecords, resetCapabilityFilters, selectedCapabilityRecord, capabilityStateMessage, categoryLabel, type CapabilityFilters } from "@/components/security/capability-explorer-view";
import { CapabilityRecordDetail } from "@/components/security/capability-record-detail";
import type { CapabilityDefinition } from "@/components/security/security-capability-directory";

const control = "min-h-11 w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none focus-visible:ring-2 focus-visible:ring-shield-400";
export const capabilityAction = "inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-600 px-3 py-2 text-sm font-medium text-shield-300 hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400";

export function CapabilityRecordExplorer({ capability, state, scope, retry }: { capability: CapabilityDefinition; state: CapabilityState; scope: string; retry: () => void }) {
  const [filters, setFilters] = useState<CapabilityFilters>(resetCapabilityFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const change = (field: keyof CapabilityFilters, value: string) => setFilters(previous => ({ ...previous, [field]: value }));
  const selected = selectedCapabilityRecord(state, selectedId);
  const message = capabilityStateMessage(state);
  const hasSeverity = capability.filter === "severity" || capability.id === "external-footprint";
  const hasStatus = capability.id === "email-protection" || capability.id === "cloud-data-protection";
  const reset = () => { setFilters(resetCapabilityFilters()); setSelectedId(null); };
  if (state.kind !== "ready") return <section aria-busy={state.kind === "loading"} className="rounded-2xl border border-ink-700 bg-ink-900 p-6"><h2 className="text-lg font-semibold text-ink-100">{message.title}</h2><p role={state.kind === "error" ? "alert" : "status"} className="mt-3 text-sm leading-relaxed text-ink-300">{message.body}</p>{state.kind === "error" && <button type="button" onClick={retry} className={`${capabilityAction} mt-4`}>Retry fictional observations</button>}</section>;
  const visible = filterCapabilityRecords(state.records, filters);
  return <section aria-labelledby="capability-explorer-title" className="space-y-4">
    <h2 id="capability-explorer-title" className="text-xl font-semibold text-ink-100">{capability.explorer}</h2>
    <div className="grid gap-4 rounded-2xl border border-ink-700 bg-ink-900 p-4 sm:grid-cols-2 xl:grid-cols-3">
      <label className="space-y-2 text-sm text-ink-300 sm:col-span-2 xl:col-span-3"><span className="flex items-center gap-2"><Search aria-hidden className="h-4 w-4" />Search {capability.noun}</span><input type="search" value={filters.search} onChange={event => change("search", event.target.value)} placeholder="Name, observation, customer, source or asset label" className={control} /></label>
      {capability.filter === "category" && <label className="space-y-2 text-sm text-ink-300"><span>{capability.categoryLabel}</span><select value={filters.category} onChange={event => change("category", event.target.value)} className={control}><option value="all">All categories</option>{CAPABILITY_CATEGORIES[capability.id as NewCapabilityId].map(category => <option key={category} value={category}>{categoryLabel(category)}</option>)}</select></label>}
      {hasSeverity && <label className="space-y-2 text-sm text-ink-300"><span>{capability.id === "external-footprint" ? "Illustrative severity" : "Example severity"}</span><select value={filters.severity} onChange={event => change("severity", event.target.value)} className={control}><option value="all">All severities</option>{SEVERITY_LEVELS.map(severity => <option key={severity} value={severity}>{severity}</option>)}</select></label>}
      {capability.filter === "protection" && <label className="space-y-2 text-sm text-ink-300"><span>Protection visibility</span><select value={filters.protection} onChange={event => change("protection", event.target.value)} className={control}><option value="all">All supplied observations</option><option value="not-verified">Protection not verified</option></select></label>}
      {hasStatus && <label className="space-y-2 text-sm text-ink-300"><span>Illustrative status</span><select value={filters.status} onChange={event => change("status", event.target.value)} className={control}><option value="all">All illustrative statuses</option>{ILLUSTRATIVE_STATUSES.map(status => <option key={status} value={status}>{categoryLabel(status)}</option>)}</select></label>}
      <label className="space-y-2 text-sm text-ink-300"><span>Sort examples</span><select value={filters.sort} onChange={event => change("sort", event.target.value)} className={control}><option value="name-asc">Name: A–Z</option><option value="name-desc">Name: Z–A</option>{hasSeverity && <option value="severity">Severity: highest first</option>}</select></label>
      <button type="button" onClick={reset} className={`${capabilityAction} self-end`}>Reset search and filters</button>
    </div>
    <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-ink-300">{visible.length} of {state.records.length} fictional {capability.noun} shown for {scope}. Example rows, never verified monitoring totals.</p>
    {visible.length ? <ul className={`grid gap-4 ${capability.id === "mdr" ? "" : "lg:grid-cols-2"}`}>{visible.map(record => <li key={record.id} data-customer-id={record.customerId} className="min-w-0 rounded-2xl border border-ink-700 bg-ink-900 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-md border border-amber-signal/30 px-2 py-1 text-amber-signal">Fictional example</span>{record.severity && <span className="rounded-md border border-ink-600 px-2 py-1 capitalize text-ink-100">{record.severity} severity</span>}{record.category && <span className="capitalize text-shield-300">{categoryLabel(record.category)}</span>}</div>
      <h3 className="mt-4 break-words text-base font-semibold leading-tight text-ink-100">{record.name}</h3>
      <p className="mt-2 break-words text-sm text-ink-300">{record.customerName}</p>
      {record.assetLabel && <p className="mt-3 break-words rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs text-shield-300">{record.assetLabel}</p>}
      <p className="mt-4 text-sm leading-relaxed text-ink-300">{record.observation}</p>
      {record.protectionVisibility && <p className="mt-4 text-xs leading-relaxed text-amber-signal">Protection not verified · {record.protectionVisibility}</p>}
      {record.status && <p className="mt-3 text-xs text-ink-300">Illustrative status: <span className="capitalize">{categoryLabel(record.status)}</span> · not a provider outcome</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-ink-350">Fictional source: {record.source}</p><button type="button" aria-haspopup="dialog" aria-label={`Inspect observation: ${record.name}`} onClick={() => setSelectedId(record.id)} className={capabilityAction}>Inspect details</button></div>
    </li>)}</ul> : <div className="rounded-xl border border-ink-700 p-6"><h3 className="font-semibold text-ink-100">{state.records.length ? "No matching fictional observations" : message.title}</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{state.records.length ? "Try a different search or reset the filters. No matches does not mean no real risks." : message.body}</p><button type="button" onClick={reset} className={`${capabilityAction} mt-4`}>Reset explorer</button></div>}
    {selected && <CapabilityRecordDetail record={selected} capability={capability} onClose={() => setSelectedId(null)} />}
  </section>;
}
