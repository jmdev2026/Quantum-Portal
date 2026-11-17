"use client";

import { Activity, DatabaseBackup, FlaskConical, HardDrive, LifeBuoy, PlugZap, ShieldAlert, type LucideIcon } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  BACKUP_SECTIONS,
  RECOVERY_DISCLAIMER,
  backupAnnouncement,
  backupSectionState,
  type BackupSection,
  type BackupSectionId,
  type BackupSectionState,
} from "@/components/backup/backup-view";
import { securityScopeLabel } from "@/components/security/security-overview-view";

const sectionIcons: Record<BackupSectionId, LucideIcon> = {
  "backup-overview": DatabaseBackup,
  "protected-assets": HardDrive,
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
      {BACKUP_SECTIONS.map((section, index) => (
        <BackupSectionCard
          key={section.id}
          section={section}
          state={state}
          demo={mode === "demo"}
          scopeLabel={scopeLabel}
          delay={60 + index * 60}
        />
      ))}
    </div>
  );
}

function BackupSectionCard({
  section,
  state,
  demo,
  scopeLabel,
  delay,
}: {
  section: BackupSection;
  state: BackupSectionState;
  demo: boolean;
  scopeLabel: string;
  delay: number;
}) {
  const Icon = sectionIcons[section.id];
  const StateIcon = demo ? FlaskConical : PlugZap;
  const recovery = section.id === "recovery-information";

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      data-backup-section={section.id}
      data-mode={demo ? "demo" : "live"}
      style={{ animationDelay: `${delay}ms` }}
      className="flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 sm:p-6"
    >
      <header className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id={`${section.id}-title`} className="text-base font-semibold leading-tight text-ink-100">
              {section.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{section.description}</p>
          </div>
        </div>
        <span
          data-backup-badge
          className="shrink-0 rounded-full border border-amber-signal/30 bg-amber-signal/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap text-amber-signal"
        >
          {state.badge}
        </span>
      </header>

      <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-950/40">
        <p data-backup-scope className="min-w-0 break-words border-b border-ink-800 px-4 py-2.5 text-xs text-ink-350">
          <span className="text-ink-300">Scope: </span>
          <span className="font-medium text-shield-300">{scopeLabel}</span>
        </p>

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
    </section>
  );
}
