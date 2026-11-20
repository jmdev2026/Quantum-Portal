"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { BACKUP_OUTCOME_EXPLANATIONS, backupExampleLabel, backupOutcomeLabel, isBackupJob, type BackupExample } from "@/components/backup/backup-explorer-view";
import { backupAction } from "@/components/backup/backup-navigation";
import { RESTORE_UNAVAILABLE } from "@/components/backup/recovery-information-view";

export function BackupExampleDetail({ record, trigger, onClose }: { record: BackupExample; trigger: HTMLElement | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    title.current?.focus();
    return () => {
      element?.close();
      if (trigger?.isConnected) trigger.focus();
      else (document.getElementById("backup-page-heading") ?? document.getElementById("backup-heading"))?.focus();
    };
  }, [trigger]);
  const job = isBackupJob(record);
  return <dialog ref={dialog} aria-labelledby="backup-detail-title" aria-describedby="backup-detail-notice" onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 p-4 text-ink-100 shadow-2xl backdrop:bg-black/75 sm:p-6">
    <div className="flex items-start justify-between gap-4"><h2 ref={title} tabIndex={-1} id="backup-detail-title" className="min-w-0 break-words text-2xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-shield-400">{backupExampleLabel(record)}</h2><button type="button" aria-label="Close example details" onClick={onClose} className={backupAction}><X aria-hidden className="h-5 w-5" /></button></div>
    <p id="backup-detail-notice" className="mt-4 text-sm leading-relaxed text-amber-signal">Fictional example only · {record.source}. This is not verified backup or recovery evidence.</p>
    <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-ink-300">Fictional customer</dt><dd className="mt-2 break-words text-ink-100">{record.customerName}</dd></div><div><dt className="text-ink-300">{job ? "Illustrative outcome" : "Protection visibility"}</dt><dd className="mt-2 text-ink-100">{job ? backupOutcomeLabel(record.outcome) : record.protectionState}</dd></div><div className="sm:col-span-2"><dt className="text-ink-300">{job ? "Example description" : "Visibility observation"}</dt><dd className="mt-2 break-words leading-relaxed text-ink-100">{job ? record.description : record.visibilityNote}</dd></div></dl>
    <section className="mt-6 space-y-4 rounded-xl border border-ink-700 bg-ink-950 p-4"><h3 className="font-semibold">Interpretation & unavailable information</h3><p className="text-sm leading-relaxed text-ink-300">{job ? BACKUP_OUTCOME_EXPLANATIONS[record.outcome] : "Protection visibility does not establish recoverability. Workload category, record-level freshness, policies and actual last-backup timestamps are not supplied by these examples."}</p><p className="text-sm leading-relaxed text-ink-300">{job ? "Execution timestamps, duration, size, retries and storage destination are unavailable. These are examples, not historical job executions." : "Backup size, retention, storage destination, encryption status and integrity verification are unavailable."} No validated asset-to-job relationship exists; similar labels do not imply an association.</p><p className="text-sm leading-relaxed text-amber-signal">{RESTORE_UNAVAILABLE} No verified recovery points, restore-test results or recovery-time guarantees are supplied.</p></section>
    <nav aria-label="Related Backup information" className="mt-6 flex flex-wrap gap-2"><Link href="/backup" onClick={onClose} className={backupAction}>Backup Overview</Link><Link href="/backup/recovery" onClick={onClose} className={backupAction}>Recovery Information</Link><Link href="/reports" onClick={onClose} className={backupAction}>Existing Reports</Link></nav>
  </dialog>;
}
