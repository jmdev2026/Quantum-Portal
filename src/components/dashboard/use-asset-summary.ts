"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import {
  getAssetSummary,
  normalizeAssetSummary,
  type AssetMetricKey,
  type AssetMetricState,
  type AssetScope,
} from "@/services/dashboard-assets";

export type AssetSummaryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; metrics: Record<AssetMetricKey, AssetMetricState> };

export function useAssetSummary() {
  const { view } = useCustomerView();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [state, setState] = useState<AssetSummaryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: AssetScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setState({ status: "loading" });

    getAssetSummary(scope)
      .then((response) => {
        if (cancelled) return;
        const result = normalizeAssetSummary(response, scope);
        setState(result.ok ? { status: "ready", metrics: result.metrics } : { status: "error", message: result.message });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "Asset data could not be loaded." });
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state, retry };
}
