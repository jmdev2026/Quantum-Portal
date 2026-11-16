"use client";

import type { LucideIcon } from "lucide-react";
import { Fingerprint, Gauge, Radar, ShieldCheck } from "lucide-react";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  SECURITY_SECTIONS,
  securitySectionMessage,
  securitySectionStatus,
  type SecuritySectionId,
} from "@/components/security/security-overview-view";

const sectionIcons: Record<SecuritySectionId, LucideIcon> = {
  "security-overview": Gauge,
  "threats-detections": Radar,
  "identities-endpoints": Fingerprint,
  "security-controls": ShieldCheck,
};

const toneStyles = {
  pending: "border-ink-700 bg-ink-800/80 text-ink-300",
  disconnected: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
};

export function SecuritySections() {
  const { mode } = useDashboardMode();
  const status = securitySectionStatus(mode);
  const message = securitySectionMessage(mode);

  return (
    <div className="grid gap-6 md:grid-cols-2" data-mode={mode}>
      {SECURITY_SECTIONS.map((section, index) => {
        const Icon = sectionIcons[section.id];
        return (
          <section
            key={section.id}
            aria-labelledby={`${section.id}-title`}
            style={{ animationDelay: `${80 + index * 60}ms` }}
            className="flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition-colors duration-300 hover:border-ink-600 sm:p-6"
          >
            <header className="flex flex-col-reverse items-start gap-3 xl:flex-row xl:justify-between xl:gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
                  <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <h2 id={`${section.id}-title`} className="text-base font-semibold leading-tight text-ink-100">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-350">{section.description}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${toneStyles[status.tone]}`}
              >
                {status.label}
              </span>
            </header>
            <div
              data-state="empty"
              className="mt-5 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700 bg-ink-950/40 px-4 py-8 text-center"
            >
              <Icon aria-hidden className="h-6 w-6 text-ink-400" strokeWidth={1.5} />
              <p className="text-sm font-medium text-ink-100">{message.title}</p>
              <p className="max-w-sm text-sm leading-relaxed text-ink-350">{message.body}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
