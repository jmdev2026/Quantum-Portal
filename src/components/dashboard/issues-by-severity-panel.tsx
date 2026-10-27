"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock, Info, OctagonAlert, RotateCw, ShieldAlert, TriangleAlert, CircleAlert } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { useSecuritySeverity } from "@/components/dashboard/use-security-severity";
import type { SecuritySeverityState, SeverityLevel } from "@/services/security-severity";

const severityRows: { level: SeverityLevel; label: string; icon: LucideIcon; tone: string }[] = [
  { level: "critical", label: "Critical", icon: OctagonAlert, tone: "text-red-400" },
  { level: "high", label: "High", icon: TriangleAlert, tone: "text-orange-400" },
  { level: "medium", label: "Medium", icon: CircleAlert, tone: "text-amber-signal" },
  { level: "low", label: "Low", icon: Info, tone: "text-sky-400" },
];

const panelStatus: Record<SecuritySeverityState["kind"], { label: string; tone: "pending" | "disconnected" }> = {
  loading: { label: "Loading", tone: "pending" },
  ready: { label: "Connected", tone: "pending" },
  stale: { label: "Stale", tone: "disconnected" },
  empty: { label: "No data yet", tone: "pending" },
  unavailable: { label: "Not connected", tone: "disconnected" },
  error: { label: "Error", tone: "disconnected" },
};

const rowPlaceholder: Partial<Record<SecuritySeverityState["kind"], string>> = {
  unavailable: "Not connected",
  empty: "No data yet",
  error: "Unavailable",
};

const formatCount = (value: number) => new Intl.NumberFormat().format(value);
const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function IssuesBySeverityPanel() {
  const { state, retry } = useSecuritySeverity();
  return <IssuesBySeverityView state={state} onRetry={retry} />;
}

export function IssuesBySeverityView({ state, onRetry }: { state: SecuritySeverityState; onRetry: () => void }) {
  const hasCounts = state.kind === "ready" || state.kind === "stale";

  return (
    <DashboardPanel
      id="issues-severity"
      icon={ShieldAlert}
      title="Issues by Severity"
      description="Open security issues grouped by severity."
      status={panelStatus[state.kind]}
    >
      <div data-state={state.kind} className="flex flex-1 flex-col gap-4">
        <ul
          aria-busy={state.kind === "loading"}
          className="flex flex-col divide-y divide-ink-800 rounded-xl border border-ink-800 bg-ink-950/40"
        >
          {severityRows.map(({ level, label, icon: Icon, tone }) => (
            <li key={level} data-severity={level} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
              <span className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-ink-100">
                <Icon aria-hidden className={`h-4 w-4 shrink-0 ${tone}`} strokeWidth={2} />
                {label}
              </span>
              {hasCounts ? (
                <span
                  className={`text-lg font-semibold leading-none tabular-nums ${state.kind === "stale" ? "text-ink-300" : "text-ink-100"}`}
                >
                  {formatCount(state.counts[level])}
                </span>
              ) : state.kind === "loading" ? (
                <>
                  <span aria-hidden className="h-4 w-8 animate-pulse rounded bg-ink-700" />
                  <span className="sr-only">Loading</span>
                </>
              ) : (
                <span className="whitespace-nowrap text-xs text-ink-400">{rowPlaceholder[state.kind]}</span>
              )}
            </li>
          ))}
        </ul>
        <SeverityFooter state={state} onRetry={onRetry} />
      </div>
    </DashboardPanel>
  );
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

function SyncDetails({
  lastSyncedAt,
  source,
  alwaysShowTime = false,
}: {
  lastSyncedAt: string | null;
  source: string | null;
  alwaysShowTime?: boolean;
}) {
  if (!lastSyncedAt && !source && !alwaysShowTime) return null;
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

function SeverityFooter({ state, onRetry }: { state: SecuritySeverityState; onRetry: () => void }) {
  switch (state.kind) {
    case "loading":
      return null;
    case "unavailable":
      return (
        <Notice tone="text-amber-signal" icon={Info} title="Security provider not connected">
          Issue counts will appear once a security provider is connected. This does not mean there are no issues.
        </Notice>
      );
    case "empty":
      return (
        <Notice tone="text-ink-300" icon={Info} title="No findings reported yet">
          The security provider has not reported findings for this view. This does not mean there are no issues.
        </Notice>
      );
    case "error":
      return (
        <Notice tone="text-red-400" icon={AlertTriangle} title="Could not load issue counts">
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
    case "ready":
      return (
        <div className="flex flex-col gap-2 text-xs">
          {state.total !== null && (
            <p className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3">
              <span className="font-medium text-ink-300">Total open issues</span>
              <span className={`text-base font-semibold tabular-nums ${state.kind === "stale" ? "text-ink-300" : "text-ink-100"}`}>
                {formatCount(state.total)}
              </span>
            </p>
          )}
          {state.kind === "stale" ? (
            <p className="flex items-start gap-1.5 text-amber-signal">
              <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>
                Stale data. Counts may be out of date.{" "}
                <SyncDetails lastSyncedAt={state.lastSyncedAt} source={state.source} alwaysShowTime />
              </span>
            </p>
          ) : (
            <p className="truncate text-ink-400">
              <SyncDetails lastSyncedAt={state.lastSyncedAt} source={state.source} />
            </p>
          )}
        </div>
      );
  }
}
