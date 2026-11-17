import type { LucideIcon } from "lucide-react";
import { Ban, CalendarOff, Eye, LifeBuoy, ShieldCheck } from "lucide-react";
import { BackupSectionFrame } from "@/components/backup/backup-section-frame";
import { recoveryInformation, type RecoveryAreaId } from "@/components/backup/recovery-information-view";
import type { BackupSection } from "@/components/backup/backup-view";
import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";

const areaIcon: Record<RecoveryAreaId, LucideIcon> = {
  "recovery-visibility": Eye,
  "recovery-points": CalendarOff,
  "restore-operations": Ban,
  "integration-verification": ShieldCheck,
};

type Props = { section: BackupSection; mode: DashboardMode; scopeLabel: string; delay: number };

export function RecoveryInformationPanel({ section, mode, scopeLabel, delay }: Props) {
  const info = recoveryInformation(mode, scopeLabel);

  return (
    <BackupSectionFrame
      id={section.id}
      icon={LifeBuoy}
      title={section.title}
      description={section.description}
      badge={info.badge}
      mode={mode}
      state={mode === "demo" ? "informational" : "not-connected"}
      scopeLabel={scopeLabel}
      delay={delay}
    >
      <ul aria-label="Recovery information areas" className="mt-4 grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-4">
        {info.areas.map((area) => {
          const Icon = areaIcon[area.id];
          return (
            <li key={area.id} data-recovery-area={area.id} className="flex min-w-0 flex-col rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon aria-hidden className="h-4 w-4 shrink-0 text-ink-300" strokeWidth={1.75} />
                <h3 className="min-w-0 break-words text-sm font-medium leading-snug text-ink-100">{area.title}</h3>
              </div>
              <p className="mt-2 break-words text-sm leading-relaxed text-ink-300">{area.body}</p>
              <p data-recovery-status className="mt-auto pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-350">
                <span className="sr-only">Status: </span>
                {area.status}
              </p>
            </li>
          );
        })}
      </ul>
    </BackupSectionFrame>
  );
}
