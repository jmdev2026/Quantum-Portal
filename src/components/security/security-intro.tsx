"use client";

import Link from "next/link";
import { FlaskConical, PlugZap } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { DashboardModeSwitch, DemoModeNotice } from "@/components/dashboard-mode/dashboard-mode-switch";
import { SECURITY_LIVE_NOTICE, securityScopeLabel } from "@/components/security/security-overview-view";

export function SecurityIntro() {
  const { view, selectedCustomer } = useCustomerView();
  const { mode } = useDashboardMode();
  const scopeLabel = securityScopeLabel(view.mode, selectedCustomer?.name);

  return (
    <section aria-labelledby="security-heading" data-mode={mode} className="flex motion-safe:animate-slide-up flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 id="security-heading" className="text-2xl font-semibold leading-tight tracking-tight text-ink-100 sm:text-3xl">
            Security Overview
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p aria-live="polite" data-scope className="break-words text-sm font-medium text-shield-300">
              <span className="sr-only">Selected scope: </span>
              {scopeLabel}
            </p>
            {selectedCustomer?.is_demo && (
              <span className="rounded-md border border-amber-signal/30 bg-amber-signal/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
                Demo
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-300">
            Visibility into cybersecurity findings, security controls, identities and endpoints.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:shrink-0 md:items-end">
          <DashboardModeSwitch />
          {mode === "demo" ? (
            <p
              data-simulated
              className="inline-flex items-center gap-2 rounded-full border border-amber-signal/40 bg-amber-signal/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-amber-signal"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Demonstration view
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/80 px-3 py-1.5 text-xs text-ink-300">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-amber-signal" />
              Security integrations are not connected
            </p>
          )}
        </div>
      </div>

      {mode === "demo" ? (
        <DemoModeNotice />
      ) : (
        <div
          data-live-notice
          className="flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-900/80 px-4 py-3"
        >
          <PlugZap aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-signal" strokeWidth={2} />
          <p className="text-sm leading-relaxed text-ink-300">
            <strong className="font-semibold text-ink-100">Live mode.</strong> {SECURITY_LIVE_NOTICE}
          </p>
        </div>
      )}
      <Link href="/reports/cybersecurity" className="inline-flex min-h-11 w-fit items-center rounded-lg border border-ink-600 px-4 py-3 text-sm text-shield-300 focus-visible:outline-2 focus-visible:outline-shield-400">Open Cybersecurity Report</Link>
    </section>
  );
}
