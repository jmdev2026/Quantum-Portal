"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Binoculars,
  CircleCheck,
  CircleHelp,
  Cloud,
  FlaskConical,
  Fingerprint,
  Globe,
  GraduationCap,
  Info,
  Laptop,
  LoaderCircle,
  Mail,
  MailWarning,
  PlugZap,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useSecurityCoverage } from "@/components/dashboard/use-security-coverage";
import {
  SIMULATED_CONTROLS_EXPLANATION,
  SIMULATED_STATUS_MEANINGS,
  CONTROL_STATUS_LABELS,
  securityControlsView,
  type ControlRow,
  type SecurityControlsStatus,
  type SecurityControlsView,
} from "@/components/security/security-controls-view";
import { SECURITY_SECTIONS, securityScopeLabel } from "@/components/security/security-overview-view";
import type { ControlStatus, SecurityControlKey } from "@/services/security-coverage";

const section = SECURITY_SECTIONS.find((entry) => entry.id === "security-controls")!;

const controlIcons: Record<SecurityControlKey, LucideIcon> = {
  mdr: Radar,
  itdr: Fingerprint,
  external_footprint_scan: Globe,
  dark_web_monitoring: Binoculars,
  email_protection: Mail,
  endpoint_security: Laptop,
  cloud_data_protection: Cloud,
  security_awareness_training: GraduationCap,
  phishing_simulations: MailWarning,
};

