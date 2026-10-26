"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, Shield, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar/sidebar-nav";
import { findActiveNavItem } from "@/components/sidebar/navigation";

const COLLAPSE_STORAGE_KEY = "qsc.sidebar.collapsed";
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, prev ? "0" : "1");
      return !prev;
    });
  };

  return (
    <>
      <aside
        aria-label="Sidebar"
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-ink-800 bg-ink-900/95 backdrop-blur transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <div className={`flex h-[72px] items-center border-b border-ink-800 ${collapsed ? "justify-center px-0" : "px-5"}`}>
          <Brand compact={collapsed} />
        </div>

        <div className={`flex-1 py-6 ${collapsed ? "overflow-visible px-3" : "overflow-y-auto px-3"}`}>
          <SidebarNav pathname={pathname} collapsed={collapsed} />
        </div>

        <div className="border-t border-ink-800 p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-10 w-full items-center gap-3 rounded-lg text-sm text-ink-400 outline-none transition-colors hover:bg-ink-800 hover:text-ink-100 focus-visible:ring-2 focus-visible:ring-shield-500/70 ${
              collapsed ? "justify-center" : "px-3"
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <>
                <PanelLeftClose aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <MobileNavigation pathname={pathname} open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-shield-500/30 bg-shield-500/10 text-shield-400 shadow-[0_0_24px_-8px] shadow-shield-500/60">
        <Shield aria-hidden className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className={compact ? "sr-only" : "min-w-0 leading-tight"}>
        <p className="truncate text-sm font-semibold tracking-wide text-ink-100">Quantum Shield</p>
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-shield-400">Command</p>
      </div>
    </div>
  );
}

function MobileNavigation({
  pathname,
  open,
  onOpenChange,
}: {
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const currentLabel = findActiveNavItem(pathname)?.label;

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeRef.current?.focus();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && close();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [open, close]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="contents lg:hidden">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-800 bg-ink-950/90 px-4 backdrop-blur sm:px-6">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => onOpenChange(true)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 text-sm font-medium text-ink-100 outline-none transition-colors hover:border-shield-500/40 focus-visible:ring-2 focus-visible:ring-shield-500/70"
        >
          <Menu aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Menu
        </button>
        {currentLabel && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-400">{currentLabel}</span>
        )}
      </div>

      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id="mobile-navigation"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        inert={!open}
        onKeyDown={onKeyDown}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col border-r border-ink-800 bg-ink-900 shadow-2xl shadow-black/60 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-ink-800 px-5">
          <Brand />
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 outline-none transition-colors hover:bg-ink-800 hover:text-ink-100 focus-visible:ring-2 focus-visible:ring-shield-500/70"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <SidebarNav pathname={pathname} onNavigate={close} />
        </div>
      </div>
    </div>
  );
}
