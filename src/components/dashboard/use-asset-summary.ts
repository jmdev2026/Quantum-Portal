"use client";

import { useCallback, useEffect, useState } from "react";
import { demoScopeBoundary } from "@/components/customer-view/demo-scope-boundary";
import { ASSET_METRIC_KEYS, type AssetMetricKey, type AssetMetricState } from "@/services/dashboard-assets";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  assetSummarySource,
  visibleAssetSummary,
  type LoadedAssetSummary,
} from "@/components/dashboard/asset-summary-view";
import { normalizeAssetSummary, type AssetScope } from "@/services/dashboard-assets";

export function useAssetSummary() {
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const failed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedAssetSummary & { registry: typeof registry; attempt: number }>(() => ({ mode, customerId, registry, attempt, state: { status: "loading" } }));

  useEffect(() => {
    let cancelled = false;
    const scope: AssetScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode, customerId, registry, attempt, state: { status: "loading" } });
    if (demoScopeBoundary(mode, customerId, registry, failed)) return;

    assetSummarySource(mode)(scope)
      .then((response) => {
        if (cancelled) return;
        const result = normalizeAssetSummary(response, scope);
        setLoaded({
          mode,
          customerId,
          registry,
          attempt,
          state: result.ok ? { status: "ready", metrics: result.metrics } : { status: "error", message: result.message },
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, registry, attempt, state: { status: "error", message: "Asset data could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, attempt, registry, failed]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  const boundary = demoScopeBoundary(mode, customerId, registry, failed);
  const state = boundary?.kind === "unavailable"
    ? { status: "ready" as const, metrics: Object.fromEntries(ASSET_METRIC_KEYS.map(key => [key, { kind: "unavailable", source: null, lastSyncedAt: null }])) as Record<AssetMetricKey, AssetMetricState> }
    : boundary?.kind === "error" ? { status: "error" as const, message: boundary.message }
    : boundary || loaded.registry !== registry || loaded.attempt !== attempt ? { status: "loading" as const }
    : visibleAssetSummary(loaded, mode, customerId);
  return { state, simulated: mode === "demo", retry };
}
