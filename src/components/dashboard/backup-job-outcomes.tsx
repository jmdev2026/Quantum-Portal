import type { LucideIcon } from "lucide-react";
import { CircleAlert, CircleCheck, CircleDashed, CircleX } from "lucide-react";
import type { ReactNode } from "react";
import {
  JOB_OUTCOMES,
  OUTCOME_BASES,
  OUTCOME_PERIODS,
  type JobOutcome,
  type JobOutcomes,
} from "@/services/backup-health";

const outcomeDisplay: Record<JobOutcome, { icon: LucideIcon; tone: string; description: string }> = {
  successful: { icon: CircleCheck, tone: "text-shield-400", description: "Reported as completed" },
  partially_successful: { icon: CircleAlert, tone: "text-amber-signal", description: "Reported as partially completed" },
  degraded_or_failed: { icon: CircleX, tone: "text-red-400", description: "Includes degraded and failed results" },
  not_available: { icon: CircleDashed, tone: "text-ink-400", description: "No outcome provided, not a failure" },
};

const formatCount = (value: number) => new Intl.NumberFormat().format(value);
const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

type Props = { outcomes: JobOutcomes | null; fallback: ReactNode; stale: boolean };

export function BackupJobOutcomes({ outcomes, fallback, stale }: Props) {
  return (
    <div data-section="job-outcomes" className="@container">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Backup Job Outcomes</h3>
        {outcomes && (
          <span
            data-period={outcomes.period}
            className="rounded-full border border-shield-500/30 bg-shield-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-shield-300"
          >
            {OUTCOME_PERIODS[outcomes.period]}
          </span>
        )}
      </div>

      <ul className="mt-2 grid grid-cols-1 gap-2 @2xs:grid-cols-2">
        {JOB_OUTCOMES.map(({ key, label }) => {
          const { icon: Icon, tone, description } = outcomeDisplay[key];
          const count = outcomes ? outcomes.counts[key] : null;
          return (
            <li
              key={key}
              data-outcome={key}
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-ink-800 bg-ink-950/40 px-3 py-3"
            >
              <span className="flex min-w-0 items-start gap-2 text-sm font-medium text-ink-100">
                <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} strokeWidth={2} />
                <span className="min-w-0">
                  {label}
                  <span className="block text-[11px] font-normal leading-snug text-ink-300">{description}</span>
                </span>
              </span>
              <span data-value className="flex min-h-6 items-end">
                {count !== null ? (
                  <span className={`text-xl font-semibold leading-none tabular-nums ${stale ? "text-ink-300" : "text-ink-100"}`}>
                    {formatCount(count)}
                  </span>
                ) : outcomes ? (
                  <span className="text-xs text-ink-300">Not reported</span>
                ) : (
                  fallback
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {outcomes && (
        <div data-basis={outcomes.basis} className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-ink-300">
          <p>
            Counted as: <span className="font-medium text-ink-300">{OUTCOME_BASES[outcomes.basis]}</span>
          </p>
          {outcomes.windowStart && outcomes.windowEnd && (
            <p>
              Window: <time dateTime={outcomes.windowStart}>{formatTimestamp(outcomes.windowStart)}</time> –{" "}
              <time dateTime={outcomes.windowEnd}>{formatTimestamp(outcomes.windowEnd)}</time>
            </p>
          )}
          <p>Reported separately from protected assets and freshness. No success rate is calculated.</p>
        </div>
      )}
    </div>
  );
}
