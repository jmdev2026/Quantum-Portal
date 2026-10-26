"use client";

import type { LucideIcon } from "lucide-react";
import { Bell, CircleHelp, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { findActiveNavItem } from "@/components/sidebar/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const title = findActiveNavItem(pathname)?.label ?? "Page not found";

  return (
    <header className="relative z-20 border-b border-ink-800 bg-ink-900/95 backdrop-blur lg:sticky lg:top-0">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-shield-400">
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-shield-500 shadow-[0_0_8px_1px] shadow-shield-500/60" />
            <span className="truncate">Quantum Shield Command</span>
          </p>
          <p className="mt-1 truncate text-lg font-semibold leading-tight tracking-tight text-ink-100 lg:text-xl">
            {title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <PlaceholderAction icon={Bell} label="Notifications" />
          <PlaceholderAction icon={CircleHelp} label="Help" />
          <span aria-hidden className="mx-1 h-6 w-px bg-ink-700 sm:mx-2" />
          <button
            type="button"
            disabled
            aria-label="Profile (not yet available)"
            title="Profile is not yet available"
            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-ink-700 bg-ink-800 text-ink-400"
          >
            <UserRound aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}

function PlaceholderAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={`${label} (not yet available)`}
      title={`${label} is not yet available`}
      className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-ink-400 opacity-80"
    >
      <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </button>
  );
}
