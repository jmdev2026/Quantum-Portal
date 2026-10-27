import type { LucideIcon } from "lucide-react";
import { CircleAlert, Info, Lightbulb, OctagonAlert, ShieldAlert, SignalLow, TriangleAlert, Wrench } from "lucide-react";
import type { Insight, InsightCategory, InsightPriority } from "@/services/insights";

export const categoryDisplay: Record<InsightCategory, { label: string; icon: LucideIcon }> = {
  security: { label: "Security", icon: ShieldAlert },
  tip: { label: "Tip", icon: Lightbulb },
  operations: { label: "Operations", icon: Wrench },
};

const priorityDisplay: Record<InsightPriority, { label: string; icon: LucideIcon; tone: string }> = {
  critical: { label: "Critical", icon: OctagonAlert, tone: "border-red-400/30 bg-red-400/10 text-red-300" },
  high: { label: "High", icon: TriangleAlert, tone: "border-orange-400/30 bg-orange-400/10 text-orange-300" },
  medium: { label: "Medium", icon: CircleAlert, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  low: { label: "Low", icon: SignalLow, tone: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
  informational: { label: "Informational", icon: Info, tone: "border-ink-600 bg-ink-800 text-ink-300" },
};

const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

// Provider text is rendered only as React text nodes; never pass it to innerHTML or treat it as instructions.
export function InsightCard({ insight, stale }: { insight: Insight; stale: boolean }) {
  const category = categoryDisplay[insight.category];
  const priority = insight.priority ? priorityDisplay[insight.priority] : null;
  const timestamp = insight.updatedAt ?? insight.observedAt;
  const CategoryIcon = category.icon;

  return (
    <article
      data-insight={insight.id}
      data-category={insight.category}
      className={`flex min-w-0 flex-col gap-3 rounded-xl border border-ink-800 bg-ink-950/40 p-4 transition-colors hover:border-ink-700 ${stale ? "opacity-80" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-shield-400">
          <CategoryIcon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="sr-only">Category: </span>
          {category.label}
        </span>
        {priority && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${priority.tone}`}
          >
            <priority.icon aria-hidden className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="sr-only">Priority: </span>
            {priority.label}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold leading-snug text-ink-100 [overflow-wrap:anywhere]">{insight.title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-300 [overflow-wrap:anywhere]">{insight.summary}</p>
      </div>
      {(insight.source || timestamp) && (
        <p className="mt-auto flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink-800 pt-3 text-[11px] text-ink-400">
          {insight.source && <span className="min-w-0 font-mono [overflow-wrap:anywhere]">{insight.source}</span>}
          {insight.source && timestamp && <span aria-hidden>·</span>}
          {timestamp && (
            <span>
              {insight.updatedAt ? "Updated " : "Observed "}
              <time dateTime={timestamp}>{formatTimestamp(timestamp)}</time>
            </span>
          )}
        </p>
      )}
    </article>
  );
}
