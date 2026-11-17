import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type BackupBadgeTone = "amber" | "neutral" | "red";

const badgeTones: Record<BackupBadgeTone, string> = {
  amber: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  neutral: "border-ink-700 bg-ink-800/80 text-ink-300",
  red: "border-red-400/30 bg-red-400/10 text-red-300",
};

type Props = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  badgeTone?: BackupBadgeTone;
  mode: "live" | "demo";
  state?: string;
  busy?: boolean;
  scopeLabel: string;
  delay: number;
  className?: string;
  children: ReactNode;
};

export function BackupSectionFrame({
  id,
  icon: Icon,
  title,
  description,
  badge,
  badgeTone = "amber",
  mode,
  state,
  busy,
  scopeLabel,
  delay,
  className = "",
  children,
}: Props) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      aria-busy={busy}
      data-backup-section={id}
      data-mode={mode}
      data-state={state}
      style={{ animationDelay: `${delay}ms` }}
      className={`@container flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 sm:p-6 ${className}`}
    >
      <header className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-base font-semibold leading-tight text-ink-100">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{description}</p>
          </div>
        </div>
        <span
          data-backup-badge
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors duration-200 ${badgeTones[badgeTone]}`}
        >
          {badge}
        </span>
      </header>

      <p data-backup-scope className="mt-4 min-w-0 break-words text-xs text-ink-350">
        <span className="text-ink-300">Scope: </span>
        <span className="font-medium text-shield-300">{scopeLabel}</span>
      </p>

      {children}
    </section>
  );
}
