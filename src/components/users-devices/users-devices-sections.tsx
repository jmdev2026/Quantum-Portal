"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock, FlaskConical, Info, Laptop, LoaderCircle, MonitorSmartphone, PlugZap, RotateCw, UserRound, Users } from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { useAssetSummary } from "@/components/dashboard/use-asset-summary";
import { securityScopeLabel } from "@/components/security/security-overview-view";
import { useVisibilityRecords } from "@/components/security/use-visibility-records";
import { RecordRow } from "@/components/security/visibility-area-card";
import {
  RECORD_SECTIONS,
  SUMMARY_DEFINITION,
  SUMMARY_LABELS,
  SUMMARY_METRIC_KEYS,
  recordSectionView,
  summaryCardView,
  usersDevicesAnnouncement,
  type RecordSection,
  type RecordSectionView,
  type SummaryCardView,
  type SummaryMetricKey,
} from "@/components/users-devices/users-devices-view";
import type { VisibilityRecordsState } from "@/services/security-visibility-records";

const panel = "flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 sm:p-6";
const summaryIcons: Record<SummaryMetricKey, LucideIcon> = { users: Users, devices: MonitorSmartphone };
const sectionIcons: Record<RecordSection["kind"], LucideIcon> = { identities: UserRound, endpoints: Laptop };

