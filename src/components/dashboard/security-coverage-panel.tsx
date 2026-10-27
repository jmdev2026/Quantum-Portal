"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CircleCheck, CircleHelp, Clock, Info, Minus, RotateCw, ShieldCheck } from "lucide-react";
import { CoverageGauge } from "@/components/dashboard/coverage-gauge";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { useSecurityCoverage } from "@/components/dashboard/use-security-coverage";
import { SECURITY_CONTROLS, type ControlStatus, type SecurityCoverageState } from "@/services/security-coverage";

const panelStatus: Record<SecurityCoverageState["kind"], { label: string; tone: "pending" | "disconnected" }> = {
  loading: { label: "Loading", tone: "pending" },
  ready: { label: "Connected", tone: "pending" },
  stale: { label: "Stale", tone: "disconnected" },
  empty: { label: "No data yet", tone: "pending" },
  unavailable: { label: "Not connected", tone: "disconnected" },
  error: { label: "Error", tone: "disconnected" },
};

const controlStatusDisplay: Record<ControlStatus | "not_reported", { label: string; icon: LucideIcon; tone: string }> = {
  covered: { label: "Covered", icon: CircleCheck, tone: "text-shield-400" },
  needs_attention: { label: "Needs attention", icon: AlertTriangle, tone: "text-amber-signal" },
  unknown: { label: "Unknown", icon: CircleHelp, tone: "text-ink-300" },
  not_reported: { label: "Not reported", icon: Minus, tone: "text-ink-400" },
};

const rowPlaceholder: Partial<Record<SecurityCoverageState["kind"], string>> = {
  unavailable: "Not connected",
  empty: "No data yet",
  error: "Unavailable",
};

const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function SecurityCoveragePanel() {
  const { state, retry } = useSecurityCoverage();
  return <SecurityCoverageView state={state} onRetry={retry} />;
}

export function SecurityCoverageView({ state, onRetry }: { state: SecurityCoverageState; onRetry: () => void }) {
  const hasData = state.kind === "ready" || state.kind === "stale";
  const coverage = hasData ? state.coverage : null;

  return (
    <DashboardPanel
      id="security-coverage"
      icon={ShieldCheck}
      title="Security Coverage"
      description="Security control coverage for the selected view."
      status={panelStatus[state.kind]}
      className="lg:col-span-2"
    >
      <div data-state={state.kind} aria-busy={state.kind === "loading"} className="@container flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-start">
          <div className="flex flex-col items-center gap-3 text-center @2xl:w-52 @2xl:shrink-0">
            {coverage ? (
              <CoverageGauge variant="value" percentage={coverage.percentage} stale={state.kind === "stale"} />
            ) : (
              <CoverageGauge variant={state.kind === "loading" ? "loading" : "neutral"} />
            )}
            <CoverageCaption state={state} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-400">Security controls</h3>
            {hasData && !state.controls ? (
              <p className="mt-3 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3 text-xs leading-relaxed text-ink-400">
                Individual control statuses were not reported for this view.
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 gap-2 @md:grid-cols-2">
                {SECURITY_CONTROLS.map((control) => (
                  <li
                    key={control.key}
                    data-control={control.key}
                    className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2.5 transition-colors hover:border-ink-700"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium leading-snug text-ink-100">
                      <span className="min-w-0">{control.label}</span>
                      {control.abbreviation && (
                        <span className="shrink-0 rounded border border-ink-700 px-1.5 font-mono text-[10px] text-ink-300">
                          {control.abbreviation}
                        </span>
                      )}
                    </span>
                    <ControlStatusValue
                      state={state}
                      status={hasData ? (state.controls?.[control.key] ?? "not_reported") : null}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <CoverageFooter state={state} onRetry={onRetry} />
      </div>
    </DashboardPanel>
  );
}

function ControlStatusValue({
  state,
  status,
}: {
  state: SecurityCoverageState;
  status: ControlStatus | "not_reported" | null;
}) {
  if (status) {
    const { label, icon: Icon, tone } = controlStatusDisplay[status];
    return (
      <span className={`flex items-center gap-1.5 text-xs font-medium ${tone} ${state.kind === "stale" ? "opacity-75" : ""}`}>
        <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span>
          <span className="sr-only">Status: </span>
          {label}
        </span>
      </span>
    );
  }
  if (state.kind === "loading") {
    return (
      <>
        <span aria-hidden className="h-3.5 w-20 animate-pulse rounded bg-ink-700" />
        <span className="sr-only">Loading</span>
      </>
    );
  }
  return <span className="text-xs text-ink-400">{rowPlaceholder[state.kind]}</span>;
}

function CoverageCaption({ state }: { state: SecurityCoverageState }) {
  if (state.kind === "loading") return <span className="sr-only">Loading coverage</span>;
  if ((state.kind === "ready" || state.kind === "stale") && state.coverage) {
    return (
      <p className="max-w-xs text-xs leading-relaxed text-ink-400">
        <span className="font-medium text-ink-300">Measures: </span>
        {state.coverage.basis}
      </p>
    );
  }
  const text =
    state.kind === "ready" || state.kind === "stale"
      ? "An overall coverage percentage was not reported."
      : "Coverage is not yet available.";
  return <p className="max-w-xs text-xs leading-relaxed text-ink-400">{text}</p>;
}

function Notice({ tone, icon: Icon, title, children }: { tone: string; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3 text-xs leading-relaxed text-ink-400">
      <p className={`flex items-center gap-1.5 font-medium ${tone}`}>
        <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {title}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SyncDetails({ lastSyncedAt, source }: { lastSyncedAt: string | null; source: string | null }) {
  return (
    <>
      {lastSyncedAt ? (
        <>
          Last synced <time dateTime={lastSyncedAt}>{formatTimestamp(lastSyncedAt)}</time>
        </>
      ) : (
        "Sync time not provided"
      )}
      {source && <span className="font-mono"> · {source}</span>}
    </>
  );
}

function CoverageFooter({ state, onRetry }: { state: SecurityCoverageState; onRetry: () => void }) {
  switch (state.kind) {
    case "loading":
      return null;
    case "unavailable":
      return (
        <Notice tone="text-amber-signal" icon={Info} title="Security coverage not yet available">
          Coverage will appear once a security provider is connected. This does not indicate whether protection is
          active or inactive.
        </Notice>
      );
    case "empty":
      return (
        <Notice tone="text-ink-300" icon={Info} title="No coverage reported yet">
          The security provider has not reported coverage for this view. This does not indicate whether protection is
          active or inactive.
        </Notice>
      );
    case "error":
      return (
        <Notice tone="text-red-400" icon={AlertTriangle} title="Could not load security coverage">
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
    case "stale":
      return (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-signal">
          <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>
            Stale data. Coverage may be out of date. <SyncDetails lastSyncedAt={state.lastSyncedAt} source={state.source} />
          </span>
        </p>
      );
    case "ready":
      if (!state.lastSyncedAt && !state.source) return null;
      return (
        <p className="truncate text-xs text-ink-400">
          <SyncDetails lastSyncedAt={state.lastSyncedAt} source={state.source} />
        </p>
      );
  }
}
