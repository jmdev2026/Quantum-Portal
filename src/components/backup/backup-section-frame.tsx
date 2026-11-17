import type { LucideIcon } from "lucide-react";
import { AlertTriangle, FlaskConical, LoaderCircle, PlugZap } from "lucide-react";
import type { ReactNode } from "react";

export type BackupBadgeTone = "amber" | "neutral" | "red";
export type BackupMessageStatus = "not-connected" | "loading" | "demo-empty" | "error";

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

const messageIcon: Record<BackupMessageStatus, { icon: LucideIcon; tone: string }> = {
  "not-connected": { icon: PlugZap, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  loading: { icon: LoaderCircle, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  "demo-empty": { icon: FlaskConical, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  error: { icon: AlertTriangle, tone: "border-red-400/30 bg-red-400/10 text-red-300" },
};

export function BackupStateMessage({ status, title, body, marker }: { status: BackupMessageStatus; title: string; body: string; marker: string }) {
  const { icon: Icon, tone } = messageIcon[status];
  return (
    <div
      data-state-message={marker}
      role={status === "error" ? "alert" : undefined}
      className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-ink-700 bg-ink-950/40 px-3.5 py-3"
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${tone}`}>
        <Icon aria-hidden className={`h-3.5 w-3.5 ${status === "loading" ? "motion-safe:animate-spin" : ""}`} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-ink-100">{title}</p>
        <p className="mt-1 break-words text-sm leading-relaxed text-ink-350">{body}</p>
      </div>
    </div>
  );
}

export function BackupPlannedList({ id, label, items }: { id: string; label: string; items: readonly string[] }) {
  return (
    <div className="mt-3">
      <p id={id} className="text-xs text-ink-350">
        {label}
      </p>
      <ul aria-labelledby={id} className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
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
  );
}
