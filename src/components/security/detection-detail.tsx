"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { Detection } from "@/services/security-detections";

export function DetectionDetail({ record, onClose }: { record: Detection; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return <dialog ref={ref} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="detection-detail-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 p-5 text-ink-100 shadow-2xl backdrop:bg-black/75 sm:p-8">
    <div className="flex items-start justify-between gap-4"><div><p className="mb-3 font-mono text-xs uppercase tracking-wider text-amber-signal">Fictional investigation preview</p><h2 id="detection-detail-title" className="break-words text-xl font-semibold leading-tight">{record.title}</h2></div><button type="button" autoFocus aria-label="Close detection details" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400"><X aria-hidden className="h-5 w-5" /></button></div>
    <dl className="mt-6 grid gap-4 rounded-xl border border-ink-700 bg-ink-950/60 p-4 text-sm sm:grid-cols-2"><div><dt className="text-ink-350">Customer</dt><dd className="mt-2 break-words">{record.customerName}</dd></div><div><dt className="text-ink-350">Severity</dt><dd className="mt-2 capitalize">{record.severity}</dd></div><div className="sm:col-span-2"><dt className="text-ink-350">Source</dt><dd className="mt-2">{record.source}</dd></div></dl>
    <section className="mt-6"><h3 className="font-semibold">Illustrative observation</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{record.summary}</p></section>
    <section className="mt-6 rounded-xl border border-amber-signal/25 p-4"><h3 className="text-sm font-semibold text-amber-signal">Investigation limitations</h3><p className="mt-2 text-sm leading-relaxed text-ink-300">This is an existing fictional example, not a provider case or verified incident. Status, category, timelines and evidence are not supplied by this dataset. No remediation actions are available.</p></section>
    <Link href="/reports" onClick={onClose} className="mt-6 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-shield-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400">View related reporting</Link>
  </dialog>;
}
