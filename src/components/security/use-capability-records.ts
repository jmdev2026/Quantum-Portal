"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleCapabilityState, type LoadedCapability } from "@/components/security/capability-explorer-view";
import { getCapabilityRecords } from "@/services/security-capabilities";
import type { CapabilityId } from "@/services/security-capability-types";
import type { DashboardScope } from "@/services/dashboard-response";

export function useCapabilityRecords(capability: CapabilityId) {
  const { mode } = useDashboardMode();
  const { view, customersState, selectedCustomer } = useCustomerView();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const customers = customersState.status === "ready" ? customersState.customers : null;
  const customersFailed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedCapability>({ capability, mode, customerId, attempt, state: { kind: "loading" } });
  useEffect(() => {
    if (mode !== "demo") {
      setLoaded({ capability, mode, customerId, attempt, state: { kind: "unavailable" } });
      return;
    }
    let cancelled = false;
    const context = { capability, mode, customerId, attempt };
    setLoaded({ ...context, state: { kind: "loading" } });
    if (customersFailed) { setLoaded({ ...context, state: { kind: "error", message: "Customer scope could not be verified. Retry the customer directory using the shared selector." } }); return; }
    if (!customers) return;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    getCapabilityRecords(capability, scope, customers).then(state => {
      if (!cancelled) setLoaded({ ...context, state });
    }).catch(() => {
      if (!cancelled) setLoaded({ ...context, state: { kind: "error", message: "Fictional observations could not be loaded. No provider request was made." } });
    });
    return () => { cancelled = true; };
  }, [capability, mode, customerId, customers, customersFailed, attempt]);
  const visible = visibleCapabilityState(loaded, capability, mode, customerId, attempt);
  const registryMismatch = customers && visible.kind === "ready" && visible.records.some(record => !customers.some(customer => customer.id === record.customerId && customer.name === record.customerName));
  const state = mode === "live" ? visible : customersFailed || registryMismatch ? { kind: "error" as const, message: "Customer scope could not be verified." } : !customers ? { kind: "loading" as const } : visible;
  return {
    state,
    scope: mode === "live" ? "Customer scope unavailable" : customerId === null ? "All Customers" : selectedCustomer?.name ?? "Customer scope unavailable",
    demo: mode === "demo",
    contextKey: `${capability}:${mode}:${customerId}:${attempt}`,
    retry: () => setAttempt(value => value + 1),
  };
}
