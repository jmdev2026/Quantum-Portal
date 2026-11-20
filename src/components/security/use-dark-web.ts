"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleDarkWeb, type LoadedDarkWeb } from "@/components/security/dark-web-view";
import { getDemoDarkWeb, normalizeDemoDarkWeb } from "@/services/dark-web";
import type { DashboardScope } from "@/services/dashboard-response";

export function useDarkWeb() {
  const { mode } = useDashboardMode();
  const { view, customersState, selectedCustomer } = useCustomerView();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const customers = customersState.status === "ready" ? customersState.customers : null;
  const customersFailed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedDarkWeb>({ mode, customerId, attempt, state: { kind: "loading" } });
  useEffect(() => {
    const context = { mode, customerId, attempt };
    if (mode !== "demo") { setLoaded({ ...context, state: { kind: "unavailable" } }); return; }
    let cancelled = false;
    setLoaded({ ...context, state: { kind: "loading" } });
    if (customersFailed || !customers) return;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    if (customerId !== null && !customers.some(customer => customer.id === customerId)) return;
    getDemoDarkWeb(scope).then(response => {
      if (!cancelled) setLoaded({ ...context, state: normalizeDemoDarkWeb(response, scope, customers) });
    }).catch(() => {
      if (!cancelled) setLoaded({ ...context, state: { kind: "error", message: "Fictional Dark Web examples could not be loaded. No provider request was made." } });
    });
    return () => { cancelled = true; };
  }, [mode, customerId, customers, customersFailed, attempt]);
  return {
    state: mode === "demo" && customersFailed ? { kind: "error" as const, message: "Customer directory unavailable. Retry it using the shared selector." } : visibleDarkWeb(loaded, mode, customerId, attempt, customers),
    scope: mode === "live" ? "Customer scope unavailable" : customerId === null ? "All Customers" : selectedCustomer?.name ?? "Customer scope unavailable",
    contextKey: `${mode}:${customerId}:${attempt}`,
    retry: () => setAttempt(value => value + 1),
  };
}
