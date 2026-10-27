"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import { getInsights, normalizeInsights, type InsightsState } from "@/services/insights";

export function useInsights() {
  const { view } = useCustomerView();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [state, setState] = useState<InsightsState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setState({ kind: "loading" });

    getInsights(scope)
      .then((response) => {
        if (!cancelled) setState(normalizeInsights(response, scope));
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error", message: "Insights could not be loaded." });
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state, retry };
}
