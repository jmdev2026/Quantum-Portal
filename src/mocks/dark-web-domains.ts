import { customersResponse } from "@/mocks/customers";
import { DARK_WEB_SOURCE, type DarkWebDomain } from "@/services/dark-web-types";

const reservedDomains = ["demo-a.example.com", "demo-b.example.net", "demo-c.example.org"] as const;
export const darkWebDomainsResponse: { data: DarkWebDomain[] } = {
  data: customersResponse.data.map((customer, index) => ({
    id: `dw-domain-${customer.name.slice(-1).toLowerCase()}`,
    label: `Fictional Domain ${customer.name.slice(-1)}`,
    domain: reservedDomains[index],
    customer: { id: customer.id, name: customer.name },
    monitoring_status: "demo-preview",
    source: DARK_WEB_SOURCE,
    is_demo: true,
    created_at: "2026-11-01T10:00:00Z",
  })),
};