export function UsersDevicesSections() {
  const { view, selectedCustomer } = useCustomerView();
  const { mode } = useDashboardMode();
  const scopeLabel = mode === "live" ? "Live customer data unavailable" : securityScopeLabel(view.mode, selectedCustomer?.name);
  const summary = useAssetSummary();
  const records = { identities: useVisibilityRecords("identities"), endpoints: useVisibilityRecords("endpoints") };

  return (
    <div className="grid gap-6">
      <p role="status" className="sr-only">
        {usersDevicesAnnouncement(mode, summary.state, records.identities, records.endpoints)}
      </p>

      <section aria-labelledby="users-devices-overview-title" data-section="users-devices-overview" data-mode={mode} className={panel}>
        <SectionHeader
          id="users-devices-overview-title"
          icon={MonitorSmartphone}
          title="Users & Devices Overview"
          description="Summary user and device figures for the selected scope."
          scopeLabel={scopeLabel}
        />
        <ul aria-label="Users and devices summary" className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SUMMARY_METRIC_KEYS.map((key) => (
            <SummaryCard
              key={key}
              metric={key}
              view={summaryCardView(summary.state, key)}
              simulated={summary.simulated}
              scopeLabel={scopeLabel}
              onRetry={summary.retry}
            />
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {RECORD_SECTIONS.map((section, index) => (
          <RecordsPanel
            key={section.id}
            section={section}
            state={records[section.kind]}
            mode={mode}
            scopeLabel={scopeLabel}
            delay={80 + index * 60}
          />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  id,
  icon: Icon,
  title,
  description,
  scopeLabel,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  scopeLabel: string;
}) {
  return (
    <header className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
          <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold leading-tight text-ink-100">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-350">{description}</p>
        </div>
      </div>
      <p data-section-scope className="min-w-0 shrink-0 break-words text-xs text-ink-350 sm:max-w-[14rem] sm:pt-1 sm:text-right">
        <span className="text-ink-300">Scope: </span>
        <span className="font-medium text-shield-300">{scopeLabel}</span>
      </p>
    </header>
  );
}

function SummaryCard({
  metric,
  view,
  simulated,
  scopeLabel,
  onRetry,
}: {
  metric: SummaryMetricKey;
  view: SummaryCardView;
  simulated: boolean;
  scopeLabel: string;
  onRetry: () => void;
}) {
  const Icon = summaryIcons[metric];
  const label = SUMMARY_LABELS[metric];

  return (
    <li
      data-metric={metric}
      data-state={view.status}
      aria-busy={view.status === "loading"}
      className="flex min-w-0 items-start gap-4 rounded-xl border border-ink-800 bg-ink-950/40 p-4 sm:p-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-shield-500/30 bg-shield-500/10 text-shield-400">
        <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-100">{label}</h3>
          {view.status === "ready" && simulated && (
            <span className="rounded-full border border-amber-signal/30 bg-amber-signal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
              Simulated
            </span>
          )}
          {view.status === "unavailable" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-700 bg-ink-800/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-300">
              <PlugZap aria-hidden className="h-3 w-3" strokeWidth={2} />
              Not connected
            </span>
          )}
        </div>

        {view.status === "loading" && (
          <span aria-hidden className="mt-3 block h-8 w-20 motion-safe:animate-pulse rounded bg-ink-800" />
        )}
        {view.status === "ready" && (
          <p data-metric-value className={`mt-2 font-mono text-3xl font-semibold leading-none tabular-nums ${view.stale ? "text-ink-300" : "text-ink-100"}`}>
            {view.value.toLocaleString("en-US")}
          </p>
        )}
        {view.status === "unavailable" && (
          <p className="mt-2 text-sm leading-relaxed text-ink-300">
            No {label.toLowerCase()} figure is available. This does not mean there are none.
          </p>
        )}
        {view.status === "error" && (
          <div role="alert" className="mt-2 text-sm text-ink-300">
            <p className="flex items-center gap-1.5 text-red-300">
              <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
              {view.text}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg border border-ink-700 bg-ink-800/60 px-3 text-sm font-medium text-ink-100 outline-none transition-colors hover:border-shield-500/40 focus-visible:ring-2 focus-visible:ring-shield-500/70"
            >
              <RotateCw aria-hidden className="h-4 w-4" strokeWidth={2} />
              Retry {label.toLowerCase()}
            </button>
          </div>
        )}

        <p className="mt-2 break-words text-xs text-ink-350">
          <span className="text-ink-300">Scope: </span>
          {scopeLabel}
        </p>
        {view.status === "ready" && view.stale && (
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-signal">
            <Clock aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            Stale figure
          </p>
        )}
        {simulated && view.status === "ready" && (
          <p data-summary-definition className="mt-2 text-xs leading-relaxed text-ink-350">
            {SUMMARY_DEFINITION}
          </p>
        )}
      </div>
    </li>
  );
}

function RecordsPanel({
  section,
  state,
  mode,
  scopeLabel,
  delay,
}: {
  section: RecordSection;
  state: VisibilityRecordsState;
  mode: "live" | "demo";
  scopeLabel: string;
  delay: number;
}) {
  const view = recordSectionView(state, section);
  const titleId = `${section.id}-title`;

  return (
    <section
      aria-labelledby={titleId}
      data-section={section.id}
      data-mode={mode}
      data-state={view.status}
      aria-busy={view.status === "loading"}
      style={{ animationDelay: `${delay}ms` }}
      className={panel}
    >
      <SectionHeader id={titleId} icon={sectionIcons[section.kind]} title={section.title} description={section.description} scopeLabel={scopeLabel} />

      {view.status === "simulated" ? (
        <>
          <p data-simulated className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
            <FlaskConical aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Simulated data · fictional examples
          </p>
          <ul aria-label={section.listLabel} className="mt-3 divide-y divide-ink-800 overflow-hidden rounded-lg border border-ink-800 bg-ink-950/40">
            {view.records.map((record) => (
              <RecordRow key={record.id} kind={section.kind} record={record} />
            ))}
          </ul>
        </>
      ) : (
        <StateMessage view={view} />
      )}

      {mode === "demo" && (
        <p data-disclosure className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-ink-300">
          <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {section.disclosure}
        </p>
      )}
    </section>
  );
}

function StateMessage({ view }: { view: Exclude<RecordSectionView, { status: "simulated" }> }) {
  const Icon = view.status === "loading" ? LoaderCircle : view.status === "error" ? AlertTriangle : PlugZap;
  const tone = view.status === "error" ? "text-red-300" : view.status === "not-connected" ? "text-amber-signal" : "text-ink-300";
  return (
    <div
      data-section-message
      role={view.status === "error" ? "alert" : undefined}
      className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-ink-700 bg-ink-950/40 px-3.5 py-3"
    >
      <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${tone} ${view.status === "loading" ? "motion-safe:animate-spin" : ""}`} strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-100">{view.title}</p>
        <p className="mt-1 break-words text-sm leading-relaxed text-ink-350">{view.body}</p>
      </div>
    </div>
  );
}
