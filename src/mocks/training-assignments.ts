import { trainingCampaignsResponse } from "@/mocks/training-campaigns";
import { trainingParticipantsResponse } from "@/mocks/training-participants";
import { ASSIGNMENT_STATES, AUTHORING_DATE, EDUCATION_SOURCE, type TrainingAssignment } from "@/services/education-types";

export const trainingAssignmentsResponse: { data: TrainingAssignment[] } = { data: trainingCampaignsResponse.data.flatMap(campaign => trainingParticipantsResponse.data.filter(participant => participant.customer.id === campaign.customer.id).map((participant, index) => {
  const state = ASSIGNMENT_STATES[(index + Number(campaign.id.slice(-2)) - 1) % ASSIGNMENT_STATES.length];
  return { id: campaign.id.replace("campaign", "assignment") + "-" + participant.id.slice(-2), campaign: { id: campaign.id }, participant: { id: participant.id }, customer: { ...campaign.customer }, state, progress: state === "completed" ? 100 : state === "in-progress" ? 50 : 0, source: EDUCATION_SOURCE, is_demo: true, created_at: AUTHORING_DATE };
})) };
