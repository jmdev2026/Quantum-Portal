"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CircleCheck,
  CircleOff,
  Clock,
  Clock3,
  DatabaseBackup,
  HardDrive,
  Hourglass,
  Info,
  RotateCw,
} from "lucide-react";
import { BackupJobOutcomes } from "@/components/dashboard/backup-job-outcomes";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { useBackupHealth } from "@/components/dashboard/use-backup-health";
import { FRESHNESS_BUCKETS, type BackupHealthState, type FreshnessBucket } from "@/services/backup-health";

const bucketDisplay: Record<FreshnessBucket, { icon: LucideIcon; tone: string }> = {
  less_than_1_hour: { icon: CircleCheck, tone: "text-shield-400" },
  "1_to_3_hours": { icon: Clock3, tone: "text-shield-300" },
  "4_to_24_hours": { icon: Hourglass, tone: "text-amber-signal" },
  more_than_24_hours: { icon: AlertTriangle, tone: "text-orange-400" },
  no_successful_backup: { icon: CircleOff, tone: "text-red-400" },
};

const panelStatus: Record<BackupHealthState["kind"], { label: string; tone: "pending" | "disconnected" }> = {
  loading: { label: "Loading", tone: "pending" },
  ready: { label: "Connected", tone: "pending" },
  stale: { label: "Stale", tone: "disconnected" },
  empty: { label: "No data yet", tone: "pending" },
  unavailable: { label: "Not connected", tone: "disconnected" },
  error: { label: "Error", tone: "disconnected" },
};

const placeholder: Record<"empty" | "unavailable" | "error", string> = {
  unavailable: "Not connected",
  empty: "No data yet",
  error: "Unavailable",
};

type BackupData = Extract<BackupHealthState, { kind: "ready" | "stale" }>;
const hasBackupData = (state: BackupHealthState): state is BackupData => state.kind === "ready" || state.kind === "stale";

const formatCount = (value: number) => new Intl.NumberFormat().format(value);
const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function BackupHealthPanel() {
  const { state, retry } = useBackupHealth();
  return <BackupHealthView state={state} onRetry={retry} />;
}

export function BackupHealthView({ state, onRetry }: { state: BackupHealthState; onRetry: () => void }) {
  const data = hasBackupData(state) ? state : null;
  const stale = state.kind === "stale";
  const unavailableText =
    state.kind === "empty" || state.kind === "unavailable" || state.kind === "error" ? placeholder[state.kind] : null;

  return (
    <DashboardPanel
      id="backup-health"
      icon={DatabaseBackup}
      title="Backup Health"
      description="Datto Endpoint Backup protected assets, last successful backup freshness and job outcomes."
      status={panelStatus[state.kind]}
    >
      <div data-state={state.kind} aria-busy={state.kind === "loading"} className="flex flex-1 flex-col gap-4">
        <div
          data-metric="protected-assets"
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium text-ink-100">
            <HardDrive aria-hidden className="h-4 w-4 shrink-0 text-shield-400" strokeWidth={1.75} />
            Protected assets
          </span>
          {data ? (
            data.protectedAssets !== null ? (
              <span className={`text-2xl font-semibold leading-none tabular-nums ${stale ? "text-ink-300" : "text-ink-100"}`}>
                {formatCount(data.protectedAssets)}
              </span>
            ) : (
              <span className="text-xs text-ink-400">Not reported</span>
            )
          ) : state.kind === "loading" ? (
            <Pending />
          ) : (
            <span className="text-xs text-ink-400">
              {state.kind === "unavailable" ? "Awaiting integration" : unavailableText}
            </span>
          )}
        </div>

        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-400">Last successful backup</h3>
          <ul className="mt-2 flex flex-col divide-y divide-ink-800 rounded-xl border border-ink-800 bg-ink-950/40">
            {FRESHNESS_BUCKETS.map(({ key, label }) => {
              const { icon: Icon, tone } = bucketDisplay[key];
              const count = data?.freshness ? data.freshness[key] : null;
              return (
                <li key={key} data-bucket={key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink-100">
                    <Icon aria-hidden className={`h-4 w-4 shrink-0 ${tone}`} strokeWidth={2} />
                    <span className="min-w-0">{label}</span>
                  </span>
                  {count !== null ? (
                    <span className={`text-base font-semibold leading-none tabular-nums ${stale ? "text-ink-300" : "text-ink-100"}`}>
                      {formatCount(count)}
                    </span>
                  ) : data ? (
                    <span className="text-xs text-ink-400">Not reported</span>
                  ) : state.kind === "loading" ? (
                    <Pending />
                  ) : (
                    <span className="text-xs text-ink-400">{unavailableText}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {data && data.freshness && data.protectedAssets !== null && (
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              Freshness counts are reported separately and may not add up to the protected asset count.
            </p>
          )}
        </div>

        <BackupJobOutcomes
          outcomes={data?.jobOutcomes ?? null}
          stale={stale}
          fallback={
            data ? (
              <span className="text-xs text-ink-400">Not reported</span>
            ) : state.kind === "loading" ? (
              <Pending />
            ) : (
              <span className="text-xs text-ink-400">{unavailableText}</span>
            )
          }
        />

        <BackupFooter state={state} onRetry={onRetry} />
      </div>
    </DashboardPanel>
  );
}

function Pending() {
  return (
    <>
      <span aria-hidden className="h-4 w-8 animate-pulse rounded bg-ink-700" />
      <span className="sr-only">Loading</span>
    </>
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

function BackupFooter({ state, onRetry }: { state: BackupHealthState; onRetry: () => void }) {
  switch (state.kind) {
    case "loading":
      return null;
    case "unavailable":
      return (
        <Notice tone="text-amber-signal" icon={Info} title="Backup integration not connected">
          Protected assets, backup freshness and job outcomes will appear once Datto Endpoint Backup is connected. This does not
          indicate whether endpoints are backed up.
        </Notice>
      );
    case "empty":
      return (
        <Notice tone="text-ink-300" icon={Info} title="No backup data reported yet">
          The backup provider has not reported data for this view. This does not indicate whether endpoints are backed
          up.
        </Notice>
      );
    case "error":
      return (
        <Notice tone="text-red-400" icon={AlertTriangle} title="Could not load backup health">
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
            Stale data. Backup counts may be out of date.{" "}
            <SyncDetails lastSyncedAt={state.lastSyncedAt} source={state.source} />
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
