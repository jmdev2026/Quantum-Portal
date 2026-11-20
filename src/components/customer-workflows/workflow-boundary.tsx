"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { demoScopeBoundary, profileScopeAllowed } from "@/components/customer-view/demo-scope-boundary";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { WorkflowState } from "@/components/customer-workflows/workflow-ui";

export function WorkflowBoundary({ children, profileId, requireAll = false }: { children: ReactNode; profileId?: number; requireAll?: boolean }) {
  const { view, customersState, reloadCustomers } = useCustomerView();
  const { mode } = useDashboardMode();
  const customerId = view.mode === "customer" ? view.customerId : null;
  const registry = customersState.status === "ready" ? customersState.customers : null;
  const [heldRegistry, setHeldRegistry] = useState(registry);
  useEffect(() => setHeldRegistry(registry), [registry]);
  const boundary = demoScopeBoundary(mode, customerId, registry, customersState.status === "error");
  if (boundary) return <WorkflowState {...boundary} retry={() => void reloadCustomers()} />;
  if (registry !== heldRegistry) return <WorkflowState kind="loading" />;
  if ((requireAll && customerId !== null) || (profileId !== undefined && !profileScopeAllowed(profileId, customerId, registry!))) return <WorkflowState kind="error" message={requireAll ? "This prospective organization preview requires All Customers. Change scope explicitly; no draft has been retained." : "Profile scope mismatch or unknown customer. Select this customer's scope explicitly from the customer portfolio. The route is not authorization."} />;
  return <div key={`${mode}:${customerId}:${profileId ?? "draft"}`} className="grid min-w-0 gap-6">{children}</div>;
}
