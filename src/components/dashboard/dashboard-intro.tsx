"use client";

import { Info } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";

export function DashboardIntro() {
  const { view, selectedCustomer } = useCustomerView();

  const viewLabel =
    view.mode === "all"
      ? "All Customers Overview"
      : selectedCustomer
        ? `${selectedCustomer.name} Overview`
        : "Customer Overview";

  return (
    <section aria-labelledby="dashboard-heading" className="flex animate-rise flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 id="dashboard-heading" className="text-2xl font-semibold leading-tight tracking-tight text-ink-100 sm:text-3xl">
          Overview
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p aria-live="polite" className="text-sm font-medium text-shield-300">
            {viewLabel}
          </p>
          {selectedCustomer?.is_demo && (
            <span className="rounded-md border border-amber-signal/30 bg-amber-signal/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
              Demo
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-400">
          The customer view only changes this label. No data is filtered.
        </p>
      </div>

      <p className="inline-flex items-center gap-2 self-start rounded-full border border-ink-700 bg-ink-900/80 px-3 py-1.5 text-xs text-ink-300 md:self-auto">
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-amber-signal" />
        Provider integrations are not connected yet
        <Info aria-hidden className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.75} />
      </p>
    </section>
  );
}
