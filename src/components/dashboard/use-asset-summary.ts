"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  assetSummarySource,
  visibleAssetSummary,
  type LoadedAssetSummary,
} from "@/components/dashboard/asset-summary-view";
import { normalizeAssetSummary, type AssetScope } from "@/services/dashboard-assets";

export function useAssetSummary() {
  const { view } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [loaded, setLoaded] = useState<LoadedAssetSummary>(() => ({ mode, customerId, state: { status: "loading" } }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: AssetScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode, customerId, state: { status: "loading" } });

    assetSummarySource(mode)(scope)
      .then((response) => {
        if (cancelled) return;
        const result = normalizeAssetSummary(response, scope);
        setLoaded({
          mode,
          customerId,
          state: result.ok ? { status: "ready", metrics: result.metrics } : { status: "error", message: result.message },
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, state: { status: "error", message: "Asset data could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state: visibleAssetSummary(loaded, mode, customerId), simulated: mode === "demo", retry };
}
