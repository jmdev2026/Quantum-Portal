"use client";

import { ClipboardCheck, BookOpen, FileText, ShieldCheck } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { useSecurityCoverage } from "@/components/dashboard/use-security-coverage";
import { FRAMEWORK_FUNCTIONS, EVIDENCE_CATEGORIES, NIST_REFERENCE, FRAMEWORK_DISCLAIMER, CONTROL_DISCLOSURE, complianceScope, complianceControls } from "@/components/compliance/compliance-view";

export function ComplianceWorkspace() {
  const { mode } = useDashboardMode();
  const { view, selectedCustomer } = useCustomerView();
  const { state, retry } = useSecurityCoverage();
  const scope = complianceScope(mode, view, selectedCustomer?.name);
  const controls = complianceControls(state, mode, scope);
  const signalsAvailable = controls.rows.some(row => row.value.kind === "status");
  return <>
    <header className="space-y-4">
      <div className="flex items-center gap-3 text-shield-300"><ClipboardCheck aria-hidden className="h-6 w-6" /><span className="font-mono text-xs uppercase tracking-widest">Framework visibility</span></div>
      <h1 className="text-3xl font-semibold leading-tight text-ink-100 sm:text-4xl">Compliance</h1>
      <p className="text-base leading-relaxed text-ink-300">Security framework visibility, control reporting and assessment preparation for the selected customer.</p>
      <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-ink-100"><p>{mode === "demo" ? "Demonstration preview · simulated security signals, not compliance findings." : "Customer-specific reporting integrations are not connected."}</p><p className="mt-2 break-words">Scope: {scope}</p></div>
    </header>
    <section aria-labelledby="framework-title" className="space-y-6">
      <div><h2 id="framework-title" className="text-xl font-semibold text-ink-100">Framework Overview</h2><p className="mt-2 text-sm text-ink-300">NIST Cybersecurity Framework 2.0 · reference framework</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{FRAMEWORK_FUNCTIONS.map((item, index) => <div key={item.name} className="min-w-0 rounded-xl border border-ink-700 bg-ink-900/80 p-6"><BookOpen aria-hidden className="mb-4 h-5 w-5 text-shield-300" /><p className="mb-2 font-mono text-xs text-ink-300">Reference function {index + 1}</p><h3 className="text-lg font-semibold text-shield-300">{item.name}</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{item.description}</p></div>)}</div>
      <p className="text-sm leading-relaxed text-ink-300">Official NIST function names; explanations are Quantum Shield’s high-level educational summaries. No formal control-to-framework mappings are made.</p>
      <p className="text-sm leading-relaxed text-ink-100">{FRAMEWORK_DISCLAIMER}</p>
      <a href={NIST_REFERENCE} target="_blank" rel="noopener noreferrer" className="inline-block rounded text-sm text-shield-300 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400">Official NIST CSF 2.0 publication</a>
    </section>
    <section aria-labelledby="control-visibility-title" aria-busy={controls.status === "loading"} className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><h2 id="control-visibility-title" className="text-xl font-semibold text-ink-100">Security Control Visibility</h2><span className="rounded-full border border-ink-600 px-3 py-1 text-xs text-ink-100">{controls.badge}</span></div>
      <p className="mt-4 text-sm leading-relaxed text-ink-300">{mode === "demo" ? CONTROL_DISCLOSURE : "Control reporting is not connected. No customer protection or compliance status can be inferred."} Covered does not mean that a formal compliance requirement has been satisfied.</p>
      <p role="status" className="sr-only">{controls.announcement}</p>
      {controls.message && <div className="mt-4 rounded-xl border border-ink-700 p-4 text-sm text-ink-100"><p>{controls.message.title}</p><p className="mt-2 leading-relaxed text-ink-300">{controls.message.body}</p>{controls.status === "error" && <button type="button" onClick={retry} className="mt-3 rounded-lg border border-ink-600 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400">Retry control reporting</button>}</div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{controls.rows.map(row => <div key={row.key} data-control={row.key} className="min-w-0 rounded-xl border border-ink-700 bg-ink-950/50 p-4"><ShieldCheck aria-hidden className="mb-3 h-5 w-5 text-ink-300" /><h3 className="text-sm font-semibold leading-relaxed text-ink-100">{row.label}</h3><p className={`mt-3 text-sm ${row.value.kind === "status" && row.value.status === "covered" ? "text-shield-300" : row.value.kind === "status" && row.value.status === "needs_attention" ? "text-amber-signal" : "text-ink-300"}`}>{row.value.kind === "loading" ? "Loading" : row.value.label}</p>{row.value.kind === "status" && <p className="mt-2 text-xs text-ink-300">Simulated reporting signal</p>}</div>)}</div>
    </section>
    <section aria-labelledby="evidence-title" className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4 sm:p-6"><h2 id="evidence-title" className="text-xl font-semibold text-ink-100">Assessment Evidence</h2><p className="mt-4 text-sm leading-relaxed text-ink-100">Assessment evidence has not been collected or verified through Quantum Shield Command.</p><p className="mt-3 text-sm leading-relaxed text-ink-300">{mode === "live" ? "Evidence reporting is not connected. This says nothing about evidence held outside this portal." : "Educational preparation guide, not a customer evidence inventory. These examples are not mandatory for every organization, framework or jurisdiction."}</p>{mode === "demo" && <ul className="mt-6 grid gap-4 sm:grid-cols-2">{EVIDENCE_CATEGORIES.map(category => <li key={category} className="flex items-start gap-3 rounded-xl border border-ink-700 p-4 text-sm leading-relaxed text-ink-100"><FileText aria-hidden className="mt-1 h-4 w-4 shrink-0 text-ink-300" /><span>{category}<span className="mt-2 block text-xs text-ink-300">Illustrative evidence category</span></span></li>)}</ul>}</section>
    <section aria-labelledby="compliance-summary-title" className="rounded-2xl border border-shield-500/30 bg-ink-900 p-4 sm:p-6"><h2 id="compliance-summary-title" className="text-xl font-semibold text-ink-100">Compliance Summary</h2><dl className="mt-6 grid gap-6 text-sm sm:grid-cols-2"><div><dt className="text-ink-300">Current scope</dt><dd className="mt-2 break-words text-ink-100">{scope}</dd></div><div><dt className="text-ink-300">Reference framework</dt><dd className="mt-2 text-ink-100">NIST CSF 2.0</dd></div><div><dt className="text-ink-300">Security-control reporting</dt><dd className="mt-2 text-ink-100">{mode === "live" ? "Not connected" : controls.status === "loading" ? "Loading" : signalsAvailable ? "Simulated signals available" : "No usable simulated signals available"}</dd></div><div><dt className="text-ink-300">Evidence through this application</dt><dd className="mt-2 text-ink-100">Not collected or verified</dd></div></dl><p className="mt-6 font-medium text-ink-100">Compliance status has not been assessed.</p><p className="mt-3 text-sm leading-relaxed text-ink-300">No formal assessment has been completed through this application. Security-reporting signals are not compliance conclusions. This view does not determine the customer’s actual regulatory compliance, control effectiveness or assessment readiness.</p></section>
  </>;
}
