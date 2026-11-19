"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { CapabilityRecord } from "@/services/security-capability-types";
import type { CapabilityDefinition } from "@/components/security/security-capability-directory";
import { categoryLabel } from "@/components/security/capability-explorer-view";

export function CapabilityRecordDetail({ record, capability, onClose }: { record: CapabilityRecord; capability: CapabilityDefinition; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  return <dialog ref={ref} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="capability-detail-title" aria-describedby="capability-detail-disclosure" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 p-4 text-ink-100 shadow-2xl backdrop:bg-black/75 sm:p-8">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wider text-amber-signal">Fictional read-only detail</p><h2 id="capability-detail-title" className="mt-3 break-words text-xl font-semibold leading-tight">{record.name}</h2></div><button type="button" autoFocus onClick={onClose} aria-label="Close observation details" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400"><X aria-hidden className="h-5 w-5" /></button></div>
    <p id="capability-detail-disclosure" className="mt-4 text-sm leading-relaxed text-ink-300">{capability.distinction}</p>
    <dl className="mt-6 grid gap-4 rounded-xl border border-ink-700 bg-ink-950 p-4 text-sm sm:grid-cols-2">
      <div><dt className="text-ink-350">Customer</dt><dd className="mt-2 break-words">{record.customerName}</dd></div>
      {record.assetLabel && <div><dt className="text-ink-350">{capability.id === "external-footprint" ? "Reserved example asset" : capability.id === "email-protection" ? "Fictional message label" : "Fictional cloud workspace"}</dt><dd className="mt-2 break-words">{record.assetLabel}</dd></div>}
      {record.category && <div><dt className="text-ink-350">{capability.categoryLabel}</dt><dd className="mt-2 capitalize">{categoryLabel(record.category)}</dd></div>}
      {record.severity && <div><dt className="text-ink-350">{capability.id === "external-footprint" ? "Illustrative severity" : "Example severity"}</dt><dd className="mt-2 capitalize">{record.severity}</dd></div>}
      {record.status && <div><dt className="text-ink-350">Illustrative status · not a provider outcome</dt><dd className="mt-2 capitalize">{categoryLabel(record.status)}</dd></div>}
      {record.protectionVisibility && <div className="sm:col-span-2"><dt className="text-ink-350">Protection not verified</dt><dd className="mt-2 leading-relaxed">{record.protectionVisibility}</dd></div>}
      <div className="sm:col-span-2"><dt className="text-ink-350">Simulated source</dt><dd className="mt-2">{record.source}</dd></div>
    </dl>
    <section className="mt-6"><h3 className="font-semibold">{capability.id === "mdr" ? "Investigation observation" : capability.id === "external-footprint" ? "Asset / finding observation" : capability.id === "email-protection" ? "Message classification observation" : "Security observation"}</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{record.observation}</p></section>
    <section className="mt-6 rounded-xl border border-amber-signal/30 p-4"><h3 className="text-sm font-semibold text-amber-signal">{capability.limitationTitle}</h3><p className="mt-2 text-sm leading-relaxed text-ink-300">{capability.limitation}</p></section>
    <Link href="/reports" onClick={onClose} className="mt-6 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-shield-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400">Open existing Reports · no dedicated capability report</Link>
  </dialog>;
}
