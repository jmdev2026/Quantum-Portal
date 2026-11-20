"use client";

import Link from "next/link";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useCustomerOverview } from "@/components/dashboard/use-customer-overview";
import { useAssetSummary } from "@/components/dashboard/use-asset-summary";
import { useSecuritySeverity } from "@/components/dashboard/use-security-severity";
import { useSecurityCoverage } from "@/components/dashboard/use-security-coverage";
import { useBackupHealth } from "@/components/dashboard/use-backup-health";
import { WorkflowBoundary } from "@/components/customer-workflows/workflow-boundary";
import { WorkflowPage, WorkflowState, action, panel } from "@/components/customer-workflows/workflow-ui";
import { SettingsPreview } from "@/components/customer-workflows/settings-preview";
import { FRESHNESS_BUCKETS, JOB_OUTCOMES } from "@/services/backup-health";
import { SECURITY_CONTROLS } from "@/services/security-coverage";
import { SEVERITY_LEVELS } from "@/services/security-severity";
import type { AssetMetricState } from "@/services/dashboard-assets";

export function CustomerProfile({ profileId }: { profileId: number }) {
  return <WorkflowPage area="customers" title="Customer Profile" description="Customer-scoped organization, technology, reporting and local configuration previews. The selected scope must match this profile; an address is not tenant authorization."><WorkflowBoundary profileId={profileId}><ProfileContent /></WorkflowBoundary></WorkflowPage>;
}
function ProfileContent() {
  const { selectedCustomer } = useCustomerView();
  const overview = useCustomerOverview();
  const assets = useAssetSummary();
  const severity = useSecuritySeverity();
  const coverage = useSecurityCoverage();
  const backup = useBackupHealth();
  const customer = selectedCustomer!;
  const portfolio = overview.state.kind === "ready" || overview.state.kind === "stale" ? overview.state.customers.find(record => record.id === customer.id && record.name === customer.name) : null;
  if (!portfolio) return <WorkflowState kind={overview.state.kind === "ready" || overview.state.kind === "stale" ? "empty" : overview.state.kind} message={overview.state.kind === "error" ? overview.state.message : undefined} retry={overview.retry} />;
  const technology = assets.state;
  const issues = severity.state;
  const controls = coverage.state;
  const protection = backup.state;
  const readyBackup = protection.kind === "ready" || protection.kind === "stale";
  const readySecurity = issues.kind === "ready" || issues.kind === "stale";
  const readyControls = controls.kind === "ready" || controls.kind === "stale";
  return <>
    <section className={panel}><p className="font-mono text-xs uppercase tracking-widest text-shield-300">Organization Overview · Fictional Demo</p><h2 className="mt-3 break-words text-2xl font-semibold text-ink-100">{customer.name}</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">{[["Canonical customer ID", customer.id], ["Registry status", customer.status], ["Selected scope", `${customer.name} only`]].map(([label, value]) => <div key={label}><dt className="text-ink-300">{label}</dt><dd className="mt-2 text-ink-100">{value}</dd></div>)}</dl><p className="mt-4 text-sm leading-relaxed text-ink-300">Fictional registry record, not an operational tenant. No primary contact, postal address, agreement or provider connection is verified. Reporting availability is not protection or health.</p>{overview.state.kind === "stale" && <p className="mt-3 text-sm text-amber-signal">Stale customer reporting — not current evidence.</p>}</section>
    <section className={panel}><h2 className="text-lg font-semibold text-ink-100">Technology</h2><p className="mt-2 text-sm leading-relaxed text-ink-300">Canonical illustrative asset summaries, not discovered inventory. The actual environment, operating systems, licensing and topology are unavailable.</p>{technology.status === "ready" ? <div className="mt-4 grid gap-4 sm:grid-cols-3">{([['mailboxes', 'Mailboxes'], ['cloud_drives', 'Cloud drives'], ['internet_assets', 'Internet assets']] as const).map(([key, label]) => <Metric key={key} label={label} state={technology.metrics[key]} retry={assets.retry} />)}</div> : <WorkflowState kind={technology.status} message={technology.status === "error" ? technology.message : undefined} retry={assets.retry} />}</section>
    <section className={panel}><h2 className="text-lg font-semibold text-ink-100">Security</h2><p className="mt-2 text-sm text-ink-300">Reporting availability: {portfolio.securityReporting === "available" ? "Demo data present" : portfolio.securityReporting}. No live monitoring or compromise claim.</p>{readySecurity ? <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{SEVERITY_LEVELS.map(level => <div key={level} className="rounded-lg border border-ink-700 p-3"><dt className="text-sm capitalize text-ink-300">{level} illustrative issues</dt><dd className="mt-2 font-mono text-2xl text-ink-100">{issues.counts[level]}</dd></div>)}</dl> : <WorkflowState kind={issues.kind} message={issues.kind === "error" ? issues.message : undefined} retry={severity.retry} />}{issues.kind === "stale" && <p className="mt-3 text-amber-signal">Stale issue summary.</p>}{readyControls ? <div className="mt-4"><p className="text-sm text-ink-300">{controls.coverage ? `Illustrative coverage: ${controls.coverage.percentage}% · ${controls.coverage.basis}` : "Coverage percentage is not supplied."}</p><ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{SECURITY_CONTROLS.map(item => <li key={item.key} className="rounded-lg border border-ink-700 p-3 text-ink-300">{item.label}: <span className="text-ink-100">{controls.controls?.[item.key]?.replaceAll("_", " ") ?? "Unavailable"}</span></li>)}</ul>{controls.kind === "stale" && <p className="mt-3 text-amber-signal">Stale control summary.</p>}</div> : <WorkflowState kind={controls.kind} message={controls.kind === "error" ? controls.message : undefined} retry={coverage.retry} />}<ModuleLinks links={[["/security", "Security Overview"], ["/security/mdr", "MDR"], ["/security/itdr", "ITDR"], ["/security/endpoint-security", "Endpoint Security"], ["/security/dark-web", "Dark Web"]]} label="Customer security pages" /></section>
    <section className={panel}><h2 className="text-lg font-semibold text-ink-100">Backup</h2><p className="mt-2 text-sm text-ink-300">Reporting availability: {portfolio.backupReporting === "available" ? "Demo data present" : portfolio.backupReporting}.</p>{readyBackup ? <div className="mt-4 grid gap-4"><p className="text-ink-100">Illustrative protected assets: {protection.protectedAssets ?? "Unavailable"}</p><div className="grid gap-4 sm:grid-cols-2"><div><h3 className="text-sm font-semibold text-ink-100">Freshness summary</h3><ul className="mt-2 space-y-2 text-sm text-ink-300">{FRESHNESS_BUCKETS.map(bucket => <li key={bucket.key}>{bucket.label}: {protection.freshness?.[bucket.key] ?? "Unavailable"}</li>)}</ul></div><div><h3 className="text-sm font-semibold text-ink-100">Illustrative job executions · Last 24 Hours</h3><ul className="mt-2 space-y-2 text-sm text-ink-300">{JOB_OUTCOMES.map(outcome => <li key={outcome.key}>{outcome.label}: {protection.jobOutcomes?.counts[outcome.key] ?? "Unavailable"}</li>)}</ul></div></div>{protection.kind === "stale" && <p className="text-amber-signal">Stale backup summary.</p>}</div> : <WorkflowState kind={protection.kind} message={protection.kind === "error" ? protection.message : undefined} retry={backup.retry} />}<p className="mt-4 text-sm text-amber-signal">Restore operations are not available in Quantum Shield Command. Samples do not demonstrate recovery readiness.</p><ModuleLinks label="Customer backup pages" links={[["/backup", "Backup Overview"], ["/backup/assets", "Backup Assets"], ["/backup/jobs", "Backup Jobs"], ["/backup/recovery", "Recovery Information"]]} /></section>
    <section className={panel}><h2 className="text-lg font-semibold text-ink-100">Users & Devices</h2>{technology.status === "ready" ? <div className="mt-4 grid gap-4 sm:grid-cols-2"><Metric label="Illustrative users" state={technology.metrics.users} retry={assets.retry} /><Metric label="Illustrative devices" state={technology.metrics.devices} retry={assets.retry} /></div> : <WorkflowState kind={technology.status} message={technology.status === "error" ? technology.message : undefined} retry={assets.retry} />}<p className="mt-4 text-sm leading-relaxed text-ink-300">Observation explorers contain only two identities and two endpoints per customer, not the summary inventory. No identity-to-training or endpoint-to-backup relationship is validated.</p><ModuleLinks label="Customer observation pages" links={[["/users-devices", "Users & Devices Overview"], ["/users-devices/users", "User observations"], ["/users-devices/devices", "Device observations"]]} /></section>
    <SettingsPreview customerName={customer.name} />
    <section className={panel}><h2 className="text-lg font-semibold text-ink-100">Reports</h2><p className="mt-2 text-sm leading-relaxed text-ink-300">Open the existing Reports workspace with this customer preference retained. Select a supported report there. No profile-specific export, delivery or report creation occurs here.</p><ModuleLinks label="Customer reports" links={[["/reports", "Open Reports"]]} /></section>
    <section className={panel}><h2 className="text-lg font-semibold text-ink-100">Integration limitations</h2><p className="mt-2 text-sm leading-relaxed text-ink-300">Laravel authentication and tenant authorization, Guardz reporting, and Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup remain unimplemented. All displayed metrics are simulated. Provider fields, source freshness, full inventories, contacts, agreements and operational configuration require independent backend verification. Frontend customer preference is not authorization.</p></section>
  </>;
}
function Metric({ label, state, retry }: { label: string; state: AssetMetricState; retry: () => void }) {
  return <div className="rounded-lg border border-ink-700 p-4"><h3 className="text-sm text-ink-300">{label}</h3>{state.kind === "ready" || state.kind === "stale" ? <><p className="mt-3 font-mono text-3xl text-ink-100">{state.value.toLocaleString("en-US")}</p><p className="mt-2 text-xs text-amber-signal">{state.kind === "stale" ? "Stale simulated summary" : "Simulated summary"}</p></> : <WorkflowState kind={state.kind} message={state.kind === "error" ? state.message : undefined} retry={retry} />}</div>;
}
function ModuleLinks({ links, label }: { links: string[][]; label: string }) {
  return <nav aria-label={label} className="mt-4 flex flex-wrap gap-2">{links.map(([href, text]) => <Link key={href} href={href} className={action}>{text}</Link>)}</nav>;
}
