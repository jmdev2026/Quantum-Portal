"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { ExecutiveSummary } from "@/components/reports/executive-summary";
import { IssuesBySeverityPanel } from "@/components/dashboard/issues-by-severity-panel";
import { SecurityCoveragePanel } from "@/components/dashboard/security-coverage-panel";
import { SecurityControlsPanel } from "@/components/security/security-controls-panel";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { BackupOverviewPanel } from "@/components/backup/backup-overview-panel";
import { RESTORE_UNAVAILABLE } from "@/components/backup/recovery-information-view";

export const REPORT_TYPES = ["Executive Summary", "Cybersecurity Report", "Backup & Recovery Report"] as const;

export function ReportsWorkspace() {
  const [selected, setSelected] = useState<(typeof REPORT_TYPES)[number]>(REPORT_TYPES[0]);
  const { mode } = useDashboardMode();
  const { view, selectedCustomer } = useCustomerView();
  const scope = mode === "live" ? "Customer scope unavailable" : view.mode === "all" ? "All Customers" : selectedCustomer?.name ?? "Customer unavailable";
  return <>
    <header className="space-y-4">
      <div className="flex items-center gap-3 text-shield-300"><BarChart3 aria-hidden className="h-6 w-6" /><span className="font-mono text-xs uppercase tracking-widest">Client reporting</span></div>
      <h1 className="text-3xl font-semibold leading-tight text-ink-100 sm:text-4xl">Reports</h1>
      <p className="text-base leading-relaxed text-ink-300">Customer-specific cybersecurity, endpoint visibility and backup reporting.</p>
      <p className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-ink-100">{mode === "demo" ? "Demonstration previews · simulated data only. These figures do not establish verified customer health or protection." : "Reporting integrations are not connected."}</p>
    </header>
    <div role="group" aria-label="Select report" className="grid gap-2 rounded-xl border border-ink-700 bg-ink-900 p-2 sm:grid-cols-3">{REPORT_TYPES.map(report => <button key={report} type="button" aria-pressed={selected === report} onClick={() => setSelected(report)} className={`min-w-0 rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400 ${selected === report ? "bg-shield-400 text-black" : "text-ink-100 hover:bg-ink-800"}`}>{report}</button>)}</div>
    <article aria-labelledby="report-title" className="min-w-0 space-y-8 rounded-2xl border border-ink-700 bg-ink-900/70 p-4 sm:p-8">
      <header className="border-b border-ink-700 pb-6"><p className="mb-2 text-xs font-mono uppercase tracking-wider text-shield-300">{mode === "demo" ? "Demonstration preview" : "Unavailable reporting"}</p><h2 id="report-title" className="text-2xl font-semibold leading-tight text-ink-100">{selected}</h2><p className="mt-3 break-words text-sm text-ink-100">Scope: {scope}</p></header>
      <p role="status" className="sr-only">{selected} selected. {mode === "live" ? "Reporting integrations are not connected." : scope}</p>
      {selected === "Executive Summary" && <ExecutiveSummary />}
      {selected === "Cybersecurity Report" && <div className="grid gap-6 md:grid-cols-2"><IssuesBySeverityPanel /><SecurityCoveragePanel /><SecurityControlsPanel /><InsightsPanel /></div>}
      {selected === "Backup & Recovery Report" && <><BackupOverviewPanel scopeLabel={scope} delay={0} /><p className="rounded-xl border border-ink-700 p-4 text-sm leading-relaxed text-ink-100">{RESTORE_UNAVAILABLE} No verified recovery points are available.</p></>}
      <section className="border-t border-ink-700 pt-6" aria-labelledby="report-limitations"><h3 id="report-limitations" className="text-base font-semibold text-ink-100">Sources & Reporting Limitations</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">Existing validated Asset Summary, Security Severity, Security Coverage, Security Insights and Backup Health responses are presented without new findings or historical comparisons. Security coverage is a fictional reporting indicator, not a verified security score; control statuses do not calculate it. Reporting availability does not establish customer health.</p><p className="mt-3 text-sm leading-relaxed text-ink-300">Asset counts do not prove endpoint protection or recoverability. Backup freshness is a reporting categorization, not proof of full protection. Job outcomes count fictional executions, not unique assets; the last-24-hours period is illustrative. Not Available does not automatically mean failed. Successful executions do not establish restore readiness. No live provider telemetry is connected.</p></section>
    </article>
  </>;
}
