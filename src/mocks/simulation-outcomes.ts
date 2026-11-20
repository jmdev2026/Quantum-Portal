import { simulationCampaignsResponse } from "@/mocks/simulation-campaigns";
import { simulationParticipantsResponse } from "@/mocks/simulation-participants";
import { AUTHORING_DATE, EDUCATION_SOURCE, type SimulationOutcome } from "@/services/education-types";

export const simulationOutcomesResponse: { data: SimulationOutcome[] } = { data: simulationCampaignsResponse.data.flatMap(campaign => simulationParticipantsResponse.data.filter(participant => participant.customer.id === campaign.customer.id).map((participant, index) => {
  const first = campaign.id.endsWith("01");
  return { id: campaign.id.replace("campaign", "outcome") + "-" + participant.id.slice(-2), campaign: { id: campaign.id }, participant: { id: participant.id }, customer: { ...campaign.customer }, delivered: index < 2, interacted: index === 0, reported: first && index < 2, source: EDUCATION_SOURCE, is_demo: true, created_at: AUTHORING_DATE };
})) };
