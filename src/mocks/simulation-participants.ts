import { customersResponse } from "@/mocks/customers";
import { AUTHORING_DATE, EDUCATION_SOURCE, type ProgramParticipant } from "@/services/education-types";

export const simulationParticipantsResponse: { data: ProgramParticipant[] } = { data: customersResponse.data.flatMap(customer => [1, 2, 3].map(index => {
  const letter = customer.name.slice(-1);
  return { id: `sim-participant-${letter.toLowerCase()}-0${index}`, label: `Fictional Simulation Participant ${letter}-0${index}`, customer: { id: customer.id, name: customer.name }, source: EDUCATION_SOURCE, is_demo: true, created_at: AUTHORING_DATE };
})) };
