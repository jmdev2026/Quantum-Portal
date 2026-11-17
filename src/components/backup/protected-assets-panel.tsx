"use client";

import { FlaskConical, HardDrive, ShieldQuestion } from "lucide-react";
import { BackupPlannedList, BackupSectionFrame, BackupStateMessage, type BackupBadgeTone } from "@/components/backup/backup-section-frame";
import {
  PROTECTED_ASSETS_DISCLOSURE,
  PROTECTED_ASSETS_PLANNED,
  PROTECTED_ASSETS_PLANNED_LABEL,
  PROTECTION_LABEL,
  protectedAssetsView,
  type ProtectedAssetsStatus,
} from "@/components/backup/protected-assets-view";
import { useBackupAssets } from "@/components/backup/use-backup-assets";
import type { BackupSection } from "@/components/backup/backup-view";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { BackupAsset } from "@/services/backup-assets";

const badgeTone: Record<ProtectedAssetsStatus, BackupBadgeTone> = {
  "not-connected": "amber",
  loading: "neutral",
  simulated: "amber",
  "demo-empty": "amber",
  error: "red",
};

type Props = { section: BackupSection; mode: DashboardMode; scopeLabel: string; delay: number };

export function ProtectedAssetsPanel({ section, mode, scopeLabel, delay }: Props) {
  const state = useBackupAssets();
  const view = protectedAssetsView(state, scopeLabel);

  return (
    <BackupSectionFrame
      id={section.id}
      icon={HardDrive}
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
            data-assets-disclosure
            className="mt-4 flex items-start gap-2 rounded-lg border border-amber-signal/25 bg-amber-signal/5 px-3 py-2.5 text-xs leading-relaxed text-ink-300"
          >
            <FlaskConical aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-signal" strokeWidth={2} />
            <span>{PROTECTED_ASSETS_DISCLOSURE}</span>
          </p>
          <ul aria-label="Example protected assets" className="mt-3 grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {view.records.map((record, index) => (
              <AssetRow key={record.id} record={record} index={index} />
            ))}
          </ul>
          <p data-assets-source className="mt-3 text-xs text-ink-350">
            <span className="text-ink-300">Source: </span>
            <span className="font-mono">{view.records[0].source}</span>
          </p>
        </>
      ) : (
        <>
          <BackupStateMessage status={view.status} title={view.title} body={view.body} marker="assets" />
          <BackupPlannedList id="protected-assets-planned" label={PROTECTED_ASSETS_PLANNED_LABEL} items={PROTECTED_ASSETS_PLANNED} />
        </>
      )}
    </BackupSectionFrame>
  );
}

function AssetRow({ record, index }: { record: BackupAsset; index: number }) {
  return (
    <li
      data-asset={record.id}
      data-customer-id={record.customerId}
      style={{ animationDelay: `${index * 40}ms` }}
      className="flex min-w-0 motion-safe:animate-slide-up flex-col rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3.5"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <HardDrive aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" strokeWidth={1.75} />
        <div className="min-w-0">
          <p className="break-words text-sm font-medium leading-snug text-ink-100">
            {record.name}
            <span className="sr-only"> (fictional example)</span>
          </p>
          <p className="mt-0.5 break-words text-xs text-ink-350">
            <span className="text-ink-300">Customer: </span>
            {record.customerName}
          </p>
        </div>
      </div>
      <p className="mt-2 break-words text-sm leading-relaxed text-ink-300">{record.visibilityNote}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pt-3">
        <span
          data-protection={record.protectionState}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-signal/30 bg-amber-signal/10 px-2 py-0.5 text-[11px] font-medium text-amber-signal"
        >
          <ShieldQuestion aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {PROTECTION_LABEL}
        </span>
        <span className="min-w-0 break-words font-mono text-[10px] uppercase tracking-wider text-ink-350">{record.source}</span>
      </div>
    </li>
  );
}
