"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  getCustomerOverview,
  normalizeCustomerOverview,
  type CustomerOverviewState,
} from "@/services/customer-overview";

export function useCustomerOverview() {
  const { view } = useCustomerView();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [state, setState] = useState<CustomerOverviewState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setState({ kind: "loading" });

    getCustomerOverview(scope)
      .then((response) => {
        if (!cancelled) setState(normalizeCustomerOverview(response, scope));
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error", message: "Customer overview could not be loaded." });
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state, retry };
}
