"use client";

import { useCallback, useEffect, useState } from "react";
import { demoScopeBoundary } from "@/components/customer-view/demo-scope-boundary";
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
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const failed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedSecuritySeverity & { registry: typeof registry; attempt: number }>(() => ({ mode, customerId, registry, attempt, state: { kind: "loading" } }));

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode, customerId, registry, attempt, state: { kind: "loading" } });
    if (demoScopeBoundary(mode, customerId, registry, failed)) return;

    securitySeveritySource(mode)(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, registry, attempt, state: normalizeSecuritySeverity(response, scope) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, registry, attempt, state: { kind: "error", message: "Issue counts could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, attempt, registry, failed]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  const boundary = demoScopeBoundary(mode, customerId, registry, failed);
  const state = boundary?.kind === "unavailable" ? { kind: "unavailable" as const, source: null, lastSyncedAt: null } : boundary ?? (loaded.registry !== registry || loaded.attempt !== attempt ? { kind: "loading" as const } : visibleSecuritySeverity(loaded, mode, customerId));
  return { state, simulated: mode === "demo", retry };
}
