import type { LucideIcon } from "lucide-react";
import { FlaskConical, PlugZap } from "lucide-react";
import type { VisibilityArea, VisibilityAreaStatus, VisibilityAreaView } from "@/components/security/identities-endpoints-view";

const badgeTone: Record<VisibilityAreaStatus, string> = {
  "not-connected": "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  "demo-placeholder": "border-ink-700 bg-ink-800/80 text-ink-300",
};

const stateIcon: Record<VisibilityAreaStatus, { icon: LucideIcon; tone: string }> = {
  "not-connected": { icon: PlugZap, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  "demo-placeholder": { icon: FlaskConical, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
};

export function VisibilityAreaCard({ area, icon: Icon, view }: { area: VisibilityArea; icon: LucideIcon; view: VisibilityAreaView }) {
  const { icon: StateIcon, tone } = stateIcon[view.status];
  const titleId = `visibility-${area.id}-title`;

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-area={area.id}
      data-state={view.status}
      className="flex min-w-0 flex-col rounded-xl border border-ink-800 bg-ink-950/40 p-4 transition-colors duration-200 hover:border-ink-700 sm:p-5"
    >
      <div className="flex flex-col-reverse items-start gap-3 xl:flex-row xl:justify-between xl:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-shield-400">
            <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 id={titleId} className="text-sm font-semibold leading-tight text-ink-100">
              {area.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{area.description}</p>
          </div>
        </div>
        <span
          data-area-badge
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${badgeTone[view.status]}`}
        >
          {view.badge}
        </span>
      </div>

      <div data-area-message className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-ink-700 bg-ink-900/60 px-3.5 py-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${tone}`}>
          <StateIcon aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-ink-100">{view.title}</p>
          <p className="mt-1 break-words text-sm leading-relaxed text-ink-350">{view.body}</p>
        </div>
      </div>

      {view.status === "not-connected" && (
        <div className="mt-3">
          <p id={`visibility-${area.id}-fields`} className="text-xs text-ink-350">
            Once connected, each {area.noun} will show:
          </p>
          <ul aria-labelledby={`visibility-${area.id}-fields`} className="mt-2 flex flex-wrap gap-1.5">
            {area.fields.map((field) => (
              <li
                key={field}
                className="rounded-md border border-ink-800 bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-350"
              >
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
