"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-4 py-2 text-sm font-medium text-ink-100 outline-none hover:border-shield-400 focus-visible:ring-2 focus-visible:ring-shield-400 disabled:opacity-50";
export const control = "mt-2 min-h-11 w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none focus-visible:ring-2 focus-visible:ring-shield-400";
export const panel = "min-w-0 rounded-2xl border border-ink-700 bg-ink-900/80 p-5 sm:p-6";
export function WorkflowNavigation({ area }: { area: "customers" | "inventory" }) {
  const pathname = usePathname();
  const links = area === "customers" ? [["/customers", "Customer portfolio"], ["/customers/onboarding", "Onboarding preview"]] : [["/users-devices", "Overview"], ["/users-devices/users", "User observations"], ["/users-devices/devices", "Device observations"]];
  return <nav aria-label={area === "customers" ? "Customer pages" : "Users and devices pages"} className="flex flex-wrap gap-2">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={action}>{label}</Link>)}</nav>;
}
export function WorkflowPage({ title, description, area, children }: { title: string; description: string; area: "customers" | "inventory"; children: ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"><header><p className="font-mono text-xs uppercase tracking-widest text-shield-300">Quantum Shield IT · Command</p><h1 id="workflow-heading" tabIndex={-1} className="mt-3 text-3xl font-semibold leading-tight text-ink-100 outline-none">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-300">{description}</p></header><WorkflowNavigation area={area} />{children}<p className="text-xs leading-relaxed text-ink-350">Fictional local demonstration only. Live integrations and server-enforced tenant authorization are not implemented.</p></main>;
}
export function WorkflowState({ kind, message, retry }: { kind: string; message?: string; retry?: () => void }) {
  return <div className={panel} role={kind === "error" ? "alert" : "status"} aria-busy={kind === "loading"}><p className="text-sm leading-relaxed text-ink-100">{message ?? (kind === "loading" ? "Loading the selected scope…" : kind === "empty" ? "No observations are available for this scope." : "Live reporting is not connected. Switch to Demo to inspect fictional examples; unavailable does not mean zero.")}</p>{kind === "error" && retry && <button className={`mt-4 ${action}`} onClick={retry}>Retry</button>}</div>;
}
