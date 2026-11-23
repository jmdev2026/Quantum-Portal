"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { buildComplianceReport } from "@/services/compliance-report";
import type { GovernanceData } from "@/services/governance";
import type { KnownCustomer } from "@/services/security-detections";
import type { AssessmentDraft } from "@/components/governance/governance-model";
import { ReportRenderer } from "@/components/reports/report-renderer";
import { defaultConfig, validateConfig, requiredSections, reportDefinition, csvContent, DEMO_DISCLOSURE } from "@/components/reports/report-model";
import { reportAction, reportControl } from "@/components/reports/report-schedule";

export function LocalComplianceReport({ data, draft, selected, registry }: { data: GovernanceData; draft: AssessmentDraft; selected: number | null; registry: readonly KnownCustomer[] }) {
  const { mode } = useDashboardMode();
  const [config, setConfig] = useState(() => defaultConfig("compliance", draft.customer));
  const [preview, setPreview] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const report = mode === "demo" ? buildComplianceReport(data, selected, registry, draft) : null;
  const scopeLabel = registry.find(customer => customer.id === draft.customer)?.name;
  const valid = report && scopeLabel && !validateConfig(config, "compliance", draft.customer);
  function exportCsv() {
    if (!valid || !preview || !report) return;
    const rows: (string | number)[][] = [[DEMO_DISCLOSURE], ["Scope", scopeLabel!], ["Report", config.title]];
    for (const section of report.sections.filter(section => section.examples && config.examples && config.sections.includes(section.index))) rows.push([], [reportDefinition("compliance")!.sections[section.index]], ["Source", section.source], ["Limitations", section.definition], section.headers, ...(config.detail === "summary" ? section.rows.slice(0, 5) : section.rows));
    const url = URL.createObjectURL(new Blob([csvContent(rows)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `quantum-demo-compliance-${draft.customer}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!report || !scopeLabel) return <p role="alert">Current assessment scope did not validate. No report output is available.</p>;
  return <section className="min-w-0 space-y-4 border-t border-ink-600 pt-6"><h3 className="text-xl font-semibold">In-workflow Compliance Report</h3><p>Current validated local review only. Nothing is transferred across routes or saved. Private notes are omitted from report output.</p>{error && <p role="alert" className="text-amber-300">{error}</p>}
    {!preview ? <form className="space-y-4" onSubmit={event => { event.preventDefault(); const message = validateConfig(config, "compliance", draft.customer); if (message) setError(message); else { setDate(new Date().toLocaleString()); setError(null); setPreview(true); } }}><label className="block text-sm">Report display title<input className={reportControl} required minLength={8} maxLength={80} value={config.title} onChange={event => setConfig({ ...config, title: event.target.value })} /></label><fieldset><legend>Supported sections · methodology and limitations required</legend>{reportDefinition("compliance")!.sections.map((title, index) => <label key={title} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" disabled={requiredSections("compliance").includes(index)} checked={config.sections.includes(index)} onChange={event => setConfig({ ...config, sections: event.target.checked ? [...config.sections, index] : config.sections.filter(value => value !== index) })} />{title}</label>)}</fieldset><label className="block text-sm">Presentation<select className={reportControl} value={config.detail} onChange={event => setConfig({ ...config, detail: event.target.value as "summary" | "detailed" })}><option value="detailed">Detailed</option><option value="summary">Summary · first five rows</option></select></label><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={config.examples} onChange={event => setConfig({ ...config, examples: event.target.checked })} />Include illustrative tables</label><button className={reportAction}>Preview Compliance Report</button></form> : valid && <><div className="flex flex-wrap gap-2"><button className={reportAction} onClick={() => { if (valid && mode === "demo") window.print(); }}>Print / Save as PDF</button><button className={reportAction} disabled={!config.examples || !report.sections.some(section => section.examples && config.sections.includes(section.index) && section.rows.length)} onClick={exportCsv}>Export Demo Example CSV</button><button className={reportAction} onClick={() => setPreview(false)}>Edit Configuration</button></div><p>Browser printing is real; PDF saving is not verified. CSV contains demonstration tables, not evidence files or private notes.</p><ReportRenderer data={report} config={config} scopeLabel={scopeLabel} generatedAt={date} />{createPortal(<div className="report-print-root"><ReportRenderer data={report} config={config} scopeLabel={scopeLabel} generatedAt={date} printable /></div>, document.body)}</>}
    <button type="button" className={reportAction} onClick={() => { setConfig(defaultConfig("compliance", draft.customer)); setPreview(false); setError(null); }}>Cancel / Reset Report</button>
  </section>;
}
