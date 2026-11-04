"use client";

import type { LucideIcon } from "lucide-react";
import { Cloud, FlaskConical, Globe, Mail, MonitorSmartphone, RotateCw, Users } from "lucide-react";
import type { AssetMetricKey, AssetMetricState } from "@/services/dashboard-assets";
import { AssetMetricCard } from "@/components/dashboard/asset-metric-card";
import { useAssetSummary } from "@/components/dashboard/use-asset-summary";
import type { AssetSummaryState } from "@/components/dashboard/asset-summary-view";

const assets: { key: AssetMetricKey; label: string; icon: LucideIcon }[] = [
  { key: "users", label: "Users", icon: Users },
  { key: "devices", label: "Devices", icon: MonitorSmartphone },
  { key: "mailboxes", label: "Mailboxes", icon: Mail },
  { key: "cloud_drives", label: "Cloud Drives", icon: Cloud },
  { key: "internet_assets", label: "Internet Assets", icon: Globe },
];

function metricState(state: AssetSummaryState, key: AssetMetricKey): AssetMetricState {
  if (state.status === "loading") return { kind: "loading" };
  if (state.status === "error") return { kind: "error", message: state.message };
  return state.metrics[key];
}

export function AssetSummary() {
  const { state, simulated, retry } = useAssetSummary();

  return (
    <section aria-labelledby="assets-heading" aria-busy={state.status === "loading"} data-mode={simulated ? "demo" : "live"}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 id="assets-heading" className="font-mono text-[11px] uppercase tracking-widest text-ink-350">
            Protected assets
          </h2>
          {simulated && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-signal/40 bg-amber-signal/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
              <FlaskConical aria-hidden className="h-3 w-3" strokeWidth={2} />
              Simulated demo data
            </span>
          )}
        </div>
        {state.status === "error" && (
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-2.5 py-1 text-xs text-ink-300 transition-colors hover:border-shield-500/40 hover:text-shield-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400"
          >
            <RotateCw aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            Retry
          </button>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {assets.map(({ key, label, icon }) => (
          <AssetMetricCard key={key} icon={icon} label={label} state={metricState(state, key)} simulated={simulated} />
        ))}
      </ul>
    </section>
  );
}
