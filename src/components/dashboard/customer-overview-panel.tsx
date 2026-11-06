"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Building2, Clock, FlaskConical, Info, RotateCw } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { CustomerPortfolioDetail, CustomerPortfolioList } from "@/components/dashboard/customer-portfolio-list";
import { portfolioLayout, type OverviewMode } from "@/components/dashboard/customer-overview-view";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { useCustomerOverview } from "@/components/dashboard/use-customer-overview";
import type { CustomerOverviewState } from "@/services/customer-overview";

const panelStatus: Record<CustomerOverviewState["kind"], { label: string; tone: "pending" | "disconnected" }> = {
  loading: { label: "Loading", tone: "pending" },
  ready: { label: "Connected", tone: "pending" },
  stale: { label: "Stale", tone: "disconnected" },
  empty: { label: "No data yet", tone: "pending" },
  unavailable: { label: "Not connected", tone: "disconnected" },
  error: { label: "Error", tone: "disconnected" },
};

const announcement: Record<Exclude<CustomerOverviewState["kind"], "error">, string> = {
  loading: "Loading customer overview",
  ready: "Customer overview loaded",
  stale: "Customer overview loaded. Data is stale.",
  empty: "No customer reporting data yet",
  unavailable: "Customer reporting not connected",
};

const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function CustomerOverviewPanel() {
  const { state, mode, simulated, retry } = useCustomerOverview();
  return <CustomerOverviewView state={state} mode={mode} simulated={simulated} onRetry={retry} />;
}

export function CustomerOverviewView({
  state,
  mode,
  simulated,
  onRetry,
}: {
  state: CustomerOverviewState;
  mode: OverviewMode;
  simulated: boolean;
  onRetry: () => void;
}) {
  const hasData = state.kind === "ready" || state.kind === "stale";
  const status = simulated && hasData ? ({ label: "Simulated", tone: "disconnected" } as const) : panelStatus[state.kind];
  const contentRef = useRef<HTMLDivElement>(null);
  // The Retry button unmounts while reloading, so keep keyboard focus inside the panel.
  const retry = () => {
    contentRef.current?.focus();
    onRetry();
  };

  return (
    <DashboardPanel
      id="customer-overview"
      icon={Building2}
      title="Customer Overview"
      description="Security and backup reporting availability for the selected view."
      status={status}
      className="lg:col-span-2"
    >
      <p role="status" className="sr-only">
        {state.kind === "error" ? "" : simulated && hasData ? "Simulated customer overview loaded" : announcement[state.kind]}
      </p>
      <div
        ref={contentRef}
        tabIndex={-1}
        data-state={state.kind}
        data-mode={simulated ? "demo" : "live"}
        aria-busy={state.kind === "loading"}
        className="@container flex flex-1 flex-col gap-4 outline-none"
      >
        <OverviewBody state={state} mode={mode} simulated={simulated} onRetry={retry} />
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-300">
          <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Reporting status shows whether data is being received. It does not indicate whether a customer is secure or
          backed up.
        </p>
      </div>
    </DashboardPanel>
  );
}

function OverviewBody({
  state,
  mode,
  simulated,
  onRetry,
}: {
  state: CustomerOverviewState;
  mode: OverviewMode;
  simulated: boolean;
  onRetry: () => void;
}) {
  switch (state.kind) {
    case "loading":
      return (
        <ul aria-hidden className="flex flex-col divide-y divide-ink-800 rounded-xl border border-ink-800 bg-ink-950/40">
          {[0, 1, 2].map((row) => (
            <li key={row} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <span className="h-4 w-40 max-w-full animate-pulse rounded bg-ink-700" />
              <span className="h-6 w-28 animate-pulse rounded-full bg-ink-800" />
              <span className="h-6 w-28 animate-pulse rounded-full bg-ink-800" />
            </li>
          ))}
        </ul>
      );
    case "unavailable":
      return (
        <Notice tone="text-amber-signal" icon={Info} title="Customer reporting not connected">
          Customer reporting availability will appear here once Quantum Shield is connected to its reporting service.
          No customer status is shown until then.
        </Notice>
      );
    case "empty":
      return (
        <Notice tone="text-ink-100" icon={Info} title="No customer reporting data yet">
          No customers have reported data for this view yet.
        </Notice>
      );
    case "error":
      return (
        <Notice tone="text-red-400" icon={AlertTriangle} title="Could not load customer overview" role="alert">
          <p>{state.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-2.5 py-1 text-ink-300 transition-colors hover:border-shield-500/40 hover:text-shield-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400"
          >
            <RotateCw aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            Retry
          </button>
        </Notice>
      );
    case "ready":
    case "stale": {
      const stale = state.kind === "stale";
      return (
        <>
          {stale && (
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-signal">
              <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Stale data. Reporting availability may be out of date.
            </p>
          )}
          {portfolioLayout(mode) === "detail" ? (
            <CustomerPortfolioDetail customer={state.customers[0]} stale={stale} simulated={simulated} />
          ) : (
            <CustomerPortfolioList customers={state.customers} stale={stale} simulated={simulated} />
          )}
          {simulated ? (
            <p data-simulated className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-signal">
              <FlaskConical aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>
                Simulated customer portfolio — &ldquo;Available&rdquo; only means demonstration fixtures exist. No Guardz
                or Datto integration is connected and no reporting has been received.
              </span>
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-ink-300">
              {state.hiddenCount > 0 && (
                <span className="block">
                  Showing the first {state.customers.length} customers. {state.hiddenCount} more not shown.
                </span>
              )}
              {state.lastSyncedAt ? (
                <>
                  Last synced <time dateTime={state.lastSyncedAt}>{formatTimestamp(state.lastSyncedAt)}</time>
                </>
              ) : (
                "Sync time not provided"
              )}
              {state.source && <span className="font-mono"> · {state.source}</span>}
            </p>
          )}
        </>
      );
    }
  }
}

function Notice({
  tone,
  icon: Icon,
  title,
  role,
  children,
}: {
  tone: string;
  icon: LucideIcon;
  title: string;
  role?: "alert";
  children: ReactNode;
}) {
  return (
    <div role={role} className="rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3 text-xs leading-relaxed text-ink-300">
      <p className={`flex items-center gap-1.5 font-medium ${tone}`}>
        <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {title}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
