"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleVisibilityRecords, type LoadedVisibilityRecords } from "@/components/security/identities-endpoints-view";
import type { DashboardScope } from "@/services/dashboard-response";
import {
  getDemoVisibilityRecords,
  normalizeDemoVisibilityRecords,
  type VisibilityRecordKind,
} from "@/services/security-visibility-records";

export function useVisibilityRecords(kind: VisibilityRecordKind) {
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const customers = customersState.status === "ready" ? customersState.customers : null;
  const customersFailed = customersState.status === "error";
  const [loaded, setLoaded] = useState<LoadedVisibilityRecords>(() => ({ mode, customerId, state: { kind: "loading" } }));

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

    getDemoVisibilityRecords(kind, scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, state: normalizeDemoVisibilityRecords(response, kind, scope, customers) });
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ mode, customerId, state: { kind: "error", message: "Demonstration records could not be loaded." } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kind, mode, customerId, customers, customersFailed]);

  return visibleVisibilityRecords(loaded, mode, customerId);
}
