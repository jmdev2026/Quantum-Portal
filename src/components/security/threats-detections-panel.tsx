"use client";

import { AlertTriangle, FlaskConical, Info, LoaderCircle, PlugZap, Radar } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { DetectionFeed } from "@/components/security/detection-feed";
import { SECURITY_SECTIONS, securityScopeLabel } from "@/components/security/security-overview-view";
import {
  DETECTION_DISPLAY_FIELDS,
  DETECTIONS_SEPARATION_NOTICE,
  detectionFeedView,
  toDetectionDisplayItem,
  type DetectionFeedStatus,
} from "@/components/security/threats-detections-view";
import { useSecurityDetections } from "@/components/security/use-security-detections";

const section = SECURITY_SECTIONS.find((entry) => entry.id === "threats-detections")!;

const badgeTone: Record<DetectionFeedStatus, string> = {
  "not-connected": "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  loading: "border-ink-700 bg-ink-800/80 text-ink-300",
  simulated: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  "demo-empty": "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  error: "border-red-400/30 bg-red-400/10 text-red-300",
};

const emptyIcon: Record<Exclude<DetectionFeedStatus, "simulated">, { icon: typeof PlugZap; tone: string }> = {
  "not-connected": { icon: PlugZap, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  loading: { icon: LoaderCircle, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  "demo-empty": { icon: FlaskConical, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  error: { icon: AlertTriangle, tone: "border-red-400/30 bg-red-400/10 text-red-300" },
};

export function ThreatsDetectionsPanel() {
  const { view, selectedCustomer } = useCustomerView();
  const { state, simulated } = useSecurityDetections();
  const scopeLabel = securityScopeLabel(view.mode, selectedCustomer?.name);
  const feed = detectionFeedView(state, scopeLabel);
  const items = state.kind === "ready" ? state.detections.map(toDetectionDisplayItem) : [];
  const showRecords = feed.status === "simulated";

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      aria-busy={feed.status === "loading"}
      data-mode={simulated ? "demo" : "live"}
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

      {simulated && feed.status !== "loading" && (
        <p data-simulated className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
          <FlaskConical aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Simulated data · fictional example detections
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
          items={showRecords ? items : []}
          empty={feed.status === "simulated" ? null : <FeedMessage status={feed.status} title={feed.emptyTitle} body={feed.emptyBody} />}
        />

        {showRecords ? (
          <p data-separation-notice className="flex items-start gap-1.5 border-t border-ink-800 px-4 py-3 text-xs leading-relaxed text-ink-350">
            <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" strokeWidth={2} />
            <span>
              {DETECTIONS_SEPARATION_NOTICE} <span className="text-ink-300">Source:</span>{" "}
              <span className="font-mono">{items[0]?.sourceLabel}</span>
            </span>
          </p>
        ) : (
          feed.status === "not-connected" && (
            <div className="border-t border-ink-800 px-4 py-3">
              <p id={`${section.id}-fields`} className="text-xs text-ink-350">
                Once connected, each detection will show:
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
          )
        )}
      </div>
    </section>
  );
}

function FeedMessage({ status, title, body }: { status: Exclude<DetectionFeedStatus, "simulated">; title: string; body: string }) {
  const { icon: Icon, tone } = emptyIcon[status];
  return (
    <div data-feed-empty className="flex flex-col items-start gap-3 px-4 py-5 sm:flex-row sm:gap-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
        <Icon
          aria-hidden
          className={`h-4 w-4 ${status === "loading" ? "motion-safe:animate-spin" : ""}`}
          strokeWidth={2}
        />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-100">{title}</p>
        <p className={`mt-1 max-w-2xl break-words text-sm leading-relaxed ${status === "error" ? "text-red-300" : "text-ink-350"}`}>
          {body}
        </p>
      </div>
    </div>
  );
}
