"use client";

import { useEffect, useState } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { visibleBackupExamples, type BackupExplorerKind, type LoadedBackupExamples } from "@/components/backup/backup-explorer-view";
import { getDemoBackupAssets, normalizeDemoBackupAssets } from "@/services/backup-assets";
import { getDemoBackupJobActivity, normalizeDemoBackupJobActivity } from "@/services/backup-job-activity";
import type { DashboardScope } from "@/services/dashboard-response";

export function useBackupExplorer(kind: BackupExplorerKind) {
  const { view, selectedCustomer, customersState } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const failed = customersState.status === "error";
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedBackupExamples>({ kind, mode, customerId, registry, attempt, state: { kind: "loading" } });
  useEffect(() => {
    const context = { kind, mode, customerId, registry, attempt };
    if (mode !== "demo") { setLoaded({ ...context, state: { kind: "unavailable" } }); return; }
    let cancelled = false;
    setLoaded({ ...context, state: { kind: "loading" } });
    if (failed || !registry || (customerId !== null && !registry.some(customer => customer.id === customerId))) return;
    const scope: DashboardScope = customerId === null ? { type: "all" } : { type: "customer", customer_id: customerId };
    const request = kind === "assets" ? getDemoBackupAssets(scope).then(response => normalizeDemoBackupAssets(response, scope, registry)) : getDemoBackupJobActivity(scope).then(response => normalizeDemoBackupJobActivity(response, scope, registry));
    request.then(state => { if (!cancelled) setLoaded({ ...context, state }); }).catch(() => { if (!cancelled) setLoaded({ ...context, state: { kind: "error", message: "Fictional Backup examples could not be loaded." } }); });
    return () => { cancelled = true; };
  }, [kind, mode, customerId, registry, attempt, failed]);
  return {
    state: mode === "demo" && failed ? { kind: "error" as const, message: "Customer directory unavailable. Retry using the shared customer selector." } : visibleBackupExamples(loaded, kind, mode, customerId, registry, attempt),
    scope: mode === "live" ? "Customer scope unavailable" : customerId === null ? "All Customers" : selectedCustomer?.name ?? "Customer scope unavailable",
    contextKey: `${kind}:${mode}:${customerId}:${attempt}`, retry: () => setAttempt(value => value + 1),
  };
}
