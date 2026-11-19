"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CapabilityId } from "@/services/security-capability-types";
import { capabilityDefinition } from "@/components/security/security-capability-directory";
import { useCapabilityRecords } from "@/components/security/use-capability-records";
import { CapabilityRecordExplorer, capabilityAction } from "@/components/security/capability-record-explorer";

export function SecurityCapabilityWorkspace({ capabilityId }: { capabilityId: CapabilityId }) {
  const capability = capabilityDefinition(capabilityId);
  const { state, scope, demo, contextKey, retry } = useCapabilityRecords(capabilityId);
  const Icon = capability.icon;
  return <div className="space-y-8">
    <nav aria-label="Capability navigation" className="flex flex-wrap gap-3"><Link href="/security" className={capabilityAction}><ArrowLeft aria-hidden className="mr-2 h-4 w-4" />Back to Security</Link>{capabilityId === "mdr" && <Link href="/security/detections" className={capabilityAction}>Open full Detection Explorer</Link>}<Link href="/reports" className={capabilityAction}>Open existing Reports</Link></nav>
    <header className="rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-900 to-ink-950 p-6 sm:p-8"><div className="flex items-center gap-3 text-shield-300"><Icon aria-hidden className="h-7 w-7" /><p className="font-mono text-xs uppercase tracking-widest">Security capability · read only</p></div><h1 className="mt-6 break-words text-3xl font-semibold leading-tight text-ink-100 sm:text-4xl">{capability.title}</h1><p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-300">{capability.description}</p><p className="mt-4 break-words text-sm text-ink-100">Scope: {scope}</p><p className="mt-4 text-xs font-medium text-amber-signal">{demo ? "Simulated demonstration information · protection not verified" : "Reporting not connected · protection unavailable"}</p></header>
    <div className={`grid gap-4 ${capability.overview.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>{capability.overview.map(section => <section key={section.title} className="rounded-xl border border-ink-700 bg-ink-900 p-6"><h2 className="text-base font-semibold text-ink-100">{section.title}</h2><p className="mt-3 text-sm leading-relaxed text-ink-300">{section.body}</p></section>)}</div>
    <p className="border-l-2 border-shield-400 pl-4 text-sm leading-relaxed text-ink-300">{demo ? `Fictional demonstration only. ${capability.distinction}` : "The integration is unavailable. No fictional records or monitoring totals are displayed; unavailable does not mean zero risks or complete protection."}</p>
    <CapabilityRecordExplorer key={contextKey} capability={capability} state={state} scope={scope} retry={retry} />
    <section className="rounded-2xl border border-amber-signal/25 bg-ink-900 p-6"><h2 className="text-lg font-semibold text-ink-100">{capability.limitationTitle}</h2><p className="mt-4 text-sm leading-relaxed text-ink-300">{capability.limitation}</p><p className="mt-4 text-xs leading-relaxed text-ink-350">Frontend scope filtering is not backend tenant authorization. Existing Reports contains general reporting only, not a dedicated capability report. Fixture creation dates are synthetic authoring metadata, not scan, integration or incident timestamps.</p></section>
  </div>;
}
