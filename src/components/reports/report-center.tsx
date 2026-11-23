"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Printer, ArrowLeft } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { WorkflowBoundary } from "@/components/customer-workflows/workflow-boundary";
import { REPORTS, reportDefinition, requiredSections, defaultConfig, validateConfig, csvContent, DEMO_DISCLOSURE, type ReportId, type ReportConfig } from "@/components/reports/report-model";
import { getReportData, type ReportState, type ReportData } from "@/services/report-data";
import { ReportRenderer } from "@/components/reports/report-renderer";
import { ReportSchedule, reportAction, reportControl } from "@/components/reports/report-schedule";

export function ReportLibrary() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { mode } = useDashboardMode();
  const reports = REPORTS.filter(report => (category === "All" || category === report.category) && `${report.title} ${report.purpose}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="space-y-6" aria-labelledby="report-library-title">
    <header className="space-y-3"><h2 id="report-library-title" className="text-2xl font-semibold">Reporting Center · Report Library</h2><p className="text-sm leading-relaxed text-ink-300">Seven purpose-built reports. Configure a local preview, inspect it, prepare a printable report and review a proposed schedule. Historical report files and real reporting are not connected.</p></header>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm">Find a report<input type="search" maxLength={120} className={reportControl} value={search} onChange={event => setSearch(event.target.value)} /></label><label className="space-y-2 text-sm">Category<select className={reportControl} value={category} onChange={event => setCategory(event.target.value)}>{["All", "Leadership", "Security", "Resilience", "Education", "Governance"].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <p role="status" className="text-sm">{reports.length} of {REPORTS.length} reports shown. {mode === "demo" ? "Local simulated previews available." : "Live report data unavailable."}</p>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(report => <article key={report.id} className="flex min-w-0 flex-col gap-4 rounded-xl border border-ink-700 bg-ink-900 p-6"><FileText aria-hidden className="h-6 w-6 text-shield-300" /><p className="text-xs uppercase tracking-wider text-shield-300">{report.category}</p><h3 className="text-xl font-semibold">{report.title}</h3><p className="text-sm leading-relaxed text-ink-300">{report.purpose}</p><p className="text-xs leading-relaxed">{report.sections.length} content sections · Local Demo preview available · Real reporting not connected</p><Link className={`${reportAction} mt-auto text-center`} href={`/reports/${report.id}`}>Open Report</Link></article>)}</div>
    {!reports.length && <p>No reports match. Clear your search or change category.</p>}
    <button type="button" className={reportAction} onClick={() => { setSearch(""); setCategory("All"); }}>Reset Library Filters</button>
  </section>;
}

export function ReportCenter({ id }: { id: ReportId }) {
  const report = reportDefinition(id)!;
  return <><header className="space-y-4"><Link href="/reports" className={`${reportAction} inline-flex items-center gap-2`}><ArrowLeft aria-hidden className="h-4 w-4" />Return to Report Library</Link><h1 className="text-3xl font-semibold leading-tight">{report.title}</h1><p className="text-ink-300">{report.purpose}</p></header><nav aria-label="Select report" className="flex flex-wrap gap-2">{REPORTS.map(item => <Link className={reportAction} key={item.id} aria-current={id === item.id ? "page" : undefined} href={`/reports/${item.id}`}>{item.title}</Link>)}</nav><WorkflowBoundary><ReportSession key={id} id={id} /></WorkflowBoundary></>;
}

function ReportSession({ id }: { id: ReportId }) {
  const { view, selectedCustomer, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const scopeId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const scopeLabel = scopeId === null ? "All Customers" : selectedCustomer?.name ?? "Customer unavailable";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ id: ReportId; scope: number | null; registry: typeof registry; attempt: number; state: ReportState } | null>(null);
  const [draft, setDraft] = useState(() => defaultConfig(id, scopeId));
  const [preview, setPreview] = useState<{ config: ReportConfig; date: string; data: ReportData } | null>(null);
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const errors = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (mode !== "demo" || !registry) return;
    let active = true;
    const scope = scopeId === null ? { type: "all" as const } : { type: "customer" as const, customer_id: scopeId };
    getReportData(id, scope, registry, mode).then(state => { if (active) setLoaded({ id, scope: scopeId, registry, attempt, state }); }).catch(() => { if (active) setLoaded({ id, scope: scopeId, registry, attempt, state: { kind: "error", message: "Report sources could not be loaded. Retry without changing scope." } }); });
    return () => { active = false; };
  }, [id, scopeId, registry, mode, attempt]);
  const validContext = mode === "demo" && registry !== null && (scopeId === null || registry.some(customer => customer.id === scopeId));
  const state: ReportState = !validContext ? { kind: "unavailable" } : !loaded || loaded.id !== id || loaded.scope !== scopeId || loaded.registry !== registry || loaded.attempt !== attempt ? { kind: "loading" } : loaded.state;
  const currentPreview = state.kind === "ready" && preview?.data === state.data && !validateConfig(preview.config, id, scopeId) ? preview : null;
  function reset() { setDraft(defaultConfig(id, scopeId)); setPreview(null); setEditing(true); setError(null); heading.current?.focus(); }
  function apply(event: React.FormEvent) {
    event.preventDefault();
    const message = validateConfig(draft, id, scopeId);
    if (message || state.kind !== "ready") { setError(message ?? "Validated current report data is required."); requestAnimationFrame(() => errors.current?.focus()); return; }
    setPreview({ config: structuredClone(draft), date: new Date().toLocaleString(), data: state.data }); setEditing(false); setError(null); requestAnimationFrame(() => heading.current?.focus());
  }
  function outputValid() { return validContext && currentPreview && state.kind === "ready" && currentPreview.data === state.data && !validateConfig(currentPreview.config, id, scopeId); }
  const exportSections = currentPreview?.data.sections.filter(section => section.examples && currentPreview.config.examples && currentPreview.config.sections.includes(section.index)) ?? [];
  function exportCsv() {
    if (!outputValid() || !currentPreview || !exportSections.some(section => section.rows.length)) { setError("No current enabled example rows are available for CSV export."); return; }
    const rows: (string | number)[][] = [[DEMO_DISCLOSURE], ["Report", currentPreview.config.title], ["Scope", scopeLabel], ["Local preview generation date (not coverage period)", currentPreview.date]];
    for (const section of exportSections) { rows.push([], [reportDefinition(id)!.sections[section.index]], ["Source", section.source], ["Definitions", section.definition], section.headers, ...(currentPreview.config.detail === "summary" ? section.rows.slice(0, 5) : section.rows)); }
    const url = URL.createObjectURL(new Blob([csvContent(rows)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `quantum-demo-${id}-${scopeId ?? "all"}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const definition = reportDefinition(id)!;
  if (state.kind !== "ready") return <section className="rounded-xl border border-ink-700 p-6"><p role="status">{state.kind === "loading" ? "Loading and validating scoped report sources…" : state.kind === "error" ? state.message : "Live reporting integrations are not connected. No Demo report can be printed or exported."}</p>{state.kind === "error" && <button className={`${reportAction} mt-4`} onClick={() => { reset(); setAttempt(attempt + 1); }}>Retry Report Sources</button>}</section>;
  return <div className="min-w-0 space-y-6">
    <section className="space-y-4 rounded-xl border border-ink-700 bg-ink-900 p-4 sm:p-6" aria-labelledby="configuration-heading"><h2 id="configuration-heading" tabIndex={-1} ref={heading} className="text-xl font-semibold">{editing ? "Configure local report" : "Review generated preview"}</h2><p className="text-sm">Scope: {scopeLabel}. Configuration preview — not saved. Source data has no supported historical date filter.</p>
      {error && <p ref={errors} tabIndex={-1} role="alert" className="text-amber-300">{error}</p>}
      {editing ? <form onSubmit={apply} className="space-y-4"><label className="block space-y-2 text-sm">Report display title<input required minLength={8} maxLength={80} className={reportControl} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label><fieldset className="space-y-3"><legend className="mb-3 text-sm font-medium">Included sections · overview required; source limitations always included</legend>{definition.sections.map((section, index) => <label key={section} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.sections.includes(index)} disabled={requiredSections(id).includes(index)} onChange={event => setDraft({ ...draft, sections: event.target.checked ? [...draft.sections, index] : draft.sections.filter(value => value !== index) })} />{section}{requiredSections(id).includes(index) ? " (required)" : ""}</label>)}</fieldset><label className="block space-y-2 text-sm">Presentation<select className={reportControl} value={draft.detail} onChange={event => setDraft({ ...draft, detail: event.target.value as ReportConfig["detail"] })}><option value="detailed">Detailed · every row</option><option value="summary">Summary · up to five rows per section</option></select></label>{state.data.sections.some(section => section.examples) && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.examples} onChange={event => setDraft({ ...draft, examples: event.target.checked })} />Include illustrative record sections</label>}<div className="flex flex-wrap gap-2"><button className={`${reportAction} bg-shield-400 !text-black`}>Apply Preview</button><button type="button" className={reportAction} onClick={reset}>Cancel / Reset Configuration</button></div></form> : <div className="flex flex-wrap gap-2"><button className={reportAction} onClick={() => { setEditing(true); setPreview(null); heading.current?.focus(); }}>Edit Configuration</button><button className={reportAction} onClick={reset}>Cancel / Reset Preview</button></div>}
    </section>
    {currentPreview ? <><div role="status" className="text-sm">Local report preview prepared. Nothing has been saved or delivered.</div><div className="flex flex-wrap gap-3"><button className={`${reportAction} inline-flex items-center gap-2`} onClick={() => { if (outputValid()) window.print(); else setError("Report context changed. Prepare a new preview before printing."); }}><Printer aria-hidden className="h-4 w-4" />Print / Save as PDF</button><button className={reportAction} disabled={!exportSections.some(section => section.rows.length)} onClick={exportCsv}>Export Demo Example CSV</button></div><p className="text-sm text-ink-300">Save as PDF is an option in your browser’s print dialog where supported. Opening that dialog does not confirm a file was saved. {exportSections.length ? "CSV follows enabled example sections and presentation row limits." : "No enabled approved example dataset for CSV; aggregate report export is not offered."}</p><ReportRenderer data={currentPreview.data} config={currentPreview.config} scopeLabel={scopeLabel} generatedAt={currentPreview.date} /><ReportSchedule key={`${currentPreview.date}:${currentPreview.config.title}`} config={currentPreview.config} scopeLabel={scopeLabel} />{createPortal(<div className="report-print-root"><ReportRenderer data={currentPreview.data} config={currentPreview.config} scopeLabel={scopeLabel} generatedAt={currentPreview.date} printable /></div>, document.body)}</> : <p role="status" className="rounded-xl border border-ink-700 p-6">Choose supported options and Apply Preview to inspect, print or export your local report. Scheduling review becomes available for the prepared configuration.</p>}
  </div>;
}
