"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import {
  securityCoverageSource,
  visibleSecurityCoverage,
  type LoadedSecurityCoverage,
} from "@/components/dashboard/security-coverage-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeSecurityCoverage } from "@/services/security-coverage";

export function useSecurityCoverage() {
  const { view } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [loaded, setLoaded] = useState<LoadedSecurityCoverage>(() => ({ mode, customerId, state: { kind: "loading" } }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode, customerId, state: { kind: "loading" } });

    securityCoverageSource(mode)(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, state: normalizeSecurityCoverage(response, scope) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, state: { kind: "error", message: "Security coverage could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state: visibleSecurityCoverage(loaded, mode, customerId), simulated: mode === "demo", retry };
}
