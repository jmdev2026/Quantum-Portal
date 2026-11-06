"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { backupHealthSource, visibleBackupHealth, type LoadedBackupHealth } from "@/components/dashboard/backup-health-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeBackupHealth } from "@/services/backup-health";

export function useBackupHealth() {
  const { view } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const [loaded, setLoaded] = useState<LoadedBackupHealth>(() => ({ mode, customerId, state: { kind: "loading" } }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ mode, customerId, state: { kind: "loading" } });

    backupHealthSource(mode)(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ mode, customerId, state: normalizeBackupHealth(response, scope) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ mode, customerId, state: { kind: "error", message: "Backup health could not be loaded." } });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customerId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state: visibleBackupHealth(loaded, mode, customerId), simulated: mode === "demo", retry };
}
