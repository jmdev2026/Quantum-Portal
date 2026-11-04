import type { LucideIcon } from "lucide-react";

type DashboardPanelProps = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status: { label: string; tone: "pending" | "disconnected" };
  className?: string;
  children: React.ReactNode;
};

const toneStyles = {
  pending: "border-ink-700 bg-ink-800/80 text-ink-300",
  disconnected: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
};

export function DashboardPanel({ id, icon: Icon, title, description, status, className = "", children }: DashboardPanelProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`flex min-w-0 flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition-colors duration-300 hover:border-ink-600 sm:p-6 ${className}`}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-base font-semibold leading-tight text-ink-100">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-400">{description}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${toneStyles[status.tone]}`}
        >
          {status.label}
        </span>
      </header>
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}
