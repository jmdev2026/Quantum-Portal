"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleBackupJobs, type LoadedBackupJobs } from "@/components/backup/backup-job-activity-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { getDemoBackupJobActivity, normalizeDemoBackupJobActivity } from "@/services/backup-job-activity";

export function useBackupJobActivity() {
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const customers = customersState.status === "ready" ? customersState.customers : null;
  const customersFailed = customersState.status === "error";
  const [loaded, setLoaded] = useState<LoadedBackupJobs>(() => ({ mode, customerId, state: { kind: "loading" } }));

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

    getDemoBackupJobActivity(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, state: normalizeDemoBackupJobActivity(response, scope, customers) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, state: { kind: "error", message: "Example job activity could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, customers, customersFailed]);

  return visibleBackupJobs(loaded, mode, customerId);
}
