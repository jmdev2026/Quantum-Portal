import { customersResponse } from "@/mocks/customers";
import { DARK_WEB_SOURCE, type ExposureFinding } from "@/services/dark-web-types";
import type { SeverityLevel } from "@/services/security-severity";

const severities: readonly (readonly SeverityLevel[])[] = [["high", "medium"], ["critical", "low"], ["medium", "high"]];
export const darkWebFindingsResponse: { data: ExposureFinding[] } = {
  data: customersResponse.data.flatMap((customer, customerIndex) => [0, 1].map(index => {
    const letter = customer.name.slice(-1).toLowerCase();
    const suffix = `${customer.name.slice(-1)}-0${index + 1}`;
    return {
      id: `dw-finding-${suffix.toLowerCase()}`,
      title: `Fictional exposure scenario ${suffix}`,
      customer: { id: customer.id, name: customer.name },
      domain: { id: `dw-domain-${letter}` },
      account: { id: `dw-account-${letter}-01` },
      category: index === 1 ? "domain-mention" : customerIndex === 2 ? "access-review" : "account-mention",
      severity: severities[customerIndex][index],
      review_status: index === 0 ? "unreviewed" : "review-example",
      observation: index === 0 ? "Fictional account-reference appearance scenario for an illustrative access review. No credentials, actual breach evidence or verified compromise are supplied." : "Fictional reserved-domain mention scenario for a policy review. No real source, breach discovery, ownership verification or monitoring activity is represented.",
      response_category: index === 1 ? "policy-review" : customerIndex === 2 ? "administrator-review" : "access-review",
      source: DARK_WEB_SOURCE,
      is_demo: true,
      created_at: "2026-11-01T10:00:00Z",
    };
  })),
};
