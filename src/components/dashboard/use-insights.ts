"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { insightsSource, visibleInsights, type LoadedInsights } from "@/components/dashboard/insights-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeInsights } from "@/services/insights";

export function useInsights() {
  const { view } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [loaded, setLoaded] = useState<LoadedInsights>(() => ({ mode, customerId, state: { kind: "loading" } }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode, customerId, state: { kind: "loading" } });

    insightsSource(mode)(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, state: normalizeInsights(response, scope) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, state: { kind: "error", message: "Insights could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state: visibleInsights(loaded, mode, customerId), simulated: mode === "demo", retry };
}
