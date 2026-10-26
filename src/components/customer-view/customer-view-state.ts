import type { Customer } from "@/services/customers";

export type CustomerView = { mode: "all" } | { mode: "customer"; customerId: number };

export type CustomerViewState = {
  view: CustomerView;
  notice: string | null;
};

export type CustomerViewAction =
  | { type: "select_all" }
  | { type: "select_customer"; customerId: number; customers: Customer[] | null }
  | { type: "reconcile"; customers: Customer[] };

export const initialCustomerViewState: CustomerViewState = { view: { mode: "all" }, notice: null };

const UNAVAILABLE_NOTICE = "The selected customer is no longer available. Showing all customers.";
const INVALID_NOTICE = "That customer could not be selected. Showing all customers.";

export function findSelectedCustomer(view: CustomerView, customers: Customer[] | null): Customer | null {
  if (view.mode !== "customer" || !customers) return null;
  return customers.find((customer) => customer.id === view.customerId) ?? null;
}

export function customerViewReducer(state: CustomerViewState, action: CustomerViewAction): CustomerViewState {
  switch (action.type) {
    case "select_all":
      return initialCustomerViewState;
    case "select_customer": {
      const valid =
        Number.isInteger(action.customerId) &&
        action.customers !== null &&
        action.customers.some((customer) => customer.id === action.customerId);
      if (!valid) return { view: { mode: "all" }, notice: INVALID_NOTICE };
      return { view: { mode: "customer", customerId: action.customerId }, notice: null };
    }
    case "reconcile":
      if (findSelectedCustomer(state.view, action.customers) || state.view.mode === "all") return state;
      return { view: { mode: "all" }, notice: UNAVAILABLE_NOTICE };
  }
}
