"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { getTrainingProgram, getSimulationProgram, normalizeEducationProgram } from "@/services/education-programs";
import { visibleEducation, type LoadedEducation } from "@/components/security/education-view";
import type { ProgramKind } from "@/services/education-types";
import type { DashboardScope } from "@/services/dashboard-response";

export function useEducationProgram(program: ProgramKind) {
  const { mode } = useDashboardMode();
  const { view, selectedCustomer, customersState } = useCustomerView();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const failed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedEducation>({ program, mode, customerId, attempt, registry, state: { kind: "loading" } });
  useEffect(() => {
    const context = { program, mode, customerId, attempt, registry };
    if (mode !== "demo") { setLoaded({ ...context, state: { kind: "unavailable" } }); return; }
    let cancelled = false;
    setLoaded({ ...context, state: { kind: "loading" } });
    if (failed || !registry || (customerId !== null && !registry.some(customer => customer.id === customerId))) return;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    const request = program === "training" ? getTrainingProgram : getSimulationProgram;
    request(scope).then(response => {
      if (!cancelled) setLoaded({ ...context, state: normalizeEducationProgram(response, program, scope, registry) });
    }).catch(() => {
      if (!cancelled) setLoaded({ ...context, state: { kind: "error", message: "Fictional program examples could not be loaded. No delivery or provider request occurred." } });
    });
    return () => { cancelled = true; };
  }, [program, mode, customerId, attempt, registry, failed]);
  return {
    state: mode === "demo" && failed ? { kind: "error" as const, message: "Customer directory unavailable. Retry using the shared customer selector." } : visibleEducation(loaded, program, mode, customerId, attempt, registry),
    scope: mode === "live" ? "Customer scope unavailable" : customerId === null ? "All Customers" : selectedCustomer?.name ?? "Customer scope unavailable",
    customerId, contextKey: `${program}:${mode}:${customerId}:${attempt}`, retry: () => setAttempt(value => value + 1),
  };
}
