"use client";
import Link from "next/link";
import { Bell, UserRound } from "lucide-react";
import { PortalHelp } from "@/components/header/portal-help";
import { GlobalSearch } from "@/components/shared-experience/global-search";
import { usePathname } from "next/navigation";
import { CustomerSelector } from "@/components/customer-selector/customer-selector";
import { findActiveNavItem } from "@/components/sidebar/navigation";
export function AppHeader() {
  const pathname = usePathname(); const title = findActiveNavItem(pathname)?.label ?? "Page not found";
  const action = "flex h-11 w-11 items-center justify-center rounded-lg text-ink-300 hover:bg-ink-800 hover:text-ink-100 focus-visible:ring-2 focus-visible:ring-shield-400";
  return <header className="relative z-20 border-b border-ink-800 bg-ink-900/95 backdrop-blur lg:sticky lg:top-0"><div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:min-h-[72px] lg:flex-nowrap lg:px-8"><div className="order-1 min-w-0 flex-1"><p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-shield-400">Quantum Shield Command</p><p className="mt-1 truncate text-lg font-semibold leading-tight text-ink-100">{title}</p></div><div className="order-3 w-full lg:order-2 lg:w-auto"><CustomerSelector /></div><div className="order-2 flex shrink-0 items-center gap-1 lg:order-3"><GlobalSearch /><Link href="/notifications" aria-label="Notification Center — demonstration and unavailable states" className={action}><Bell aria-hidden className="h-5 w-5" /></Link><PortalHelp /><Link href="/account" aria-label="Account — fictional preview, not signed in" className={`${action} border border-ink-700`}><UserRound aria-hidden className="h-5 w-5" /></Link></div></div></header>;
}
