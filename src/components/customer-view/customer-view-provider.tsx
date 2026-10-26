"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type { Customer } from "@/services/customers";
import { useCustomers, type CustomersState } from "@/components/customer-view/use-customers";
import {
  customerViewReducer,
  findSelectedCustomer,
  initialCustomerViewState,
  type CustomerView,
} from "@/components/customer-view/customer-view-state";

// UI viewing preference only. Never use it to authorize access; the backend enforces tenant permissions.
export type CustomerViewContextValue = {
  view: CustomerView;
  selectedCustomer: Customer | null;
  notice: string | null;
  customersState: CustomersState;
  reloadCustomers: () => Promise<void>;
  selectAll: () => void;
  selectCustomer: (customerId: number) => void;
};

const CustomerViewContext = createContext<CustomerViewContextValue | null>(null);

export function CustomerViewProvider({ children }: { children: React.ReactNode }) {
  const { state: customersState, reload } = useCustomers();
  const [state, dispatch] = useReducer(customerViewReducer, initialCustomerViewState);
  const customers = customersState.status === "ready" ? customersState.customers : null;

  useEffect(() => {
    if (customers) dispatch({ type: "reconcile", customers });
  }, [customers]);

  const selectAll = useCallback(() => dispatch({ type: "select_all" }), []);
  const selectCustomer = useCallback(
    (customerId: number) => dispatch({ type: "select_customer", customerId, customers }),
    [customers],
  );

  const value = useMemo<CustomerViewContextValue>(
    () => ({
      view: state.view,
      selectedCustomer: findSelectedCustomer(state.view, customers),
      notice: state.notice,
      customersState,
      reloadCustomers: reload,
      selectAll,
      selectCustomer,
    }),
    [state, customers, customersState, reload, selectAll, selectCustomer],
  );

  return <CustomerViewContext.Provider value={value}>{children}</CustomerViewContext.Provider>;
}

export function useCustomerView() {
  const context = useContext(CustomerViewContext);
  if (!context) throw new Error("useCustomerView must be used inside CustomerViewProvider");
  return context;
}
