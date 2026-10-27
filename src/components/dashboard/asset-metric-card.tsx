import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock } from "lucide-react";
import type { AssetMetricState } from "@/services/dashboard-assets";

type AssetMetricCardProps = { icon: LucideIcon; label: string; state: AssetMetricState };

const iconTone: Record<AssetMetricState["kind"], string> = {
  loading: "text-ink-400",
  ready: "text-shield-400",
  stale: "text-amber-signal",
  empty: "text-shield-400",
  unavailable: "text-shield-400",
  error: "text-red-400",
};

const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function AssetMetricCard({ icon: Icon, label, state }: AssetMetricCardProps) {
  return (
    <li
      aria-busy={state.kind === "loading"}
      data-state={state.kind}
      className="group flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-900/80 p-4 transition-colors duration-300 hover:border-shield-500/30"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 transition-transform duration-300 group-hover:-translate-y-0.5 ${iconTone[state.kind]}`}
      >
        <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-100">{label}</p>
        <MetricBody state={state} />
      </div>
    </li>
  );
}

function StatusLine({ dotClass, children }: { dotClass: string; children: React.ReactNode }) {
  return (
    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
      <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      {children}
    </p>
  );
}

function MetricBody({ state }: { state: AssetMetricState }) {
  switch (state.kind) {
    case "loading":
      return (
        <>
          <span aria-hidden className="mt-1.5 block h-3.5 w-24 animate-pulse rounded bg-ink-700" />
          <span className="sr-only">Loading</span>
        </>
      );
    case "unavailable":
      return <StatusLine dotClass="border border-ink-400">Awaiting integration</StatusLine>;
    case "empty":
      return <StatusLine dotClass="bg-ink-400">No data reported yet</StatusLine>;
    case "error":
      return (
        <div className="mt-0.5 text-xs">
          <p className="flex items-center gap-1.5 font-medium text-red-400">
            <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Could not load
          </p>
          <p className="mt-0.5 line-clamp-2 text-ink-400">{state.message}</p>
        </div>
      );
    case "ready":
    case "stale":
      return (
        <div className="mt-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={`text-xl font-semibold leading-tight tabular-nums ${state.kind === "stale" ? "text-ink-300" : "text-ink-100"}`}>
              {new Intl.NumberFormat().format(state.value)}
            </span>
            {state.issueCount !== null && <IssueBadge count={state.issueCount} />}
          </div>
          <SyncLine state={state} />
        </div>
      );
  }
}

function IssueBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-[11px] font-medium text-shield-300">No issues</span>;
  }
  return (
    <span className="rounded-md border border-amber-signal/30 bg-amber-signal/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-signal">
      {new Intl.NumberFormat().format(count)} {count === 1 ? "issue" : "issues"}
    </span>
  );
}

function SyncLine({ state }: { state: Extract<AssetMetricState, { kind: "ready" | "stale" }> }) {
  const time = state.lastSyncedAt && <time dateTime={state.lastSyncedAt}>{formatTimestamp(state.lastSyncedAt)}</time>;
  const source = state.source && <span className="font-mono"> · {state.source}</span>;

  if (state.kind === "stale") {
    return (
      <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-signal">
        <Clock aria-hidden className="h-3 w-3 shrink-0" strokeWidth={2} />
        <span className="truncate">
          {time ? <>Stale · last synced {time}</> : "Stale data"}
          {source}
        </span>
      </p>
    );
  }
  if (!time && !source) return null;
  return (
    <p className="mt-1 truncate text-[11px] text-ink-400">
      {time ? <>Synced {time}</> : "Sync time not provided"}
      {source}
    </p>
  );
}
