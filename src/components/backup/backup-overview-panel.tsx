"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CircleCheck,
  CircleOff,
  Clock3,
  DatabaseBackup,
  FlaskConical,
  HardDrive,
  Hourglass,
  LoaderCircle,
  PlugZap,
  RotateCw,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { BackupSectionFrame, type BackupBadgeTone } from "@/components/backup/backup-section-frame";
import {
  FRESHNESS_SEPARATE_NOTE,
  OUTCOMES_DEMO_NOTE,
  backupOverviewView,
  type BackupOverviewStatus,
} from "@/components/backup/backup-overview-view";
import { BackupJobOutcomes } from "@/components/dashboard/backup-job-outcomes";
import { useBackupHealth } from "@/components/dashboard/use-backup-health";
import { FRESHNESS_BUCKETS, OUTCOME_BASES, OUTCOME_PERIODS, type BackupHealthState, type FreshnessBucket } from "@/services/backup-health";

const bucketDisplay: Record<FreshnessBucket, { icon: LucideIcon; tone: string }> = {
  less_than_1_hour: { icon: CircleCheck, tone: "text-shield-400" },
  "1_to_3_hours": { icon: Clock3, tone: "text-shield-300" },
  "4_to_24_hours": { icon: Hourglass, tone: "text-amber-signal" },
  more_than_24_hours: { icon: AlertTriangle, tone: "text-orange-400" },
  no_successful_backup: { icon: CircleOff, tone: "text-red-400" },
};

const badgeTone: Record<BackupOverviewStatus, BackupBadgeTone> = {
  loading: "neutral",
  simulated: "amber",
  reported: "neutral",
  stale: "amber",
  "not-connected": "amber",
  empty: "neutral",
  error: "red",
};

const availabilityIcon: Record<BackupOverviewStatus, LucideIcon> = {
  loading: LoaderCircle,
  simulated: FlaskConical,
  reported: DatabaseBackup,
  stale: Clock3,
  "not-connected": PlugZap,
  empty: DatabaseBackup,
  error: AlertTriangle,
};

const unavailableText: Partial<Record<BackupHealthState["kind"], string>> = {
  unavailable: "Not connected",
  empty: "No data yet",
  error: "Unavailable",
};

type BackupData = Extract<BackupHealthState, { kind: "ready" | "stale" }>;
const hasData = (state: BackupHealthState): state is BackupData => state.kind === "ready" || state.kind === "stale";
const formatCount = (value: number) => new Intl.NumberFormat().format(value);

