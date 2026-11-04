"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  securitySeveritySource,
  visibleSecuritySeverity,
  type LoadedSecuritySeverity,
} from "@/components/dashboard/security-severity-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeSecuritySeverity } from "@/services/security-severity";

export function useSecuritySeverity() {
  const { view } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [loaded, setLoaded] = useState<LoadedSecuritySeverity>(() => ({ mode, customerId, state: { kind: "loading" } }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode, customerId, state: { kind: "loading" } });

    securitySeveritySource(mode)(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, state: normalizeSecuritySeverity(response, scope) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, state: { kind: "error", message: "Issue counts could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state: visibleSecuritySeverity(loaded, mode, customerId), simulated: mode === "demo", retry };
}
