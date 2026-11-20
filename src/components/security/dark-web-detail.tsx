"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { DarkWebData, DarkWebSelection } from "@/services/dark-web-types";
import { accountFindings, domainFindings, darkWebLabel, RESPONSE_GUIDANCE, type selectDarkWebDetail } from "@/components/security/dark-web-view";
import { DarkWebReviewPreview } from "@/components/security/dark-web-review-preview";
import { capabilityAction } from "@/components/security/capability-record-explorer";

type Detail = NonNullable<ReturnType<typeof selectDarkWebDetail>>;
export function DarkWebDetail({ detail, data, canGoBack, onOpen, onBack, onClose }: { detail: Detail; data: DarkWebData; canGoBack: boolean; onOpen: (selection: DarkWebSelection) => void; onBack: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [reviewing, setReviewing] = useState(false);
  const finding = detail.kind === "finding" ? detail.record : null;
  const account = detail.kind === "account" ? detail.record : finding ? data.accounts.find(account => account.id === finding.account.id)! : null;
  const domain = detail.kind === "domain" ? detail.record : data.domains.find(domain => domain.id === (finding?.domain.id ?? account!.domain.id))!;
  const linked = account && !finding ? accountFindings(data, account.id) : !finding ? domainFindings(data, domain.id) : [];
  const title = detail.kind === "finding" ? detail.record.title : detail.record.label;
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (trigger?.isConnected) trigger.focus(); else document.getElementById("dark-web-page-title")?.focus(); };
  }, []);
  useEffect(() => { setReviewing(false); titleRef.current?.focus(); }, [detail.kind, detail.record.id]);
  return <dialog ref={ref} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="dark-web-detail-title" aria-describedby="dark-web-detail-disclosure" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 p-4 text-ink-100 shadow-2xl backdrop:bg-black/75 sm:p-8">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wider text-amber-signal">Fictional {detail.kind === "finding" ? "exposure investigation" : detail.kind === "account" ? "account exposure" : "domain monitoring preview"}</p><h2 ref={titleRef} tabIndex={-1} id="dark-web-detail-title" className="mt-3 break-words text-xl font-semibold leading-tight outline-none focus-visible:ring-2 focus-visible:ring-shield-400">{title}</h2></div><button type="button" autoFocus onClick={onClose} aria-label="Close Dark Web details" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400"><X aria-hidden className="h-5 w-5" /></button></div>
    <p id="dark-web-detail-disclosure" className="mt-4 text-sm leading-relaxed text-ink-300">Illustrative relationships only. No account is verified compromised and no domain ownership or active monitoring has been verified.</p>
    <p className="mt-3 break-words text-sm text-ink-100">Customer: {detail.record.customer.name}</p>
    {reviewing && finding ? <DarkWebReviewPreview key={finding.id} finding={finding} onCancel={() => setReviewing(false)} /> : <>
      <dl className="mt-6 grid gap-4 rounded-xl border border-ink-700 bg-ink-950 p-4 text-sm sm:grid-cols-2"><div><dt className="text-ink-350">Reserved example domain</dt><dd className="mt-2 break-words">{domain.domain}</dd></div><div><dt className="text-ink-350">Synthetic reference</dt><dd className="mt-2 break-words">{detail.record.id}</dd></div>
        {account && <div className="sm:col-span-2"><dt className="text-ink-350">Separate fictional exposure account · not a verified ITDR match</dt><dd className="mt-2 break-words">{account.label}</dd></div>}
        {finding && <><div><dt className="text-ink-350">Exposure category</dt><dd className="mt-2 capitalize">{darkWebLabel(finding.category)}</dd></div><div><dt className="text-ink-350">Illustrative severity</dt><dd className="mt-2 capitalize">{finding.severity}</dd></div><div><dt className="text-ink-350">Simulated review state</dt><dd className="mt-2 capitalize">{darkWebLabel(finding.review_status)}</dd></div></>}
        <div><dt className="text-ink-350">Demonstration monitoring status</dt><dd className="mt-2">Fictional domain preview · not enrolled</dd></div><div className="sm:col-span-2"><dt className="text-ink-350">Source</dt><dd className="mt-2">{detail.record.source} · explicitly demonstration-only</dd></div>
      </dl>
      {finding ? <><section className="mt-6"><h3 className="font-semibold">Safe illustrative observation</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{finding.observation}</p></section><section className="mt-6"><h3 className="font-semibold">Recommended response · informational only</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">{RESPONSE_GUIDANCE[finding.response_category]}</p></section><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => onOpen({ kind: "account", id: account!.id })} className={capabilityAction}>Inspect fictional account</button><button type="button" onClick={() => onOpen({ kind: "domain", id: domain.id })} className={capabilityAction}>Inspect domain preview</button><button type="button" onClick={() => setReviewing(true)} className={capabilityAction}>Open Demo review preview</button></div></> : <>
        <section className="mt-6"><h3 className="font-semibold">Linked illustrative findings · {linked.length}</h3><ul className="mt-3 space-y-3">{linked.map(finding => <li key={finding.id} className="rounded-xl border border-ink-700 p-4"><p className="mb-3 text-xs capitalize text-ink-300">{darkWebLabel(finding.category)} · {finding.severity} illustrative severity</p><button type="button" onClick={() => onOpen({ kind: "finding", id: finding.id })} className={`${capabilityAction} max-w-full break-words text-left`}>{finding.title}</button></li>)}</ul>{!linked.length && <p className="mt-3 text-sm text-ink-300">No linked examples supplied; this says nothing about actual exposure.</p>}</section>
        {detail.kind === "domain" && <section className="mt-6"><h3 className="font-semibold">Associated fictional accounts</h3><ul className="mt-3 space-y-3">{data.accounts.filter(account => account.domain.id === domain.id).map(account => <li key={account.id}><button type="button" onClick={() => onOpen({ kind: "account", id: account.id })} className={`${capabilityAction} max-w-full break-words text-left`}>{account.label}</button></li>)}</ul></section>}
        {detail.kind === "account" && <button type="button" onClick={() => onOpen({ kind: "domain", id: domain.id })} className={`${capabilityAction} mt-6`}>Inspect associated domain</button>}
        <section className="mt-6"><h3 className="font-semibold">General risk & organizational review guidance</h3><p className="mt-3 text-sm leading-relaxed text-ink-300">An illustrative association is not proof of compromise. Confirm authorized account and domain scope through approved administrative processes; review access and protection policies before determining any real response. No enrollment, account change or monitoring operation is available.</p></section>
      </>}
      <section className="mt-6 rounded-xl border border-amber-signal/30 p-4"><h3 className="text-sm font-semibold text-amber-signal">Unavailable real evidence</h3><p className="mt-2 text-sm leading-relaxed text-ink-300">No breach source, credential contents, discovery dates, timeline, provider case, confidence score or remediation outcome is supplied. Creation metadata is synthetic fixture authoring only. Reporting availability is not evidence of safety.</p></section>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/security/itdr" onClick={onClose} className={capabilityAction}>Open ITDR overview · no identity match implied</Link><Link href="/reports" onClick={onClose} className={capabilityAction}>Open existing Reports · Dark Web data not included</Link></div>
    </>}
    {(reviewing || canGoBack) && <button type="button" onClick={() => reviewing ? setReviewing(false) : onBack()} className={`${capabilityAction} mt-6`}>{reviewing ? "Back to investigation" : "Back to previous detail"}</button>}
  </dialog>;
}
