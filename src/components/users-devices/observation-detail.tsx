"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { action } from "@/components/customer-workflows/workflow-ui";
import type { VisibilityRecord, VisibilityRecordKind } from "@/services/security-visibility-records";

export function ObservationDetail({ record, kind, trigger, close }: { record: VisibilityRecord; kind: VisibilityRecordKind; trigger: HTMLElement | null; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    title.current?.focus();
    return () => { element?.close(); if (trigger?.isConnected) trigger.focus(); else document.getElementById("workflow-heading")?.focus(); };
  }, [trigger]);
  const user = kind === "identities";
  const links = user ? [["/security/itdr", "ITDR"], ["/security/dark-web", "Dark Web"], ["/security", "Security Overview"], ["/security/awareness-training", "Awareness Training"], ["/security/phishing-simulations", "Phishing Simulations"]] : [["/security/endpoint-security", "Endpoint Security"], ["/security/mdr", "MDR"], ["/security/detections", "Detections"], ["/backup/assets", "Backup Assets"], ["/backup/jobs", "Backup Jobs"]];
  return <dialog ref={dialog} aria-labelledby="observation-detail-title" aria-describedby="observation-detail-notice" onCancel={event => { event.preventDefault(); close(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-ink-600 bg-ink-900 p-4 text-ink-100 shadow-2xl backdrop:bg-black/75 sm:p-6"><header className="flex items-start justify-between gap-4"><h2 ref={title} id="observation-detail-title" tabIndex={-1} className="min-w-0 break-words text-2xl font-semibold outline-none">{record.name}</h2><button aria-label="Close observation details" className={action} onClick={close}><X className="h-5 w-5" aria-hidden /></button></header><p id="observation-detail-notice" className="mt-4 text-sm leading-relaxed text-amber-signal">Fictional observation only. Not a complete inventory, verified account or managed device.</p><dl className="mt-6 grid gap-4 text-sm">{[["Customer", record.customerName], ["Observation", record.observation], ["Protection visibility", record.protectionVisibility], ["Source", record.source]].map(([label, value]) => <div key={label}><dt className="text-ink-300">{label}</dt><dd className="mt-2 break-words leading-relaxed text-ink-100">{value}</dd></div>)}</dl><section className="mt-6 rounded-lg border border-ink-700 bg-ink-950 p-4"><h3 className="font-semibold">Unavailable information & future management</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{user ? "Email, MFA, licenses, sign-in history, groups, passwords and compromise status are not supplied. These labels cannot be matched to education participants or exposure accounts." : "Operating system, IP, MAC, serial number, agent status, last seen, owner, patches and health are not supplied. No validated reference links this endpoint to a backup asset or job."}</p><p className="mt-3 text-sm leading-relaxed text-ink-300">Future management requires independently verified tenant ownership, authenticated authorization, supported provider actions and audited server-confirmed results. No account, permission, license, agent or backup change is available.</p></section><nav aria-label="Module overview navigation, not record associations" className="mt-6 flex flex-wrap gap-2">{links.map(([href, label]) => <Link key={href} href={href} onClick={close} className={action}>{label}</Link>)}</nav><p className="mt-3 text-xs leading-relaxed text-ink-300">These links open module overviews with the existing scope preference, not records associated with this observation.</p></dialog>;
}
