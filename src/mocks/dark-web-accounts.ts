import { customersResponse } from "@/mocks/customers";
import { DARK_WEB_SOURCE, type DarkWebAccount } from "@/services/dark-web-types";

export const darkWebAccountsResponse: { data: DarkWebAccount[] } = {
  data: customersResponse.data.map(customer => {
    const letter = customer.name.slice(-1).toLowerCase();
    return {
      id: `dw-account-${letter}-01`,
      label: `Fictional Exposure Account ${customer.name.slice(-1)}-01`,
      customer: { id: customer.id, name: customer.name },
      domain: { id: `dw-domain-${letter}` },
      finding_ids: [`dw-finding-${letter}-01`, `dw-finding-${letter}-02`],
      source: DARK_WEB_SOURCE,
      is_demo: true,
      created_at: "2026-11-01T10:00:00Z",
    };
  }),
};
