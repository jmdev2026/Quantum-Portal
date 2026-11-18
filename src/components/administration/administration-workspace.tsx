"use client";

import { Settings2, Building2, KeyRound, Cable, ScrollText } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { RESTORE_UNAVAILABLE } from "@/components/backup/recovery-information-view";
import { ADMINISTRATION_BOUNDARY, administrationScope, PROPOSED_ROLES, ACCESS_REQUIREMENTS, INTEGRATION_PLANS, CONNECTIVITY_REQUIREMENTS, AUDIT_EVENT_TYPES, AUDIT_REQUIREMENTS } from "@/components/administration/administration-view";

export function AdministrationWorkspace() {
  const { mode } = useDashboardMode();
  const { view, selectedCustomer } = useCustomerView();
  const scope = administrationScope(mode, view, selectedCustomer?.name);
  return <>
    <header className="space-y-4">
      <div className="flex items-center gap-3 text-shield-300"><Settings2 aria-hidden className="h-6 w-6" /><span className="font-mono text-xs uppercase tracking-widest">Portal foundation</span></div>
      <h1 className="text-3xl font-semibold leading-tight text-ink-100 sm:text-4xl">Administration</h1>
      <p className="text-base leading-relaxed text-ink-300">Organization context, access governance, integration readiness and auditability planning.</p>
      <p className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-ink-100">{ADMINISTRATION_BOUNDARY}</p>
    </header>
    <section aria-labelledby="organization-title" className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4 sm:p-6">
      <Building2 aria-hidden className="mb-4 h-5 w-5 text-shield-300" /><h2 id="organization-title" className="text-xl font-semibold text-ink-100">Organization & Portal Overview</h2>
      <dl className="mt-6 grid gap-6 text-sm sm:grid-cols-2"><div><dt className="text-ink-300">Product</dt><dd className="mt-2 font-medium text-ink-100">Quantum Shield Command</dd></div><div><dt className="text-ink-300">Technology provider</dt><dd className="mt-2 text-ink-100">Quantum Shield IT</dd></div><div><dt className="text-ink-300">Current display scope</dt><dd className="mt-2 break-words text-ink-100">{scope}</dd></div><div><dt className="text-ink-300">Mode & implementation</dt><dd className="mt-2 text-ink-100">{mode === "demo" ? "Demo · fictional reporting context" : "Live · customer reporting unavailable"}<span className="mt-2 block text-ink-300">Read-only administration foundation</span></dd></div></dl>
      <p className="mt-6 text-sm leading-relaxed text-ink-300">Unified cybersecurity, endpoint visibility and backup reporting. Operational administration is not implemented in this portal.</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-100">{mode === "demo" ? "The shared customer selector changes which fictional customer information is displayed. All Customers is a demonstration/MSP-level display scope. Selection does not grant or enforce permissions." : "No fictional customer identities are presented. Real customer reporting is unavailable until connected; no authenticated customer identity is asserted."}</p>
      <p role="status" className="sr-only">{mode === "demo" ? "Demo display scope" : "Live display scope"}: {scope}. Planning content only; no operational administration.</p>
    </section>
    <section aria-labelledby="access-title" className="space-y-6">
      <div><KeyRound aria-hidden className="mb-4 h-5 w-5 text-shield-300" /><h2 id="access-title" className="text-xl font-semibold text-ink-100">Access Governance</h2><p className="mt-3 text-sm leading-relaxed text-ink-300">Planned security architecture, not implemented permissions. This page does not demonstrate administrator authorization.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">{ACCESS_REQUIREMENTS.map(item => <div key={item.name} className="min-w-0 rounded-xl border border-ink-700 bg-ink-900/80 p-6"><h3 className="text-base font-semibold text-ink-100">{item.name}</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{item.description}</p></div>)}</div>
      <div className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4 sm:p-6"><h3 className="text-base font-semibold text-ink-100">Proposed access model — not enforced</h3><p className="mt-3 text-sm text-ink-300">Future role categories only. No roles are assigned to users.</p><dl className="mt-6 grid gap-6 lg:grid-cols-3">{PROPOSED_ROLES.map(role => <div key={role.name} className="min-w-0"><dt className="text-sm font-semibold text-ink-100">{role.name}</dt><dd className="mt-3 text-sm leading-relaxed text-ink-300">{role.description}</dd></div>)}</dl></div>
    </section>
    <section aria-labelledby="integrations-title" className="space-y-6">
      <div><Cable aria-hidden className="mb-4 h-5 w-5 text-shield-300" /><h2 id="integrations-title" className="text-xl font-semibold text-ink-100">Integration Readiness</h2><p className="mt-3 text-sm leading-relaxed text-ink-300">Implementation context only; these labels do not describe provider account health or external connection status.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">{INTEGRATION_PLANS.map(item => <div key={item.name} className="min-w-0 rounded-xl border border-ink-700 bg-ink-900/80 p-6"><h3 className="text-base font-semibold leading-relaxed text-ink-100">{item.name}</h3><p className="mt-4 inline-block max-w-full rounded-lg border border-ink-600 px-3 py-2 text-xs leading-relaxed text-ink-300">Pending backend integration</p><p className="mt-4 text-sm leading-relaxed text-ink-300">{item.description}</p></div>)}</div>
      <div className="rounded-xl border border-ink-700 p-4 sm:p-6"><h3 className="text-base font-semibold text-ink-100">Secure connectivity requirements</h3><ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-300">{CONNECTIVITY_REQUIREMENTS.map(item => <li key={item}>{item}</li>)}</ul><p className="mt-4 text-sm text-ink-100">{RESTORE_UNAVAILABLE}</p></div>
    </section>
    <section aria-labelledby="audit-title" className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4 sm:p-6">
      <ScrollText aria-hidden className="mb-4 h-5 w-5 text-shield-300" /><h2 id="audit-title" className="text-xl font-semibold text-ink-100">Auditability & Security</h2><p className="mt-4 text-sm leading-relaxed text-ink-100">Administrative audit events are not collected through this demonstration interface.</p><p className="mt-3 text-sm leading-relaxed text-ink-300">This describes portal capability, not the presence or absence of activity in external systems. The following are future event types, not historical log entries.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{AUDIT_EVENT_TYPES.map(item => <li key={item} className="min-w-0 rounded-xl border border-ink-700 bg-ink-950/50 p-4 text-sm leading-relaxed text-ink-100">{item}<span className="mt-2 block text-xs text-ink-300">Future audit category</span></li>)}</ul><h3 className="mt-6 text-base font-semibold text-ink-100">Privileged operation requirements</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{AUDIT_REQUIREMENTS}</p>
    </section>
  </>;
}
