"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleDetections, type LoadedDetections } from "@/components/security/threats-detections-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { getDemoSecurityDetections, normalizeDemoSecurityDetections } from "@/services/security-detections";

export function useSecurityDetections() {
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const customers = customersState.status === "ready" ? customersState.customers : null;
  const customersFailed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedDetections>(() => ({ mode, customerId, state: { kind: "loading" } }));

  useEffect(() => {
    if (mode !== "demo") return;
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    if (customersFailed) {
      setLoaded({ mode, customerId, state: { kind: "error", message: "The customer list is unavailable." } });
      return;
    }
    setLoaded({ mode, customerId, state: { kind: "loading" } });
    if (!customers) return;

    getDemoSecurityDetections(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, state: normalizeDemoSecurityDetections(response, scope, customers) });
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ mode, customerId, state: { kind: "error", message: "Demonstration detections could not be loaded." } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, customers, customersFailed, attempt]);

  return { state: visibleDetections(loaded, mode, customerId), simulated: mode === "demo", retry: () => setAttempt(value => value + 1) };
}
