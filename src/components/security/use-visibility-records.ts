"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { demoScopeBoundary } from "@/components/customer-view/demo-scope-boundary";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleVisibilityRecords, type LoadedVisibilityRecords } from "@/components/security/identities-endpoints-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { getDemoVisibilityRecords, normalizeDemoVisibilityRecords, type VisibilityRecordKind, type VisibilityRecordsState } from "@/services/security-visibility-records";
import type { KnownCustomer } from "@/services/security-detections";

type Loaded = LoadedVisibilityRecords & { registry: readonly KnownCustomer[] | null; attempt: number; recordKind: VisibilityRecordKind };

export function useVisibilityExplorer(kind: VisibilityRecordKind) {
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const customers = customersState.status === "ready" ? customersState.customers : null;
  const customersFailed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>(() => ({ mode, customerId, registry: customers, attempt, recordKind: kind, state: { kind: "loading" } }));

  useEffect(() => {
    if (mode !== "demo") return;
    let cancelled = false;
    const context = { mode, customerId, registry: customers, attempt, recordKind: kind };
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ ...context, state: { kind: "loading" } });
    if (demoScopeBoundary(mode, customerId, customers, customersFailed)) return;
    getDemoVisibilityRecords(kind, scope)
      .then((response) => {
        if (!cancelled) setLoaded({ ...context, state: normalizeDemoVisibilityRecords(response, kind, scope, customers!) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ ...context, state: { kind: "error", message: "Demonstration records could not be loaded." } });
      });
    return () => { cancelled = true; };
  }, [kind, mode, customerId, customers, customersFailed, attempt]);

  const retry = useCallback(() => setAttempt(count => count + 1), []);
  const boundary = demoScopeBoundary(mode, customerId, customers, customersFailed);
  const state: VisibilityRecordsState = boundary ?? (loaded.registry !== customers || loaded.attempt !== attempt || loaded.recordKind !== kind ? { kind: "loading" } : visibleVisibilityRecords(loaded, mode, customerId));
  return { state, retry, contextKey: `${kind}:${mode}:${customerId}:${attempt}` };
}

export function useVisibilityRecords(kind: VisibilityRecordKind) {
  return useVisibilityExplorer(kind).state;
}
