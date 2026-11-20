import { customersResponse } from "@/mocks/customers";
import { simulationScenariosResponse } from "@/mocks/simulation-scenarios";
import { AUTHORING_DATE, EDUCATION_SOURCE, type ProgramCampaign } from "@/services/education-types";

export const simulationCampaignsResponse: { data: ProgramCampaign[] } = { data: customersResponse.data.flatMap((customer, customerIndex) => [1, 2].map(index => {
  const letter = customer.name.slice(-1);
  return { id: `sim-campaign-${letter.toLowerCase()}-0${index}`, title: `Fictional simulation exercise ${letter}-0${index}`, customer: { id: customer.id, name: customer.name }, content: { id: simulationScenariosResponse.data[(customerIndex * 2 + index - 1) % simulationScenariosResponse.data.length].id }, state: index === 1 ? "program-preview" : "review-preview", description: "Fictional educational exercise linking inert scenario concepts and synthetic outcome flags. No message has been sent or tracked.", source: EDUCATION_SOURCE, is_demo: true, created_at: AUTHORING_DATE };
})) };
