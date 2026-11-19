import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SECURITY_CAPABILITIES, PLANNED_SECURITY_CAPABILITIES } from "@/components/security/security-capability-directory";

export function SecurityCapabilityHub() {
  return <section aria-labelledby="security-capabilities-title" className="space-y-6">
    <div><p className="font-mono text-xs uppercase tracking-widest text-shield-300">Security service directory</p><h2 id="security-capabilities-title" className="mt-3 text-2xl font-semibold text-ink-100">Dedicated capability workspaces</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-300">Read-only explorers and capability guidance. Available frontend experiences do not establish active monitoring. The nine control statuses below remain separate simulated reporting signals.</p></div>
    <nav aria-label="Security capabilities" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{SECURITY_CAPABILITIES.map(capability => {
      const Icon = capability.icon;
      return <Link key={capability.id} href={`/security/${capability.id}`} className="group rounded-2xl border border-ink-700 bg-ink-900 p-6 outline-none transition-colors hover:border-shield-400/60 focus-visible:ring-2 focus-visible:ring-shield-400 motion-reduce:transition-none"><div className="flex items-center justify-between gap-4 text-shield-300"><Icon aria-hidden className="h-6 w-6" /><ArrowUpRight aria-hidden className="h-5 w-5" /></div><h3 className="mt-4 text-base font-semibold text-ink-100">{capability.title}</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{capability.description}</p><span className="mt-4 block text-xs font-medium text-shield-300">Open read-only workspace</span></Link>;
    })}</nav>
    <div className="grid gap-4 lg:grid-cols-3">{PLANNED_SECURITY_CAPABILITIES.map(capability => <article key={capability.title} className="rounded-xl border border-dashed border-ink-600 p-4"><p className="font-mono text-xs text-amber-signal">Planned · {capability.milestone}</p><h3 className="mt-3 font-medium text-ink-100">{capability.title}</h3><p className="mt-2 text-sm leading-relaxed text-ink-300">{capability.description}</p></article>)}</div>
  </section>;
}
