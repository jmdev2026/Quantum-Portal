import { formatCoveragePercentage, type SecurityCoverageState } from "@/services/security-coverage";
import type { InsightsState } from "@/services/insights";
import type { SecuritySeverityState } from "@/services/security-severity";

export type SecurityMetricId = "open-issues" | "critical-issues" | "security-coverage" | "security-insights";

export type SecurityMetricValue =
  | { kind: "loading" }
  | { kind: "value"; value: string; stale: boolean }
  | { kind: "unavailable"; reason: "Not connected" | "No data yet" | "Not reported" }
  | { kind: "error"; message: string };

export type SecurityMetric = { id: SecurityMetricId; label: string; hint: string; value: SecurityMetricValue };

export type SecurityOverviewSources = {
  severity: SecuritySeverityState;
  coverage: SecurityCoverageState;
  insights: InsightsState;
};

const formatCount = (value: number) => new Intl.NumberFormat("en-US").format(value);

type SourceState = SecuritySeverityState | SecurityCoverageState | InsightsState;

function notReady(state: Exclude<SourceState, { kind: "ready" | "stale" }>): SecurityMetricValue {
  switch (state.kind) {
    case "loading":
      return { kind: "loading" };
    case "unavailable":
      return { kind: "unavailable", reason: "Not connected" };
    case "empty":
      return { kind: "unavailable", reason: "No data yet" };
    case "error":
      return { kind: "error", message: state.message };
  }
}

const shown = (value: string, kind: "ready" | "stale"): SecurityMetricValue => ({ kind: "value", value, stale: kind === "stale" });
const notReported: SecurityMetricValue = { kind: "unavailable", reason: "Not reported" };

const isReady = <S extends SourceState>(state: S): state is Extract<S, { kind: "ready" | "stale" }> =>
  state.kind === "ready" || state.kind === "stale";

// Every figure is taken as-is from its validated response; nothing is summed, derived or defaulted to zero.
export function securityOverviewMetrics({ severity, coverage, insights }: SecurityOverviewSources): SecurityMetric[] {
  const openIssues = isReady(severity)
    ? severity.total === null
      ? notReported
      : shown(formatCount(severity.total), severity.kind)
    : notReady(severity);
  const critical = isReady(severity) ? shown(formatCount(severity.counts.critical), severity.kind) : notReady(severity);
  const coverageValue = isReady(coverage)
    ? coverage.coverage === null
      ? notReported
      : shown(formatCoveragePercentage(coverage.coverage.percentage), coverage.kind)
    : notReady(coverage);
  const insightCount = isReady(insights)
    ? shown(formatCount(insights.insights.length + insights.hiddenCount), insights.kind)
    : notReady(insights);

  return [
    { id: "open-issues", label: "Open Security Issues", hint: "Reported total from Issues by Severity", value: openIssues },
    { id: "critical-issues", label: "Critical Issues", hint: "Critical count from Issues by Severity", value: critical },
    {
      id: "security-coverage",
      label: "Security Coverage",
      hint: "Reported coverage indicator, see basis below",
      value: coverageValue,
    },
    {
      id: "security-insights",
      label: "Security Insights",
      hint: "Insight records for this view, not issues or threats",
      value: insightCount,
    },
  ];
}

export const coverageBasis = (coverage: SecurityCoverageState) =>
  (coverage.kind === "ready" || coverage.kind === "stale") && coverage.coverage ? coverage.coverage.basis : null;

export function securityOverviewSources({ severity, coverage, insights }: SecurityOverviewSources) {
  const sources = [severity, coverage, insights].flatMap((state) =>
    state.kind !== "loading" && state.kind !== "error" && state.source ? [state.source] : [],
  );
  return [...new Set(sources)];
}

export type SecurityOverviewStatus = "loading" | "simulated" | "ready" | "partial" | "not-connected" | "error";

export function securityOverviewStatus(metrics: SecurityMetric[], simulated: boolean): SecurityOverviewStatus {
  const kinds = metrics.map((metric) => metric.value.kind);
  if (kinds.includes("loading")) return "loading";
  if (kinds.every((kind) => kind === "value")) return simulated ? "simulated" : "ready";
  if (kinds.some((kind) => kind === "value")) return "partial";
  if (kinds.every((kind) => kind === "error")) return "error";
  return "not-connected";
}
