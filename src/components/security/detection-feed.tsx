import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { DetectionDisplayItem } from "@/components/security/threats-detections-view";
import type { SeverityLevel } from "@/services/security-severity";

const severityStyles: Record<SeverityLevel, { label: string; icon: LucideIcon; tone: string }> = {
  critical: { label: "Critical", icon: OctagonAlert, tone: "border-red-400/30 bg-red-400/10 text-red-300" },
  high: { label: "High", icon: TriangleAlert, tone: "border-orange-400/30 bg-orange-400/10 text-orange-300" },
  medium: { label: "Medium", icon: CircleAlert, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  low: { label: "Low", icon: Info, tone: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
};

export function DetectionFeed({ items, empty }: { items: readonly DetectionDisplayItem[]; empty: ReactNode }) {
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul aria-label="Example detections" className="divide-y divide-ink-800">
      {items.map((item) => (
        <DetectionRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function DetectionRow({ item }: { item: DetectionDisplayItem }) {
  const severity = severityStyles[item.severity];
  const Icon = severity.icon;
  return (
    <li
      data-detection={item.id}
      data-customer-id={item.customerId}
      className="flex min-w-0 flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4"
    >
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${severity.tone}`}
      >
        <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="sr-only">Severity: </span>
        {severity.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium leading-snug text-ink-100">
          {item.title}
          <span className="sr-only"> (fictional example)</span>
        </p>
        <p className="mt-1 break-words text-sm leading-relaxed text-ink-350">{item.summary}</p>
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-350">
          <span>
            <span className="text-ink-300">Customer: </span>
            <span className="break-words">{item.scopeLabel}</span>
          </span>
          <span>
            <span className="text-ink-300">Source: </span>
            <span className="font-mono">{item.sourceLabel}</span>
          </span>
        </p>
      </div>
    </li>
  );
}
