"use client";
import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { getApplicationData, type ApplicationState } from "@/services/application-experience";
export function useApplicationData() {
  const { view, customersState, selectedCustomer } = useCustomerView(); const { mode } = useDashboardMode();
  const selected = view.mode === "customer" ? view.customerId : null; const registry = customersState.status === "ready" ? customersState.customers : null;
  const [attempt, setAttempt] = useState(0); const [loaded, setLoaded] = useState<{ selected: number | null; registry: typeof registry; attempt: number; state: ApplicationState } | null>(null);
  useEffect(() => {
    if (mode !== "demo" || !registry) return;
    let active = true; const scope = selected === null ? { type: "all" as const } : { type: "customer" as const, customer_id: selected };
    getApplicationData(scope, registry, mode).then(state => { if (active) setLoaded({ selected, registry, attempt, state }); }).catch(() => { if (active) setLoaded({ selected, registry, attempt, state: { kind: "error", message: "Application examples could not be loaded. Retry the current scope." } }); });
    return () => { active = false; };
  }, [mode, selected, registry, attempt]);
  const valid = mode === "demo" && registry !== null && (selected === null || registry.some(item => item.id === selected));
  const state: ApplicationState = !valid ? { kind: "unavailable" } : !loaded || loaded.selected !== selected || loaded.registry !== registry || loaded.attempt !== attempt ? { kind: "loading" } : loaded.state;
  return { state, retry: () => setAttempt(attempt + 1), selected, registry, scopeName: selected === null ? "All Customers" : selectedCustomer?.name ?? "Customer unavailable", attempt };
}
