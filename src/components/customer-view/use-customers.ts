"use client";

import { useCallback, useEffect, useState } from "react";
import { getCustomers, type Customer } from "@/services/customers";

export type CustomersState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; customers: Customer[] };

export function useCustomers() {
  const [state, setState] = useState<CustomersState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await getCustomers();
      if (!response || !Array.isArray(response.data)) {
        setState({ status: "error", message: "Customer list came back in an unexpected format." });
        return;
      }
      setState({ status: "ready", customers: response.data });
    } catch {
      setState({ status: "error", message: "Customers could not be loaded." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
