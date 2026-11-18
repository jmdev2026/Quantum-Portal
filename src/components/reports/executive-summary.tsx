"use client";

import { useAssetSummary } from "@/components/dashboard/use-asset-summary";
import { useBackupHealth } from "@/components/dashboard/use-backup-health";
import { useSecuritySeverity } from "@/components/dashboard/use-security-severity";
import { useSecurityCoverage } from "@/components/dashboard/use-security-coverage";
import { useInsights } from "@/components/dashboard/use-insights";
import { securityOverviewMetrics } from "@/components/security/security-overview-metrics";

export function ExecutiveSummary() {
  const assets = useAssetSummary();
  const backup = useBackupHealth();
  const severity = useSecuritySeverity();
  const coverage = useSecurityCoverage();
  const insights = useInsights();
  const security = securityOverviewMetrics({ severity: severity.state, coverage: coverage.state, insights: insights.state });
  const data = backup.state.kind === "ready" || backup.state.kind === "stale" ? backup.state : null;
  return <div className="space-y-8">
    <section aria-labelledby="visibility-title"><h3 id="visibility-title" className="mb-4 text-lg font-semibold text-ink-100">User & Device Visibility</h3>
      <div className="grid gap-4 sm:grid-cols-2">{(["users", "devices"] as const).map(key => {
        const metric = assets.state.status === "ready" ? assets.state.metrics[key] : null;
        const value = metric?.kind === "ready" || metric?.kind === "stale" ? String(metric.value) : assets.state.status === "loading" ? "Loading" : metric?.kind === "empty" ? "No data yet" : "Unavailable";
        return <ReportMetric key={key} label={key === "users" ? "Users" : "Devices"} value={value} note="Asset Summary · visibility count, not verified protection" error={assets.state.status === "error" ? assets.state.message : metric?.kind === "error" ? metric.message : undefined} retry={assets.retry} />;
      })}</div>
    </section>
    <section aria-labelledby="security-summary-title"><h3 id="security-summary-title" className="mb-4 text-lg font-semibold text-ink-100">Cybersecurity Summary</h3><div className="grid gap-4 sm:grid-cols-2">{security.map(metric => <ReportMetric key={metric.id} label={metric.label} value={metric.value.kind === "value" ? metric.value.value : metric.value.kind === "loading" ? "Loading" : metric.value.kind === "unavailable" ? metric.value.reason : "Unavailable"} note={metric.hint} error={metric.value.kind === "error" ? metric.value.message : undefined} retry={metric.id === "security-coverage" ? coverage.retry : metric.id === "security-insights" ? insights.retry : severity.retry} />)}</div></section>
    <section aria-labelledby="backup-summary-title"><h3 id="backup-summary-title" className="mb-4 text-lg font-semibold text-ink-100">Backup Summary</h3><div className="grid gap-4 sm:grid-cols-2">
      <ReportMetric label="Protected Backup Assets" value={data?.protectedAssets != null ? String(data.protectedAssets) : backup.state.kind === "loading" ? "Loading" : backup.state.kind === "empty" ? "No data yet" : "Unavailable"} note="Backup Health · asset count does not prove recoverability" error={backup.state.kind === "error" ? backup.state.message : undefined} retry={backup.retry} />
      <ReportMetric label="Successful Backup Job Executions" value={data?.jobOutcomes?.basis === "job_executions" && data.jobOutcomes.counts.successful != null ? String(data.jobOutcomes.counts.successful) : backup.state.kind === "loading" ? "Loading" : "Unavailable"} note="Backup Health · illustrative last 24 hours, not restore readiness" />
    </div></section>
  </div>;
}

function ReportMetric({ label, value, note, error, retry }: { label: string; value: string; note: string; error?: string; retry?: () => void }) {
  return <div className="min-w-0 rounded-xl border border-ink-700 bg-ink-950/50 p-5"><p className="text-sm text-ink-300">{label}</p><p className="my-3 break-words text-3xl font-semibold leading-tight text-shield-300">{value}</p><p className="text-xs leading-relaxed text-ink-300">{note}</p>{error && <div className="mt-3 text-sm text-red-300"><p>{error}</p>{retry && <button onClick={retry} className="mt-2 rounded border border-ink-600 px-3 py-2 text-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400">Retry</button>}</div>}</div>;
}
