import type { LucideIcon } from "lucide-react";
import { CircleDashed } from "lucide-react";

type IntegrationCardProps = {
  icon: LucideIcon;
  title: string;
  provider: string;
  description: string;
  capabilities: string[];
  delay?: string;
};

export function IntegrationCard({
  icon: Icon,
  title,
  provider,
  description,
  capabilities,
  delay,
}: IntegrationCardProps) {
  return (
    <article
      style={{ animationDelay: delay }}
      className="group relative flex animate-rise flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/80 p-6 transition-colors duration-300 hover:border-shield-500/40 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-shield-500/0 blur-3xl transition-colors duration-500 group-hover:bg-shield-500/10"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-shield-400 transition-transform duration-300 group-hover:-translate-y-0.5">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-signal/30 bg-amber-signal/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-amber-signal">
          <CircleDashed className="h-3.5 w-3.5" />
          Not connected
        </span>
      </div>

      <h2 className="mt-6 text-xl font-semibold leading-tight text-ink-100 sm:text-2xl">{title}</h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-400">
        {provider} integration planned
      </p>
      <p className="mt-4 leading-relaxed text-ink-300">{description}</p>

      <ul className="mt-6 space-y-2 border-t border-ink-700 pt-6">
        {capabilities.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm text-ink-300">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-600" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
