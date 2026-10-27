"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock, Info, Inbox, Layers, Lightbulb, RotateCw } from "lucide-react";
import { useId, useRef, useState } from "react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { categoryDisplay, InsightCard } from "@/components/dashboard/insight-card";
import { useInsights } from "@/components/dashboard/use-insights";
import type { InsightCategory, InsightsState } from "@/services/insights";

type TabKey = "all" | InsightCategory;

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "all", label: "All", icon: Layers },
  { key: "security", label: "Security", icon: categoryDisplay.security.icon },
  { key: "tip", label: "Tips", icon: categoryDisplay.tip.icon },
  { key: "operations", label: "Operations", icon: categoryDisplay.operations.icon },
];

const emptyTabMessage: Record<TabKey, string> = {
  all: "No insights were reported for this view.",
  security: "No security insights were reported for this view.",
  tip: "No tips were reported for this view.",
  operations: "No operations insights were reported for this view.",
};

const panelStatus: Record<InsightsState["kind"], { label: string; tone: "pending" | "disconnected" }> = {
  loading: { label: "Loading", tone: "pending" },
  ready: { label: "Connected", tone: "pending" },
  stale: { label: "Stale", tone: "disconnected" },
  empty: { label: "No data yet", tone: "pending" },
  unavailable: { label: "Not connected", tone: "disconnected" },
  error: { label: "Error", tone: "disconnected" },
};

type InsightsData = Extract<InsightsState, { kind: "ready" | "stale" }>;
const hasInsights = (state: InsightsState): state is InsightsData => state.kind === "ready" || state.kind === "stale";

const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function InsightsPanel() {
  const { state, retry } = useInsights();
  return <InsightsView state={state} onRetry={retry} />;
}

export function InsightsView({ state, onRetry }: { state: InsightsState; onRetry: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const hasData = hasInsights(state);
  const insights = hasData ? state.insights : [];
  const visible = activeTab === "all" ? insights : insights.filter((insight) => insight.category === activeTab);

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setActiveTab(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <DashboardPanel
      id="insights"
      icon={Lightbulb}
      title="Insights"
      description="Read-only security, tip and operations insights for the selected view."
      status={panelStatus[state.kind]}
      className="lg:col-span-3"
    >
      <div data-state={state.kind} className="@container flex flex-1 flex-col gap-4">
        <div
          role="tablist"
          aria-label="Insight categories"
          className="flex max-w-full gap-1 self-start overflow-x-auto rounded-lg border border-ink-700 bg-ink-950/60 p-1"
        >
          {tabs.map(({ key, label, icon: Icon }, index) => {
            const selected = key === activeTab;
            const count = hasData ? (key === "all" ? insights.length : insights.filter((i) => i.category === key).length) : null;
            return (
              <button
                key={key}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={`${baseId}-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                data-tab={key}
                onClick={() => setActiveTab(key)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-shield-400 ${
                  selected ? "bg-ink-800 text-shield-300 shadow-sm shadow-black/40" : "text-ink-400 hover:text-ink-100"
                }`}
              >
                <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {label}
                {count !== null && (
                  <span
                    className={`rounded px-1.5 font-mono text-[10px] tabular-nums ${selected ? "bg-shield-500/15 text-shield-300" : "bg-ink-800 text-ink-400"}`}
                  >
                    <span className="sr-only">(</span>
                    {count}
                    <span className="sr-only">)</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeTab}`}
          aria-busy={state.kind === "loading"}
          tabIndex={0}
          className="flex flex-1 flex-col gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400"
        >
          {state.kind === "loading" ? (
            <ul className="grid grid-cols-1 gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <li key={i} aria-hidden className="flex flex-col gap-3 rounded-xl border border-ink-800 bg-ink-950/40 p-4">
                  <span className="h-3 w-20 animate-pulse rounded bg-ink-700" />
                  <span className="h-4 w-3/4 animate-pulse rounded bg-ink-700" />
                  <span className="h-3 w-full animate-pulse rounded bg-ink-800" />
                </li>
              ))}
              <li className="sr-only">Loading insights</li>
            </ul>
          ) : hasInsights(state) ? (
            visible.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
                {visible.map((insight) => (
                  <li key={insight.id} className="flex min-w-0">
                    <InsightCard insight={insight} stale={state.kind === "stale"} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyList message={emptyTabMessage[activeTab]} />
            )
          ) : (
            <StateNotice state={state} onRetry={onRetry} />
          )}

          {hasInsights(state) && <DataFooter state={state} />}
        </div>
      </div>
    </DashboardPanel>
  );
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-700 bg-ink-950/40 px-6 py-8 text-center">
      <Inbox aria-hidden className="h-5 w-5 text-ink-400" strokeWidth={1.5} />
      <p className="mt-2 text-sm text-ink-300">{message}</p>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-400">
        The absence of an insight does not indicate the level of security risk.
      </p>
    </div>
  );
}

function Notice({ tone, icon: Icon, title, children }: { tone: string; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3 text-xs leading-relaxed text-ink-400">
      <p className={`flex items-center gap-1.5 font-medium ${tone}`}>
        <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {title}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function StateNotice({
  state,
  onRetry,
}: {
  state: Exclude<InsightsState, InsightsData | { kind: "loading" }>;
  onRetry: () => void;
}) {
  switch (state.kind) {
    case "unavailable":
      return (
        <Notice tone="text-amber-signal" icon={Info} title="Insights provider not connected">
          Insights will appear once security and backup providers are connected and reporting. The absence of insights
          does not indicate the level of security risk.
        </Notice>
      );
    case "empty":
      return (
        <Notice tone="text-ink-300" icon={Inbox} title="No insights reported yet">
          The connected providers have not reported any insights for this view. The absence of insights does not
          indicate the level of security risk.
        </Notice>
      );
    case "error":
      return (
        <Notice tone="text-red-400" icon={AlertTriangle} title="Could not load insights">
          <p className="[overflow-wrap:anywhere]">{state.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-2.5 py-1 text-ink-300 transition-colors hover:border-shield-500/40 hover:text-shield-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400"
          >
            <RotateCw aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            Retry
          </button>
        </Notice>
      );
  }
}

function DataFooter({ state }: { state: InsightsData }) {
  const sync = (
    <>
      {state.lastSyncedAt ? (
        <>
          Last synced <time dateTime={state.lastSyncedAt}>{formatTimestamp(state.lastSyncedAt)}</time>
        </>
      ) : (
        "Sync time not provided"
      )}
      {state.source && <span className="font-mono"> · {state.source}</span>}
    </>
  );

  return (
    <div className="flex flex-col gap-2 text-xs">
      {state.hiddenCount > 0 && (
        <p className="text-ink-400">
          {state.hiddenCount} more {state.hiddenCount === 1 ? "insight was" : "insights were"} returned but not shown.
        </p>
      )}
      {state.kind === "stale" ? (
        <p className="flex items-start gap-1.5 leading-relaxed text-amber-signal">
          <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>Stale data. Insights may be out of date. {sync}</span>
        </p>
      ) : (
        (state.lastSyncedAt || state.source) && <p className="truncate text-ink-400">{sync}</p>
      )}
    </div>
  );
}
