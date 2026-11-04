"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { overviewMode, visibleOverview, type LoadedOverview } from "@/components/dashboard/customer-overview-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { getCustomerOverview, normalizeCustomerOverview } from "@/services/customer-overview";

export function useCustomerOverview() {
  const { view } = useCustomerView();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [loaded, setLoaded] = useState<LoadedOverview>(() => ({ customerId, state: { kind: "loading" } }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ customerId, state: { kind: "loading" } });

    getCustomerOverview(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ customerId, state: normalizeCustomerOverview(response, scope) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ customerId, state: { kind: "error", message: "Customer overview could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state: visibleOverview(loaded, customerId), mode: overviewMode(customerId), retry };
}