const statusDisplay: Record<ControlStatus, { icon: LucideIcon; tone: string }> = {
  covered: { icon: CircleCheck, tone: "border-shield-500/30 bg-shield-500/10 text-shield-300" },
  needs_attention: { icon: AlertTriangle, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  unknown: { icon: CircleHelp, tone: "border-ink-700 bg-ink-800/80 text-ink-300" },
};

const badgeTone: Record<SecurityControlsStatus, string> = {
  loading: "border-ink-700 bg-ink-800/80 text-ink-300",
  "not-connected": "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  simulated: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  reported: "border-ink-700 bg-ink-800/80 text-ink-300",
  stale: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal",
  empty: "border-ink-700 bg-ink-800/80 text-ink-300",
  error: "border-red-400/30 bg-red-400/10 text-red-300",
};

const messageIcon: Partial<Record<SecurityControlsStatus, { icon: LucideIcon; tone: string }>> = {
  "not-connected": { icon: PlugZap, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  empty: { icon: Info, tone: "border-ink-700 bg-ink-800 text-ink-300" },
  error: { icon: AlertTriangle, tone: "border-red-400/30 bg-red-400/10 text-red-300" },
};

export function SecurityControlsPanel() {
  const { view, selectedCustomer } = useCustomerView();
  const { state, simulated } = useSecurityCoverage();
  const scopeLabel = securityScopeLabel(view.mode, selectedCustomer?.name);
  const controls = securityControlsView(state, simulated, scopeLabel);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      data-mode={simulated ? "demo" : "live"}
      data-state={controls.status}
      aria-busy={controls.status === "loading"}
      style={{ animationDelay: "260ms" }}
      className="@container flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition-colors duration-300 hover:border-ink-600 sm:p-6 md:col-span-2"
    >
      <header className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <ShieldCheck aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id={`${section.id}-title`} className="text-base font-semibold leading-tight text-ink-100">
              {section.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{section.description}</p>
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 flex-col items-start gap-2 sm:items-end">
          <span
            data-controls-badge
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${badgeTone[controls.status]}`}
          >
            {controls.badge}
          </span>
          <p data-controls-scope className="min-w-0 break-words text-xs text-ink-350">
            <span className="text-ink-300">Scope: </span>
            <span className="font-medium text-shield-300">{scopeLabel}</span>
          </p>
        </div>
      </header>

      <p role="status" className="sr-only">
        {controls.announcement}
      </p>

      {controls.status === "simulated" && <SimulatedExplanation />}
      {controls.message && <StateMessage status={controls.status} message={controls.message} />}

      <ul aria-label="Security controls" className="mt-5 grid grid-cols-1 gap-3 @xl:grid-cols-2 @3xl:grid-cols-3">
        {controls.rows.map((row) => (
          <ControlCard key={row.key} row={row} simulated={controls.status === "simulated"} />
        ))}
      </ul>

      <ControlsFooter controls={controls} />
    </section>
  );
}

function SimulatedExplanation() {
  return (
    <div data-controls-explanation className="mt-5 rounded-xl border border-amber-signal/20 bg-amber-signal/5 px-4 py-3">
      <p data-simulated className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
        <FlaskConical aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        Simulated data · fictional example statuses
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-300">{SIMULATED_CONTROLS_EXPLANATION}</p>
      <dl className="mt-3 grid gap-2 text-xs leading-relaxed text-ink-350 @2xl:grid-cols-3">
        {SIMULATED_STATUS_MEANINGS.map(({ status, meaning }) => (
          <div key={status} className="min-w-0">
            <dt className="font-medium text-ink-100">{CONTROL_STATUS_LABELS[status]}</dt>
            <dd className="mt-0.5 break-words">{meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function StateMessage({ status, message }: { status: SecurityControlsStatus; message: { title: string; body: string } }) {
  const { icon: Icon, tone } = messageIcon[status] ?? messageIcon.empty!;
  return (
    <div
      data-controls-message
      role={status === "error" ? "alert" : undefined}
      className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-ink-700 bg-ink-950/40 px-4 py-3"
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${tone}`}>
        <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-ink-100">{message.title}</p>
        <p className="mt-1 break-words text-sm leading-relaxed text-ink-350">{message.body}</p>
      </div>
    </div>
  );
}

function ControlCard({ row, simulated }: { row: ControlRow; simulated: boolean }) {
  const Icon = controlIcons[row.key];
  return (
    <li
      data-control={row.key}
      data-control-status={row.value.kind === "status" ? row.value.status : row.value.kind}
      className="flex min-w-0 items-start gap-3 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3.5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-ink-300">
        <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium leading-snug text-ink-100">
          <span className="min-w-0 break-words">{row.label}</span>
          {row.abbreviation && (
            <span className="shrink-0 rounded border border-ink-700 px-1.5 font-mono text-[10px] text-ink-300">{row.abbreviation}</span>
          )}
        </h3>
        <ControlValue value={row.value} simulated={simulated} />
      </div>
    </li>
  );
}

function ControlValue({ value, simulated }: { value: ControlRow["value"]; simulated: boolean }) {
  if (value.kind === "loading") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-350">
        <LoaderCircle aria-hidden className="h-3.5 w-3.5 shrink-0 motion-safe:animate-spin" strokeWidth={2} />
        Loading
      </span>
    );
  }
  if (value.kind === "placeholder") {
    return (
      <span className="w-fit rounded-md border border-ink-800 bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-350">
        {value.label}
      </span>
    );
  }
  const { icon: StatusIcon, tone } = statusDisplay[value.status];
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${tone}`}>
      <StatusIcon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span>
        <span className="sr-only">{simulated ? "Simulated status: " : "Status: "}</span>
        {value.label}
      </span>
    </span>
  );
}

function ControlsFooter({ controls }: { controls: SecurityControlsView }) {
  if (controls.status === "simulated") {
    return (
      <p data-controls-source className="mt-4 text-xs text-ink-350">
        <span className="text-ink-300">Source: </span>
        {controls.source}
      </p>
    );
  }
  if (controls.status !== "reported" && controls.status !== "stale") return null;
  return (
    <p data-controls-source className="mt-4 break-words text-xs text-ink-350">
      {controls.status === "stale" && <span className="text-amber-signal">Stale data. Statuses may be out of date. </span>}
      {controls.lastSyncedAt ? (
        <>
          Last synced <time dateTime={controls.lastSyncedAt}>{new Date(controls.lastSyncedAt).toLocaleString()}</time>
        </>
      ) : (
        "Sync time not provided"
      )}
      {controls.source && <span className="font-mono"> · {controls.source}</span>}
    </p>
  );
}
