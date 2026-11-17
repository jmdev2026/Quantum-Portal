"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, FlaskConical, HardDrive, LoaderCircle, PlugZap, ShieldQuestion } from "lucide-react";
import { BackupSectionFrame, type BackupBadgeTone } from "@/components/backup/backup-section-frame";
import {
  PROTECTED_ASSETS_DISCLOSURE,
  PROTECTION_LABEL,
  protectedAssetsView,
  type ProtectedAssetsStatus,
  type ProtectedAssetsView,
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

const stateIcon: Record<Exclude<ProtectedAssetsStatus, "simulated">, { icon: LucideIcon; tone: string }> = {
  "not-connected": { icon: PlugZap, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  loading: { icon: LoaderCircle, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  "demo-empty": { icon: FlaskConical, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  error: { icon: AlertTriangle, tone: "border-red-400/30 bg-red-400/10 text-red-300" },
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
      className="md:col-span-2"
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
          <StateMessage view={view} />
          <div className="mt-3">
            <p id="protected-assets-planned" className="text-xs text-ink-350">
              {section.plannedLabel}
            </p>
            <ul aria-labelledby="protected-assets-planned" className="mt-2 flex flex-wrap gap-1.5">
              {section.planned.map((item) => (
                <li
                  key={item}
                  data-planned-item
                  className="rounded-md border border-ink-800 bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-350"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </BackupSectionFrame>
  );
}

function StateMessage({ view }: { view: Exclude<ProtectedAssetsView, { status: "simulated" }> }) {
  const { icon: Icon, tone } = stateIcon[view.status];
  return (
    <div
      data-assets-message
      role={view.status === "error" ? "alert" : undefined}
      className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-ink-700 bg-ink-950/40 px-3.5 py-3"
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${tone}`}>
        <Icon aria-hidden className={`h-3.5 w-3.5 ${view.status === "loading" ? "motion-safe:animate-spin" : ""}`} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-ink-100">{view.title}</p>
        <p className="mt-1 break-words text-sm leading-relaxed text-ink-350">{view.body}</p>
      </div>
    </div>
  );
}

function AssetRow({ record, index }: { record: BackupAsset; index: number }) {
  return (
    <li
      data-asset={record.id}
      data-customer-id={record.customerId}
      style={{ animationDelay: `${index * 40}ms` }}
      className="flex min-w-0 motion-safe:animate-slide-up flex-col rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3.5 transition-colors duration-200 hover:border-ink-700"
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
