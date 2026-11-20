import { reportDefinition, DEMO_DISCLOSURE, type ReportConfig } from "@/components/reports/report-model";
import type { ReportData } from "@/services/report-data";

export function ReportRenderer({ data, config, scopeLabel, generatedAt, printable = false }: { data: ReportData; config: ReportConfig; scopeLabel: string; generatedAt: string; printable?: boolean }) {
  const definition = reportDefinition(data.report)!;
  const sections = data.sections.filter(section => config.sections.includes(section.index) && (!section.examples || config.examples));
  const prefix = printable ? "print" : "preview";
  return <article className="quantum-report min-w-0 space-y-8 rounded-xl bg-white p-4 text-slate-900 sm:p-8" aria-label={`${config.title} report content`}>
    <header className="space-y-4 border-b-2 border-emerald-700 pb-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">Quantum Shield IT · Quantum Shield Command</p>
      <h2 className="break-words text-3xl font-semibold leading-tight">{config.title}</h2>
      <p className="break-words font-medium">Scope: {scopeLabel}</p>
      <p className="text-sm">Local preview prepared: {generatedAt}. This is not a data observation date or coverage period.</p>
      <p className="border-2 border-slate-700 p-3 text-sm font-semibold">{DEMO_DISCLOSURE}</p>
    </header>
    {!printable && <nav aria-label="Report sections" className="flex flex-wrap gap-2">{sections.map(section => <a key={section.index} href={`#${prefix}-section-${section.index}`} className="rounded border border-slate-500 px-3 py-2 text-sm text-slate-900 underline focus-visible:outline-2">{definition.sections[section.index]}</a>)}</nav>}
    {sections.map(section => {
      const rows = config.detail === "summary" ? section.rows.slice(0, 5) : section.rows;
      return <section key={section.index} id={`${prefix}-section-${section.index}`} className="report-section scroll-mt-24 space-y-4">
        <h3 className="text-xl font-semibold leading-tight">{definition.sections[section.index]}</h3>
        <p className="text-sm leading-relaxed">{section.text}</p>
        {section.headers.length > 0 && <div className="report-table-wrap overflow-x-auto"><table className="w-full table-fixed border-collapse text-left text-xs leading-relaxed"><caption className="mb-2 text-left font-medium">{section.examples ? "Illustrative records only" : "Fictional summary"} · {definition.sections[section.index]}</caption><thead><tr>{section.headers.map((header, index) => <th scope="col" key={index} className="border-b-2 border-slate-400 p-2 align-top break-words">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{section.headers.map((_, cell) => <td key={cell} className="border-b border-slate-300 p-2 align-top [overflow-wrap:anywhere]">{row[cell] ?? "—"}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <p role="status" className="py-3">No validated records in this section.</p>}{rows.length < section.rows.length && <p className="mt-2 text-xs">Summary presentation: first {rows.length} of {section.rows.length} rows. Choose Detailed to include every row.</p>}</div>}
        <dl className="space-y-2 border-l-2 border-emerald-700 pl-3 text-xs leading-relaxed"><div><dt className="font-semibold">Source</dt><dd>{section.source}</dd></div><div><dt className="font-semibold">Metric definitions and limitations</dt><dd>{section.definition} Scope: {scopeLabel}. Simulated data only.</dd></div></dl>
      </section>;
    })}
    <footer className="space-y-3 border-t-2 border-slate-400 pt-5 text-xs leading-relaxed"><h3 className="text-base font-semibold">Data sources, confidentiality and limitations</h3><p>{DEMO_DISCLOSURE}</p><p>Prepared locally; not saved. No Laravel reporting, live provider telemetry, historical report storage or authenticated report permissions are connected. Viewing preferences are not tenant authorization. No verified incidents, business loss, trends, protection effectiveness, real course completions or operational deliveries can be inferred.</p><p>Restore operations are not available in Quantum Shield Command. Successful backup executions do not establish tested restoration, recovery points, RTO/RPO or data integrity.</p><p>Quantum Shield IT · Share simulated examples only with appropriate context. Real reports will require authorized recipients and confidentiality controls.</p></footer>
  </article>;
}
