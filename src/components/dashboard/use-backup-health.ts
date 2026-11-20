"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { backupHealthSource, visibleBackupHealth, type LoadedBackupHealth } from "@/components/dashboard/backup-health-view";
import type { DashboardScope } from "@/services/dashboard-response";
import { normalizeBackupHealth, type BackupHealthState } from "@/services/backup-health";
import type { KnownCustomer } from "@/services/security-detections";

type Loaded = LoadedBackupHealth & { registry: readonly KnownCustomer[] | null; attempt: number };

export function useBackupHealth() {
  const { view, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const failed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>(() => ({ mode, customerId, registry, attempt, state: { kind: "loading" } }));

  useEffect(() => {
    let cancelled = false;
    const context = { mode, customerId, registry, attempt };
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    setLoaded({ ...context, state: { kind: "loading" } });
    if (mode !== "demo" || failed || !registry || (customerId !== null && !registry.some(customer => customer.id === customerId))) return;
    backupHealthSource(mode)(scope)
      .then((response) => {
        if (!cancelled) setLoaded({ ...context, state: normalizeBackupHealth(response, scope) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ ...context, state: { kind: "error", message: "Backup health could not be loaded." } });
      });
    return () => { cancelled = true; };
  }, [mode, customerId, attempt, registry, failed]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  let state: BackupHealthState;
  if (mode === "live") state = { kind: "unavailable", source: null, lastSyncedAt: null };
  else if (failed) state = { kind: "error", message: "Customer directory unavailable. Retry using the shared customer selector." };
  else if (!registry) state = { kind: "loading" };
  else if (customerId !== null && !registry.some(customer => customer.id === customerId)) state = { kind: "error", message: "Selected customer is unavailable. No broader scope was loaded." };
  else if (loaded.registry !== registry || loaded.attempt !== attempt) state = { kind: "loading" };
  else state = visibleBackupHealth(loaded, mode, customerId);
  return { state, simulated: mode === "demo", retry, contextKey: `${mode}:${customerId}:${attempt}` };
}
