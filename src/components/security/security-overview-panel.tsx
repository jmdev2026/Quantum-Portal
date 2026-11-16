"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, FlaskConical, Gauge, Info, Lightbulb, OctagonAlert, RotateCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useSecurityCoverage } from "@/components/dashboard/use-security-coverage";
import { useInsights } from "@/components/dashboard/use-insights";
import { useSecuritySeverity } from "@/components/dashboard/use-security-severity";
import {
  coverageBasis,
  securityOverviewMetrics,
  securityOverviewSources,
  securityOverviewStatus,
  type SecurityMetric,
  type SecurityMetricId,
  type SecurityOverviewSources,
  type SecurityOverviewStatus,
} from "@/components/security/security-overview-metrics";
import { SECURITY_SECTIONS } from "@/components/security/security-overview-view";

const section = SECURITY_SECTIONS.find((entry) => entry.id === "security-overview")!;

const metricIcons: Record<SecurityMetricId, { icon: LucideIcon; tone: string }> = {
  "open-issues": { icon: ShieldAlert, tone: "text-shield-400" },
  "critical-issues": { icon: OctagonAlert, tone: "text-red-400" },
  "security-coverage": { icon: ShieldCheck, tone: "text-shield-400" },
  "security-insights": { icon: Lightbulb, tone: "text-amber-signal" },
};