export function BackupOverviewPanel({ scopeLabel, delay }: { scopeLabel: string; delay: number }) {
  const { state, simulated, retry } = useBackupHealth();
  const view = backupOverviewView(state, simulated, scopeLabel);
  const data = hasData(state) ? state : null;
  const stale = state.kind === "stale";
  // Reporting-window times are never shown on this page.
  const outcomes = data?.jobOutcomes ? { ...data.jobOutcomes, windowStart: null, windowEnd: null } : null;
  const contentRef = useRef<HTMLDivElement>(null);
  // The Retry button unmounts while reloading, so keep keyboard focus inside the section.
  const onRetry = () => {
    contentRef.current?.focus();
    retry();
  };

  const fallback = (short = false): ReactNode =>
    state.kind === "loading" ? (
      <Pending />
    ) : data ? (
      <span className="text-xs text-ink-300">Not reported</span>
    ) : (
      <span className="text-xs text-ink-300">{state.kind === "unavailable" && !short ? "Awaiting integration" : unavailableText[state.kind]}</span>
    );

  return (
    <BackupSectionFrame
      id="backup-overview"
      icon={DatabaseBackup}
      title="Backup Overview"
      description="Summary of endpoint backup reporting for the selected scope."
      badge={view.badge}
      badgeTone={badgeTone[view.status]}
      mode={simulated ? "demo" : "live"}
      state={view.status}
      busy={state.kind === "loading"}
      scopeLabel={scopeLabel}
      delay={delay}
      className="md:col-span-2"
    >
      <div ref={contentRef} tabIndex={-1} className="mt-4 grid gap-4 outline-none @2xl:grid-cols-2 @5xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div data-metric="protected-assets" className="rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-4">
            <p className="flex items-center gap-2.5 text-sm font-medium text-ink-100">
              <HardDrive aria-hidden className="h-4 w-4 shrink-0 text-shield-400" strokeWidth={1.75} />
              Protected assets
            </p>
            <div data-value className="mt-3 flex min-h-9 items-end">
              {data?.protectedAssets != null ? (
                <span className={`text-4xl font-semibold leading-none tabular-nums ${stale ? "text-ink-300" : "text-ink-100"}`}>
                  {simulated && <span className="sr-only">Simulated: </span>}
                  {formatCount(data.protectedAssets)}
                </span>
              ) : (
                fallback()
              )}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-300">
              Endpoint assets reported to the backup system. Not the same as the Dashboard&apos;s device count.
            </p>
          </div>

          <Availability view={view} data={data} simulated={simulated} onRetry={state.kind === "error" ? onRetry : null} />
        </div>

        <div data-section="freshness" className="min-w-0">
          <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Last successful backup</h3>
          <ul className="mt-2 flex flex-col divide-y divide-ink-800 rounded-xl border border-ink-800 bg-ink-950/40">
            {FRESHNESS_BUCKETS.map(({ key, label }) => {
              const { icon: Icon, tone } = bucketDisplay[key];
              const count = data?.freshness ? data.freshness[key] : null;
              return (
                <li key={key} data-bucket={key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
                  <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink-100">
                    <Icon aria-hidden className={`h-4 w-4 shrink-0 ${tone}`} strokeWidth={2} />
                    <span className="min-w-0">{label}</span>
                  </span>
                  {count !== null ? (
                    <span className={`text-base font-semibold leading-none tabular-nums ${stale ? "text-ink-300" : "text-ink-100"}`}>
                      {formatCount(count)}
                    </span>
                  ) : (
                    fallback(true)
                  )}
                </li>
              );
            })}
          </ul>
          {data?.freshness && (
            <p data-freshness-note className="mt-2 text-[11px] leading-relaxed text-ink-300">
              {FRESHNESS_SEPARATE_NOTE}
            </p>
          )}
        </div>

        <div className="min-w-0 @2xl:col-span-2 @5xl:col-span-1">
          <BackupJobOutcomes
            outcomes={outcomes}
            stale={stale}
            simulated={simulated && !!data}
            fallback={fallback(true)}
          />
          {simulated && outcomes && (
            <p data-outcomes-note className="mt-2 text-[11px] leading-relaxed text-amber-signal">
              {OUTCOMES_DEMO_NOTE}
            </p>
          )}
        </div>
      </div>
    </BackupSectionFrame>
  );
}

function Availability({
  view,
  data,
  simulated,
  onRetry,
}: {
  view: ReturnType<typeof backupOverviewView>;
  data: BackupData | null;
  simulated: boolean;
  onRetry: (() => void) | null;
}) {
  const Icon = availabilityIcon[view.status];
  const outcomes = data?.jobOutcomes ?? null;
  const tone =
    view.status === "error" ? "text-red-300" : view.status === "loading" || view.status === "empty" ? "text-ink-300" : "text-amber-signal";

  return (
    <div
      data-availability={view.status}
      role={view.status === "error" ? "alert" : undefined}
      className="rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3"
    >
      <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Reporting availability</h3>
      <p className={`mt-2 flex items-center gap-2 text-sm font-medium ${tone}`}>
        <Icon aria-hidden className={`h-4 w-4 shrink-0 ${view.status === "loading" ? "motion-safe:animate-spin" : ""}`} strokeWidth={2} />
        {view.title}
      </p>
      <p className="mt-1 break-words text-xs leading-relaxed text-ink-300">{view.body}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-2.5 py-1 text-xs text-ink-300 transition-colors hover:border-shield-500/40 hover:text-shield-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400"
        >
          <RotateCw aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
          Retry
        </button>
      )}
      {data && (
        <dl data-measurement className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-ink-800 pt-3 text-xs">
          <dt className="text-ink-300">Source</dt>
          <dd className="min-w-0 break-words font-mono text-ink-100">{data.source ?? "Not provided"}</dd>
          {outcomes && (
            <>
              <dt className="text-ink-300">Outcome period</dt>
              <dd className="min-w-0 break-words text-ink-100">
                {OUTCOME_PERIODS[outcomes.period]}
                {simulated && " · Illustrative"}
              </dd>
              <dt className="text-ink-300">Counted as</dt>
              <dd className="min-w-0 break-words text-ink-100">{OUTCOME_BASES[outcomes.basis]}</dd>
            </>
          )}
          <dt className="text-ink-300">Sync time</dt>
          <dd className="min-w-0 break-words text-ink-100">{simulated ? "None (simulated)" : "Not shown"}</dd>
        </dl>
      )}
    </div>
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
