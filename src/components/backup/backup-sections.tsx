"use client";

import { Activity, FlaskConical, LifeBuoy, PlugZap, ShieldAlert, type LucideIcon } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { BackupOverviewPanel } from "@/components/backup/backup-overview-panel";
import { BackupSectionFrame } from "@/components/backup/backup-section-frame";
import { ProtectedAssetsPanel } from "@/components/backup/protected-assets-panel";
import {
  BACKUP_SECTIONS,
  RECOVERY_DISCLAIMER,
  backupAnnouncement,
  backupSectionState,
  type BackupSection,
  type BackupSectionState,
} from "@/components/backup/backup-view";
import { securityScopeLabel } from "@/components/security/security-overview-view";

const placeholderIcons: Record<"backup-job-activity" | "recovery-information", LucideIcon> = {
  "backup-job-activity": Activity,
  "recovery-information": LifeBuoy,
};

export function BackupSections() {
  const { view, selectedCustomer } = useCustomerView();
  const { mode } = useDashboardMode();
  const scopeLabel = securityScopeLabel(view.mode, selectedCustomer?.name);
  const state = backupSectionState(mode, scopeLabel);

  return (
    <div className="grid gap-6 md:grid-cols-2" data-mode={mode}>
      <p role="status" className="sr-only">
        {backupAnnouncement(mode, scopeLabel)}
      </p>
      {BACKUP_SECTIONS.map((section, index) => {
        const delay = 60 + index * 60;
        switch (section.id) {
          case "backup-overview":
            return <BackupOverviewPanel key={section.id} scopeLabel={scopeLabel} delay={delay} />;
          case "protected-assets":
            return <ProtectedAssetsPanel key={section.id} section={section} mode={mode} scopeLabel={scopeLabel} delay={delay} />;
          default:
            return (
              <PlaceholderSection
                key={section.id}
                section={section}
                icon={placeholderIcons[section.id]}
                state={state}
                demo={mode === "demo"}
                scopeLabel={scopeLabel}
                delay={delay}
              />
            );
        }
      })}
    </div>
  );
}

function PlaceholderSection({
  section,
  icon,
  state,
  demo,
  scopeLabel,
  delay,
}: {
  section: BackupSection;
  icon: LucideIcon;
  state: BackupSectionState;
  demo: boolean;
  scopeLabel: string;
  delay: number;
}) {
  const StateIcon = demo ? FlaskConical : PlugZap;
  const recovery = section.id === "recovery-information";

  return (
    <BackupSectionFrame
      id={section.id}
      icon={icon}
      title={section.title}
      description={section.description}
      badge={state.badge}
      mode={demo ? "demo" : "live"}
      scopeLabel={scopeLabel}
      delay={delay}
    >
      <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-950/40">
        <div data-backup-state className="flex flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:gap-4">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              demo ? "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" : "border-ink-700 bg-ink-800 text-ink-300"
            }`}
          >
            <StateIcon aria-hidden className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-100">{state.title}</p>
            <p className="mt-1 break-words text-sm leading-relaxed text-ink-350">{state.body}</p>
          </div>
        </div>

        {recovery && (
          <p data-recovery-disclaimer className="mx-4 mb-4 flex items-start gap-2 rounded-lg border border-amber-signal/25 bg-amber-signal/5 px-3 py-2.5 text-xs leading-relaxed text-ink-300">
            <ShieldAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-signal" strokeWidth={2} />
            <span>{RECOVERY_DISCLAIMER}</span>
          </p>
        )}

        <div className="mt-auto border-t border-ink-800 px-4 py-3">
          <p id={`${section.id}-planned`} className="text-xs text-ink-350">
            {section.plannedLabel}
          </p>
          <ul aria-labelledby={`${section.id}-planned`} className="mt-2 flex flex-wrap gap-1.5">
            {section.planned.map((item) => (
              <li
                key={item}
                data-planned-item
                className="rounded-md border border-ink-800 bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-350"
              >
                {item}
                {recovery && <span className="text-amber-signal/90"> · planned</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BackupSectionFrame>
  );
}
