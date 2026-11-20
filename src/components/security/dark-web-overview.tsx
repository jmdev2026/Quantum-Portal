import { Radar, UsersRound, Globe2, Tags, ClipboardList, ShieldQuestion } from "lucide-react";
import type { DarkWebData } from "@/services/dark-web-types";
import { darkWebSummary, darkWebLabel } from "@/components/security/dark-web-view";

export function DarkWebOverview({ data }: { data: DarkWebData }) {
  const summary = darkWebSummary(data);
  const cards = [
    { title: "Exposure findings", value: `${summary.findings} illustrative findings`, href: "#dark-web-findings-title", icon: Radar },
    { title: "Affected accounts", value: `${summary.accounts} fictional account references`, href: "#dark-web-accounts-title", icon: UsersRound },
    { title: "Domain monitoring preview", value: `${summary.domains} reserved example domains`, href: "#dark-web-domains-title", icon: Globe2 },
    { title: "Exposure categories", value: `${summary.categories} categories in scoped examples`, href: "#dark-web-findings-title", icon: Tags },
    { title: "Investigation / review status", value: `${summary.reviewExamples} simulated review examples`, href: "#dark-web-findings-title", icon: ClipboardList },
    { title: "Response recommendations", value: "Informational guidance · no actions performed", href: "#dark-web-guidance-title", icon: ShieldQuestion },
  ];
  return <section aria-labelledby="dark-web-overview-title" className="space-y-4"><h2 id="dark-web-overview-title" className="text-xl font-semibold text-ink-100">Exposure overview · fictional examples only</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => <a key={card.title} href={card.href} className="rounded-2xl border border-ink-700 bg-ink-900 p-6 outline-none transition-colors hover:border-shield-400/50 focus-visible:ring-2 focus-visible:ring-shield-400 motion-reduce:transition-none"><card.icon aria-hidden className="h-5 w-5 text-shield-300" /><h3 className="mt-4 text-sm font-medium text-ink-300">{card.title}</h3><p className="mt-3 text-lg font-semibold leading-tight text-ink-100">{card.value}</p><p className="mt-4 text-xs text-shield-300">Explore this section</p></a>)}</div><p className="text-xs leading-relaxed text-ink-350">All counts derive from this validated scoped dataset. These are not confirmed breaches, provider observations or Dashboard aggregate issue counts.</p>
    <div className="grid gap-4 lg:grid-cols-3">{[
      { title: "Illustrative severity breakdown", rows: summary.severities.map(row => ({ label: row.severity, count: row.count })) },
      { title: "Exposure category examples", rows: summary.categoryCounts.map(row => ({ label: darkWebLabel(row.category), count: row.count })) },
      { title: "Simulated review state", rows: summary.reviewStatuses.map(row => ({ label: darkWebLabel(row.status), count: row.count })) },
    ].map(group => <section key={group.title} className="rounded-xl border border-ink-700 p-4"><h3 className="text-sm font-semibold text-ink-100">{group.title}</h3><dl className="mt-4 space-y-3 text-sm">{group.rows.map(row => <div key={row.label} className="flex justify-between gap-4"><dt className="capitalize text-ink-300">{row.label}</dt><dd className="text-ink-100">{row.count} examples</dd></div>)}</dl></section>)}</div>
  </section>;
}
