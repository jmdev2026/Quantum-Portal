"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useBackupHealth } from "@/components/dashboard/use-backup-health";
import { backupAction } from "@/components/backup/backup-navigation";
import { BACKUP_OUTCOME_EXPLANATIONS } from "@/components/backup/backup-explorer-view";
import { FRESHNESS_BUCKETS, JOB_OUTCOMES, type BackupHealthState, type FreshnessBucket } from "@/services/backup-health";

export const FRESHNESS_EXPLANATIONS: Record<FreshnessBucket, string> = {
  less_than_1_hour: "The configured demonstration category for a reported successful-backup age under one hour. No exact record-level backup timestamp is supplied.",
  "1_to_3_hours": "The configured demonstration category for a reported successful-backup age of one to three hours. This is not a verified production reporting window.",
  "4_to_24_hours": "The configured demonstration category for a reported successful-backup age of four to twenty-four hours. Actual provider bucket boundaries require verification.",
  more_than_24_hours: "The configured demonstration category for a reported successful-backup age over twenty-four hours. It is not proof that a production backup is overdue.",
  no_successful_backup: "The configured demonstration category with no successful backup reported. Missing reporting is not proof that data is absent or recoverable.",
};

export function BackupSummaryDrilldowns() {
  const { state, contextKey, retry } = useBackupHealth();
  if (state.kind === "ready" || state.kind === "stale") return <SummaryContent key={contextKey} data={state} />;
  return <section aria-labelledby="backup-drilldowns-title" className="space-y-4 rounded-2xl border border-ink-700 bg-ink-900 p-4 sm:p-6"><h2 id="backup-drilldowns-title" className="text-xl font-semibold text-ink-100">Understand Backup Reporting</h2><p role={state.kind === "error" ? "alert" : "status"} className="text-sm leading-relaxed text-ink-300">{state.kind === "loading" ? "Loading summary explanations…" : state.kind === "error" ? state.message : state.kind === "empty" ? "No summary data is available. This does not establish zero backups or failures." : "Live Backup reporting is not connected. Summary drilldowns are unavailable, not zero-valued."}</p>{state.kind === "error" && <button type="button" onClick={retry} className={backupAction}>Retry summary</button>}</section>;
}

function SummaryContent({ data }: { data: Extract<BackupHealthState, { kind: "ready" | "stale" }> }) {
  const [bucket, setBucket] = useState<FreshnessBucket | null>(null);
  const explanation = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (bucket) explanation.current?.focus(); }, [bucket]);
  return <section aria-labelledby="backup-drilldowns-title" className="space-y-8 rounded-2xl border border-ink-700 bg-ink-900 p-4 sm:p-6">
    <header className="space-y-4"><h2 id="backup-drilldowns-title" className="text-xl font-semibold text-ink-100">Understand Backup Reporting</h2><p className="text-sm leading-relaxed text-amber-signal">Simulated demo data · {data.protectedAssets ?? "Not reported"} protected assets in the validated summary, not the displayed sample count. Job executions are a separate measure. These figures do not establish verified recoverability.</p><div className="flex flex-wrap gap-2"><Link href="/backup/assets" className={backupAction}>View Assets</Link><Link href="#backup-freshness-title" className={backupAction}>Explore freshness</Link><Link href="#backup-outcomes-title" className={backupAction}>Explore job outcomes</Link><Link href="/backup/recovery" className={backupAction}>Recovery Information</Link><Link href="/reports" className={backupAction}>Existing Reports</Link></div></header>
    <section aria-labelledby="backup-freshness-title" className="space-y-4"><h3 id="backup-freshness-title" className="text-lg font-semibold text-ink-100">Backup Freshness Summary Drilldown</h3><p className="text-sm leading-relaxed text-ink-300">Inspect a summary category. Asset examples contain no freshness field, so these counts cannot be mapped to or used to filter the sample rows.</p><ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{FRESHNESS_BUCKETS.map(item => <li key={item.key}><button type="button" aria-expanded={bucket === item.key} aria-controls={bucket ? "backup-freshness-explanation" : undefined} onClick={() => setBucket(item.key)} className={`${backupAction} w-full justify-between gap-4 text-left`}><span>{item.label}</span><span className="shrink-0 tabular-nums">{data.freshness?.[item.key] ?? "Not reported"}</span></button></li>)}</ul>
      {bucket && <div id="backup-freshness-explanation" className="space-y-4 rounded-xl border border-ink-700 bg-ink-950 p-4"><h4 ref={explanation} tabIndex={-1} className="font-semibold text-ink-100 outline-none focus-visible:ring-2 focus-visible:ring-shield-400">{FRESHNESS_BUCKETS.find(item => item.key === bucket)!.label} · {data.freshness?.[bucket] ?? "Not reported"} illustrative summary assets</h4><p className="text-sm leading-relaxed text-ink-300">{FRESHNESS_EXPLANATIONS[bucket]} Freshness does not verify integrity, restore testing or recovery-point availability.</p><Link href="/backup/assets" className={backupAction}>Inspect independent asset examples</Link></div>}
    </section>
    <section aria-labelledby="backup-outcomes-title" className="space-y-4"><h3 id="backup-outcomes-title" className="text-lg font-semibold text-ink-100">Backup Job Execution Outcomes</h3><p className="text-sm leading-relaxed text-ink-300">Last 24 Hours · Illustrative period only, not a live rolling feed. Counts represent job executions, not unique assets or the example job list. A successful execution is not a verified successful restore.</p><ul className="grid gap-4 md:grid-cols-2">{JOB_OUTCOMES.map(item => <li key={item.key} className="space-y-4 rounded-xl border border-ink-700 bg-ink-950 p-4"><h4 className="flex items-start justify-between gap-4 font-semibold text-ink-100"><span>{item.label}</span><span className="tabular-nums">{data.jobOutcomes?.counts[item.key] ?? "Not reported"}</span></h4><p className="text-sm leading-relaxed text-ink-300">{BACKUP_OUTCOME_EXPLANATIONS[item.key]}</p><Link href={`/backup/jobs?outcome=${item.key}`} className={backupAction}>Inspect {item.label.toLowerCase()} examples</Link></li>)}</ul></section>
  </section>;
}
