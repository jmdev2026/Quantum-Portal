"use client";

import type { LucideIcon } from "lucide-react";
import { Fingerprint, Laptop, UserRound } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  VISIBILITY_AREAS,
  identitiesEndpointsAnnouncement,
  visibilityAreaView,
  type VisibilityAreaId,
} from "@/components/security/identities-endpoints-view";
import { SECURITY_SECTIONS, securityScopeLabel } from "@/components/security/security-overview-view";
import { VisibilityAreaCard } from "@/components/security/visibility-area-card";

const section = SECURITY_SECTIONS.find((entry) => entry.id === "identities-endpoints")!;

const areaIcons: Record<VisibilityAreaId, LucideIcon> = {
  identities: UserRound,
  endpoints: Laptop,
};

export function IdentitiesEndpointsPanel() {
  const { view, selectedCustomer } = useCustomerView();
  const { mode } = useDashboardMode();
  const scopeLabel = securityScopeLabel(view.mode, selectedCustomer?.name);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      data-mode={mode}
      style={{ animationDelay: "200ms" }}
      className="flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition-colors duration-300 hover:border-ink-600 sm:p-6 md:col-span-2"
    >
      <header className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <Fingerprint aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id={`${section.id}-title`} className="text-base font-semibold leading-tight text-ink-100">
              {section.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{section.description}</p>
          </div>
        </div>
        <p data-visibility-scope className="min-w-0 shrink-0 break-words text-xs text-ink-350 sm:pt-1">
          <span className="text-ink-300">Scope: </span>
          <span className="font-medium text-shield-300">{scopeLabel}</span>
        </p>
      </header>

      <p role="status" className="sr-only">
        {identitiesEndpointsAnnouncement(mode, scopeLabel)}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {VISIBILITY_AREAS.map((area) => (
          <VisibilityAreaCard key={area.id} area={area} icon={areaIcons[area.id]} view={visibilityAreaView(mode, area, scopeLabel)} />
        ))}
      </div>
    </section>
  );
}
