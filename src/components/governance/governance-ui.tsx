"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
export const governanceAction = "inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-600 px-4 py-2 text-sm text-ink-100 hover:border-shield-400 hover:text-shield-300 focus-visible:outline-2 focus-visible:outline-shield-400";
export const governanceControl = "mt-2 min-h-11 w-full rounded-lg border border-ink-600 bg-ink-950 p-3 text-ink-100 focus-visible:outline-2 focus-visible:outline-shield-400";
export const governancePanel = "min-w-0 space-y-4 rounded-xl border border-ink-700 bg-ink-900 p-4 sm:p-6";
export const COMPLIANCE_ROUTES = ["framework", "controls", "assessments", "evidence"] as const;
export const ADMIN_ROUTES = ["access", "integrations", "audit", "settings"] as const;
export function GovernanceNavigation({ module }: { module: "compliance" | "administration" }) {
  const pathname = usePathname();
  const sections = module === "compliance" ? COMPLIANCE_ROUTES : ADMIN_ROUTES;
  return <nav aria-label={`${module} navigation`} className="flex flex-wrap gap-2"><Link href={`/${module}`} className={governanceAction} aria-current={pathname === `/${module}` ? "page" : undefined}>Overview</Link>{sections.map(section => <Link href={`/${module}/${section}`} key={section} aria-current={pathname === `/${module}/${section}` ? "page" : undefined} className={governanceAction}>{section[0].toUpperCase() + section.slice(1)}</Link>)}<Link href="/reports" className={governanceAction}>Reports Library</Link><Link href={module === "compliance" ? "/security" : "/customers"} className={governanceAction}>{module === "compliance" ? "Security Overview" : "Customers"}</Link><Link href={module === "compliance" ? "/administration" : "/compliance"} className={governanceAction}>{module === "compliance" ? "Administration" : "Compliance"}</Link></nav>;
}
export function GovernanceDialog({ title, children, close, trigger }: { title: string; children: ReactNode; close: () => void; trigger: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { const element = dialog.current; element?.showModal(); heading.current?.focus(); return () => { element?.close(); if (trigger?.isConnected) trigger.focus(); else document.getElementById("governance-heading")?.focus(); }; }, [trigger]);
  return <dialog ref={dialog} aria-labelledby="governance-detail-heading" onCancel={event => { event.preventDefault(); close(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-ink-600 bg-ink-900 p-6 text-ink-100 backdrop:bg-black/75"><header className="flex items-start justify-between gap-4"><h2 id="governance-detail-heading" ref={heading} tabIndex={-1} className="break-words text-xl font-semibold">{title}</h2><button className={governanceAction} onClick={close}>Close</button></header><div className="mt-6 space-y-4 text-sm leading-relaxed">{children}</div></dialog>;
}
export function ReviewActions({ edit, reset }: { edit: () => void; reset: () => void }) { return <div className="flex flex-wrap gap-2"><button type="button" className={governanceAction} onClick={edit}>Edit Preview</button><button type="button" className={governanceAction} onClick={reset}>Cancel / Reset</button></div>; }
export function ValidationMessage({ message }: { message: string | null }) { const ref = useRef<HTMLParagraphElement>(null); useEffect(() => { if (message) ref.current?.focus(); }, [message]); return message ? <p ref={ref} role="alert" tabIndex={-1} className="rounded-lg border border-amber-signal p-3 text-sm text-amber-signal">{message}</p> : null; }
