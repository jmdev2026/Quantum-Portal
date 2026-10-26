import type { CustomerListResponse } from "@/services/customers";

export const customersResponse: CustomerListResponse = {
  data: [
    {
      id: 1,
      name: "Demo Customer A",
      slug: "demo-customer-a",
      status: "active",
      is_demo: true,
      created_at: "2026-10-01T09:00:00Z",
      updated_at: "2026-10-20T14:30:00Z",
    },
    {
      id: 2,
      name: "Demo Customer B",
      slug: "demo-customer-b",
      status: "active",
      is_demo: true,
      created_at: "2026-10-03T11:15:00Z",
      updated_at: "2026-10-21T08:45:00Z",
    },
    {
      id: 3,
      name: "Demo Customer C",
      slug: "demo-customer-c",
      status: "active",
      is_demo: true,
      created_at: "2026-10-07T16:40:00Z",
      updated_at: "2026-10-22T10:05:00Z",
    },
  ],
  meta: { current_page: 1, total: 3 },
};
