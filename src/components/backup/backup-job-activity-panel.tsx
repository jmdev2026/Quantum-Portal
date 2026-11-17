"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, CircleAlert, CircleCheck, CircleHelp, CircleX, FlaskConical } from "lucide-react";
import { BackupPlannedList, BackupSectionFrame, BackupStateMessage, type BackupBadgeTone } from "@/components/backup/backup-section-frame";
import {
  JOB_ACTIVITY_DISCLOSURE,
  JOB_ACTIVITY_PLANNED,
  JOB_ACTIVITY_PLANNED_LABEL,
  jobActivityView,
  type JobActivityStatus,
} from "@/components/backup/backup-job-activity-view";
import { useBackupJobActivity } from "@/components/backup/use-backup-job-activity";
import type { BackupSection } from "@/components/backup/backup-view";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { JOB_OUTCOMES, type JobOutcome } from "@/services/backup-health";
import type { BackupJob } from "@/services/backup-job-activity";

const badgeTone: Record<JobActivityStatus, BackupBadgeTone> = {
  "not-connected": "amber",
  loading: "neutral",
  simulated: "amber",
  "demo-empty": "amber",
  error: "red",
};

// Muted pills: the colour hints at the category without suggesting provider-verified status.
const outcomeDisplay: Record<JobOutcome, { icon: LucideIcon; tone: string }> = {
  successful: { icon: CircleCheck, tone: "text-shield-300" },
  partially_successful: { icon: CircleAlert, tone: "text-amber-signal" },
  degraded_or_failed: { icon: CircleX, tone: "text-red-300" },
  not_available: { icon: CircleHelp, tone: "text-ink-300" },
};

const outcomeLabel = (outcome: JobOutcome) => JOB_OUTCOMES.find((item) => item.key === outcome)?.label ?? "Not Available";

type Props = { section: BackupSection; mode: DashboardMode; scopeLabel: string; delay: number };

export function BackupJobActivityPanel({ section, mode, scopeLabel, delay }: Props) {
  const state = useBackupJobActivity();
  const view = jobActivityView(state, scopeLabel);

  return (
    <BackupSectionFrame
      id={section.id}
      icon={Activity}
      title={section.title}
      description={section.description}
      badge={view.badge}
      badgeTone={badgeTone[view.status]}
      mode={mode}
      state={view.status}
      busy={view.status === "loading"}
      scopeLabel={scopeLabel}
      delay={delay}
    >
      {view.status === "simulated" ? (
        <>
          <p
            data-jobs-disclosure
            className="mt-4 flex items-start gap-2 rounded-lg border border-amber-signal/25 bg-amber-signal/5 px-3 py-2.5 text-xs leading-relaxed text-ink-300"
          >
            <FlaskConical aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-signal" strokeWidth={2} />
            <span>{JOB_ACTIVITY_DISCLOSURE}</span>
          </p>
          <ul aria-label="Example backup jobs" className="mt-3 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800 bg-ink-950/40">
            {view.records.map((record, index) => (
              <JobRow key={record.id} record={record} index={index} />
            ))}
          </ul>
        </>
      ) : (
        <>
          <BackupStateMessage status={view.status} title={view.title} body={view.body} marker="jobs" />
          <BackupPlannedList id="backup-job-activity-planned" label={JOB_ACTIVITY_PLANNED_LABEL} items={JOB_ACTIVITY_PLANNED} />
        </>
      )}
    </BackupSectionFrame>
  );
}

function JobRow({ record, index }: { record: BackupJob; index: number }) {
  const { icon: Icon, tone } = outcomeDisplay[record.outcome];
  return (
    <li
      data-job={record.id}
      data-customer-id={record.customerId}
      data-outcome={record.outcome}
      style={{ animationDelay: `${index * 40}ms` }}
      className="grid min-w-0 motion-safe:animate-slide-up gap-x-6 gap-y-2 px-4 py-3.5 @3xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] @3xl:items-start"
    >
      <div className="min-w-0 @3xl:col-start-1 @3xl:row-start-1">
        <p className="break-words text-sm font-medium leading-snug text-ink-100">
          {record.title}
          <span className="sr-only"> (fictional example)</span>
        </p>
        <p className="mt-0.5 break-words text-xs text-ink-350">
          <span className="text-ink-300">Customer: </span>
          {record.customerName}
        </p>
      </div>
      <span
        data-outcome-badge
        className="inline-flex items-center gap-1.5 justify-self-start whitespace-nowrap rounded-full border border-ink-700 bg-ink-900/80 px-2.5 py-0.5 text-[11px] font-medium text-ink-100 @3xl:col-start-3 @3xl:row-start-1 @3xl:justify-self-end"
      >
        <Icon aria-hidden className={`h-3.5 w-3.5 shrink-0 ${tone}`} strokeWidth={2} />
        <span className="sr-only">Example outcome: </span>
        {outcomeLabel(record.outcome)}
      </span>
      <div className="min-w-0 @3xl:col-start-2 @3xl:row-start-1">
        <p className="break-words text-sm leading-relaxed text-ink-300">{record.description}</p>
        <p className="mt-1 break-words font-mono text-[10px] uppercase tracking-wider text-ink-350">
          <span className="sr-only">Source: </span>
          {record.source}
        </p>
      </div>
    </li>
  );
}
