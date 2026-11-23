"use client";

import { useRef } from "react";
import Link from "next/link";
import { CircleHelp, X } from "lucide-react";

export function PortalHelp() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label="Help"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-300 outline-none hover:bg-ink-800 hover:text-ink-100 focus-visible:ring-2 focus-visible:ring-shield-400"
      >
        <CircleHelp aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="portal-help-title"
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 p-6 text-ink-100 shadow-2xl backdrop:bg-black/70"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="portal-help-title" className="text-xl font-semibold">Using Quantum Shield Command</h2>
          <button type="button" autoFocus aria-label="Close help" onClick={() => dialogRef.current?.close()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-100 hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-300">
          <section><h3 className="font-semibold text-ink-100">Live and Demo</h3><p className="mt-2">Live reporting is not connected. Demo shows fictional examples only and does not change real accounts, devices or permissions. Reloading returns to Live.</p></section>
          <section><h3 className="font-semibold text-ink-100">Customer scope</h3><p className="mt-2">In Demo, choose a customer to view their fictional summaries and records. All customers shows the demonstration portfolio. Selection is not authorization.</p></section>
          <section><h3 className="font-semibold text-ink-100">Getting around</h3><p className="mt-2">Use the sidebar on desktop or Menu on smaller screens. Customers offers links to related reporting. Reports lets you select a report preview. Account and Notifications provide explicitly fictional local previews; global search locates existing pages.</p></section>
          <section><h3 className="font-semibold text-ink-100">Unavailable actions</h3><p className="mt-2">Live notifications and authenticated profile access are not connected. No live remediation, restore, report delivery or administrative changes are available. Security coverage does not certify compliance or prove a scan occurred.</p></section>
          <Link href="/help" onClick={() => dialogRef.current?.close()} className="inline-flex min-h-11 items-center rounded-lg border border-ink-600 px-4 py-2 text-ink-100 focus-visible:outline-2 focus-visible:outline-shield-400">Open Full Help & Support</Link>
          <p className="border-t border-ink-700 pt-4">Close with the close button or Escape. Keyboard focus stays in this help window while it is open.</p>
        </div>
      </dialog>
    </>
  );
}
