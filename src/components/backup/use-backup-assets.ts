"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleBackupAssets, type LoadedBackupAssets } from "@/components/backup/protected-assets-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { getDemoBackupAssets, normalizeDemoBackupAssets } from "@/services/backup-assets";

export function useBackupAssets() {
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const customers = customersState.status === "ready" ? customersState.customers : null;
  const customersFailed = customersState.status === "error";
  const [loaded, setLoaded] = useState<LoadedBackupAssets & { registry: typeof customers }>(() => ({ mode, customerId, registry: customers, state: { kind: "loading" } }));

  useEffect(() => {
    if (mode !== "demo") return;
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    if (customersFailed) {
      setLoaded({ mode, customerId, registry: customers, state: { kind: "error", message: "The customer list is unavailable." } });
      return;
    }
    setLoaded({ mode, customerId, registry: customers, state: { kind: "loading" } });
    if (!customers || (customerId !== null && !customers.some(customer => customer.id === customerId))) return;

    getDemoBackupAssets(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, registry: customers, state: normalizeDemoBackupAssets(response, scope, customers) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, registry: customers, state: { kind: "error", message: "Example assets could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, customers, customersFailed]);

  if (mode === "demo" && customersFailed) return { kind: "error" as const, message: "The customer list is unavailable." };
  if (mode === "demo" && customerId !== null && customers && !customers.some(customer => customer.id === customerId)) return { kind: "error" as const, message: "Selected customer is unavailable." };
  if (mode === "demo" && (!customers || loaded.registry !== customers)) return { kind: "loading" as const };
  return visibleBackupAssets(loaded, mode, customerId);
}
