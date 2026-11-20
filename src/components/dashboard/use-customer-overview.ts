"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { demoScopeBoundary } from "@/components/customer-view/demo-scope-boundary";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { customerOverviewSource, overviewMode, visibleOverview, type LoadedOverview } from "@/components/dashboard/customer-overview-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeCustomerOverview, type CustomerOverviewState } from "@/services/customer-overview";
import type { KnownCustomer } from "@/services/security-detections";

type Loaded = LoadedOverview & { registry: readonly KnownCustomer[] | null; attempt: number };
export function useCustomerOverview() {
  const { view, customersState } = useCustomerView();
  const { mode: dashboardMode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const failed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>(() => ({ mode: dashboardMode, customerId, registry, attempt, state: { kind: "loading" } }));
  useEffect(() => {
    let cancelled = false;
    const context = { mode: dashboardMode, customerId, registry, attempt };
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ ...context, state: { kind: "loading" } });
    if (demoScopeBoundary(dashboardMode, customerId, registry, failed)) return;
    customerOverviewSource(dashboardMode)(scope).then(response => {
      if (cancelled) return;
      const result = normalizeCustomerOverview(response, scope);
      const state: CustomerOverviewState = (result.kind === "ready" || result.kind === "stale") && result.customers.some(customer => !registry!.some(known => known.id === customer.id && known.name === customer.name)) ? { kind: "error", message: "Customer reporting does not match the current directory." } : result;
      setLoaded({ ...context, state });
    }).catch(() => { if (!cancelled) setLoaded({ ...context, state: { kind: "error", message: "Customer overview could not be loaded." } }); });
    return () => { cancelled = true; };
  }, [dashboardMode, customerId, attempt, registry, failed]);
  const retry = useCallback(() => setAttempt(count => count + 1), []);
  const boundary = demoScopeBoundary(dashboardMode, customerId, registry, failed);
  const state: CustomerOverviewState = boundary?.kind === "unavailable" ? { kind: "unavailable", source: null, lastSyncedAt: null } : boundary ?? (loaded.registry !== registry || loaded.attempt !== attempt ? { kind: "loading" } : visibleOverview(loaded, dashboardMode, customerId));
  return { state, mode: overviewMode(customerId), simulated: dashboardMode === "demo", retry, contextKey: `${dashboardMode}:${customerId}:${attempt}` };
}
