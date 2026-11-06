"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  customerOverviewSource,
  overviewMode,
  visibleOverview,
  type LoadedOverview,
} from "@/components/dashboard/customer-overview-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeCustomerOverview } from "@/services/customer-overview";

export function useCustomerOverview() {
  const { view } = useCustomerView();
  const { mode: dashboardMode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [loaded, setLoaded] = useState<LoadedOverview>(() => ({
    mode: dashboardMode,
    customerId,
    state: { kind: "loading" },
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode: dashboardMode, customerId, state: { kind: "loading" } });

    customerOverviewSource(dashboardMode)(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode: dashboardMode, customerId, state: normalizeCustomerOverview(response, scope) });
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ mode: dashboardMode, customerId, state: { kind: "error", message: "Customer overview could not be loaded." } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dashboardMode, customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return {
    state: visibleOverview(loaded, dashboardMode, customerId),
    mode: overviewMode(customerId),
    simulated: dashboardMode === "demo",
    retry,
  };
}
