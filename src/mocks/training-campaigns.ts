import { customersResponse } from "@/mocks/customers";
import { trainingCoursesResponse } from "@/mocks/training-courses";
import { AUTHORING_DATE, EDUCATION_SOURCE, type ProgramCampaign } from "@/services/education-types";

export const trainingCampaignsResponse: { data: ProgramCampaign[] } = { data: customersResponse.data.flatMap((customer, customerIndex) => [1, 2].map(index => {
  const letter = customer.name.slice(-1);
  return { id: `tr-campaign-${letter.toLowerCase()}-0${index}`, title: `Fictional training program ${letter}-0${index}`, customer: { id: customer.id, name: customer.name }, content: { id: trainingCoursesResponse.data[customerIndex * 2 + index - 1].id }, state: index === 1 ? "program-preview" : "review-preview", description: "Fictional program illustration linking descriptive course information and synthetic assignments. No employee has been enrolled or trained.", source: EDUCATION_SOURCE, is_demo: true, created_at: AUTHORING_DATE };
})) };
