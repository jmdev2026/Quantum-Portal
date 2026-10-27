"use client";

import type { LucideIcon } from "lucide-react";
import { Cloud, Globe, Mail, MonitorSmartphone, RotateCw, Users } from "lucide-react";
import type { AssetMetricKey, AssetMetricState } from "@/services/dashboard-assets";
import { AssetMetricCard } from "@/components/dashboard/asset-metric-card";
import { useAssetSummary, type AssetSummaryState } from "@/components/dashboard/use-asset-summary";

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
  const { state, retry } = useAssetSummary();

  return (
    <section aria-labelledby="assets-heading" aria-busy={state.status === "loading"}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="assets-heading" className="font-mono text-[11px] uppercase tracking-widest text-ink-400">
          Protected assets
        </h2>
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
          <AssetMetricCard key={key} icon={icon} label={label} state={metricState(state, key)} />
        ))}
      </ul>
    </section>
  );
}
