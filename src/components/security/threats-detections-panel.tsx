"use client";

import { FlaskConical, PlugZap, Radar } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { DetectionFeed } from "@/components/security/detection-feed";
import { SECURITY_SECTIONS, securityScopeLabel } from "@/components/security/security-overview-view";
import { DETECTION_DISPLAY_FIELDS, detectionFeedView } from "@/components/security/threats-detections-view";

const section = SECURITY_SECTIONS.find((entry) => entry.id === "threats-detections")!;

const badgeTone = {
  "not-connected": "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  "demo-placeholder": "border-ink-700 bg-ink-800/80 text-ink-300",
};

export function ThreatsDetectionsPanel() {
  const { mode } = useDashboardMode();
  const { view, selectedCustomer } = useCustomerView();
  const scopeLabel = securityScopeLabel(view.mode, selectedCustomer?.name);
  const feed = detectionFeedView(mode, scopeLabel);
  const demo = feed.status === "demo-placeholder";
  const EmptyIcon = demo ? FlaskConical : PlugZap;

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      data-mode={mode}
      data-state={feed.status}
      style={{ animationDelay: "140ms" }}
      className="flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition-colors duration-300 hover:border-ink-600 sm:p-6 md:col-span-2"
    >
      <header className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <Radar aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id={`${section.id}-title`} className="text-base font-semibold leading-tight text-ink-100">
              {section.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{section.description}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${badgeTone[feed.status]}`}
        >
          {feed.badge}
        </span>
      </header>

      <p role="status" className="sr-only">
        {feed.announcement}
      </p>

      {demo && (
        <p data-simulated className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
          <FlaskConical aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Demonstration only · no detection records
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-ink-800 bg-ink-950/40">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-ink-800 px-4 py-2.5">
          <h3 className="text-sm font-medium text-ink-300">Detection feed</h3>
          <p data-detections-scope className="min-w-0 break-words text-xs text-ink-350">
            <span className="text-ink-300">Scope: </span>
            <span className="font-medium text-shield-300">{scopeLabel}</span>
          </p>
        </div>

        <DetectionFeed
          items={[]}
          empty={
            <div data-feed-empty className="flex flex-col items-start gap-3 px-4 py-5 sm:flex-row sm:gap-4">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  demo ? "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" : "border-ink-700 bg-ink-800 text-ink-300"
                }`}
              >
                <EmptyIcon aria-hidden className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-100">{feed.emptyTitle}</p>
                <p className="mt-1 max-w-2xl break-words text-sm leading-relaxed text-ink-350">{feed.emptyBody}</p>
              </div>
            </div>
          }
        />

        <div className="border-t border-ink-800 px-4 py-3">
          <p id={`${section.id}-fields`} className="text-xs text-ink-350">
            {feed.fieldsIntro}:
          </p>
          <ul aria-labelledby={`${section.id}-fields`} className="mt-2 flex flex-wrap gap-1.5">
            {DETECTION_DISPLAY_FIELDS.map((field) => (
              <li
                key={field}
                className="rounded-md border border-ink-800 bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-350"
              >
                {field}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