const statusBadge: Record<SecurityOverviewStatus, { label: string; tone: string }> = {
  loading: { label: "Loading", tone: "border-ink-700 bg-ink-800/80 text-ink-300" },
  simulated: { label: "Simulated", tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  ready: { label: "Connected", tone: "border-ink-700 bg-ink-800/80 text-ink-300" },
  partial: { label: "Partially available", tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  "not-connected": { label: "Not connected", tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  error: { label: "Error", tone: "border-red-400/30 bg-red-400/10 text-red-300" },
};

const announcement: Record<SecurityOverviewStatus, string> = {
  loading: "Loading security overview",
  simulated: "Simulated security overview loaded. Fictional demonstration values.",
  ready: "Security overview loaded",
  partial: "Security overview partly loaded. Some metrics are unavailable.",
  "not-connected": "Security integration not connected. No security metrics are shown.",
  error: "Security overview could not be loaded",
};

export function SecurityOverviewPanel() {
  const severity = useSecuritySeverity();
  const coverage = useSecurityCoverage();
  const insights = useInsights();
  const retries: Record<SecurityMetricId, () => void> = {
    "open-issues": severity.retry,
    "critical-issues": severity.retry,
    "security-coverage": coverage.retry,
    "security-insights": insights.retry,
  };
  return (
    <SecurityOverviewView
      sources={{ severity: severity.state, coverage: coverage.state, insights: insights.state }}
      simulated={severity.simulated}
      retries={retries}
    />
  );
}

type SecurityOverviewViewProps = {
  sources: SecurityOverviewSources;
  simulated: boolean;
  retries: Record<SecurityMetricId, () => void>;
};

function SecurityOverviewView({ sources, simulated, retries }: SecurityOverviewViewProps) {
  const metrics = securityOverviewMetrics(sources);
  const status = securityOverviewStatus(metrics, simulated);
  const basis = coverageBasis(sources.coverage);
  const sourceNames = securityOverviewSources(sources);
  const badge = statusBadge[status];

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      data-mode={simulated ? "demo" : "live"}
      data-state={status}
      className="flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition-colors duration-300 hover:border-ink-600 sm:p-6 md:col-span-2"
    >
      <header className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <Gauge aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id={`${section.id}-title`} className="text-base font-semibold leading-tight text-ink-100">
              {section.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{section.description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${badge.tone}`}>
          {badge.label}
        </span>
      </header>

      <p role="status" className="sr-only">
        {announcement[status]}
      </p>

      {simulated && status !== "loading" && (
        <p data-simulated className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
          <FlaskConical aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Simulated data · fictional, not provider findings
        </p>
      )}

      <dl aria-busy={status === "loading"} className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} simulated={simulated} onRetry={retries[metric.id]} />
        ))}
      </dl>

      <SecurityOverviewFooter status={status} basis={basis} sourceNames={sourceNames} />
    </section>
  );
}

function MetricCard({ metric, simulated, onRetry }: { metric: SecurityMetric; simulated: boolean; onRetry: () => void }) {
  const { icon: Icon, tone } = metricIcons[metric.id];
  const { value } = metric;
  return (
    <div
      data-metric={metric.id}
      data-value-kind={value.kind}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3.5 transition-colors duration-200 hover:border-ink-700"
    >
      <dt className="flex items-center gap-2 text-sm font-medium text-ink-300">
        <Icon aria-hidden className={`h-4 w-4 shrink-0 ${tone}`} strokeWidth={2} />
        <span className="min-w-0 break-words">{metric.label}</span>
      </dt>
      <dd className="flex min-h-9 flex-wrap items-baseline gap-x-2 gap-y-1">
        {value.kind === "value" ? (
          <>
            <span className={`text-3xl font-semibold leading-none tabular-nums ${value.stale ? "text-ink-300" : "text-ink-100"}`}>
              {value.value}
            </span>
            {simulated && <span className="sr-only">(simulated, fictional demonstration value)</span>}
            {value.stale && <span className="text-xs text-amber-signal">Stale</span>}
          </>
        ) : value.kind === "loading" ? (
          <>
            <span aria-hidden className="h-7 w-16 animate-pulse rounded bg-ink-700 motion-reduce:animate-none" />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          <>
            <span aria-hidden className="text-3xl font-semibold leading-none text-ink-400">
              —
            </span>
            <span className={`text-xs ${value.kind === "error" ? "text-red-300" : "text-ink-350"}`}>
              {value.kind === "error" ? "Unavailable" : value.reason}
            </span>
          </>
        )}
      </dd>
      <dd className="text-xs leading-relaxed text-ink-350">{metric.hint}</dd>
      {value.kind === "error" && (
        <dd className="flex flex-col items-start gap-2 text-xs leading-relaxed text-ink-350">
          <span role="alert">{value.message}</span>
          <button
            type="button"
            onClick={onRetry}
            aria-label={`Retry loading ${metric.label}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-2.5 py-1 text-ink-300 transition-colors hover:border-shield-500/40 hover:text-shield-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400"
          >
            <RotateCw aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            Retry
          </button>
        </dd>
      )}
    </div>
  );
}

function SecurityOverviewFooter({
  status,
  basis,
  sourceNames,
}: {
  status: SecurityOverviewStatus;
  basis: string | null;
  sourceNames: string[];
}) {
  if (status === "loading") return null;
  if (status === "not-connected") {
    return (
      <div className="mt-4 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3 text-xs leading-relaxed text-ink-350">
        <p className="flex items-center gap-1.5 font-medium text-amber-signal">
          <Info aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Security integration not connected
        </p>
        <p className="mt-1">
          Metrics will appear once a security integration is connected. A dash means no data is available, not zero.
        </p>
      </div>
    );
  }
  if (!basis && sourceNames.length === 0) {
    return status === "error" ? (
      <p className="mt-4 flex items-center gap-1.5 text-xs text-red-300">
        <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        Use Retry on each metric to try again.
      </p>
    ) : null;
  }
  return (
    <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3 text-xs leading-relaxed text-ink-350">
      {basis && (
        <p data-coverage-basis>
          <span className="font-medium text-ink-300">Coverage basis: </span>
          {basis}
        </p>
      )}
      {sourceNames.length > 0 && (
        <p>
          <span className="font-medium text-ink-300">Source: </span>
          <span className="font-mono">{sourceNames.join(" · ")}</span>
        </p>
      )}
    </div>
  );
}
