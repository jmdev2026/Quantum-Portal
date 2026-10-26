import { customersResponse } from "@/mocks/customers";

export type Customer = {
  id: number;
  name: string;
  slug: string;
  status: "active" | "inactive";
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerListResponse = {
  data: Customer[];
  meta: { current_page: number; total: number };
};

// TODO(api): GET /api/customers — list customers the signed-in user is authorized to view
// request: { page?: number }
// response: { data: [{ id, name, slug, status, is_demo, created_at, updated_at }], meta: { current_page, total } }
export async function getCustomers(): Promise<CustomerListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return customersResponse;
}
