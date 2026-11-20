import { trainingCoursesResponse } from "@/mocks/training-courses";
import { trainingCampaignsResponse } from "@/mocks/training-campaigns";
import { trainingParticipantsResponse } from "@/mocks/training-participants";
import { trainingAssignmentsResponse } from "@/mocks/training-assignments";
import { simulationScenariosResponse } from "@/mocks/simulation-scenarios";
import { simulationCampaignsResponse } from "@/mocks/simulation-campaigns";
import { simulationParticipantsResponse } from "@/mocks/simulation-participants";
import { simulationOutcomesResponse } from "@/mocks/simulation-outcomes";
import { isRecord, parseScope, sameScope, parseInstant, type DashboardScope } from "@/services/dashboard-response";
import type { KnownCustomer } from "@/services/security-detections";
import { AUTHORING_DATE, EDUCATION_SOURCE, CAMPAIGN_STATES, ASSIGNMENT_STATES, type ProgramKind, type EducationResponse, type EducationData, type EducationState } from "@/services/education-types";

const fixtures = (kind: ProgramKind): EducationData => kind === "training" ? { campaigns: trainingCampaignsResponse.data, participants: trainingParticipantsResponse.data, records: trainingAssignmentsResponse.data, catalog: trainingCoursesResponse.data } : { campaigns: simulationCampaignsResponse.data, participants: simulationParticipantsResponse.data, records: simulationOutcomesResponse.data, catalog: simulationScenariosResponse.data };
async function scopedProgram(kind: ProgramKind, scope: DashboardScope): Promise<EducationResponse> {
  await new Promise(resolve => setTimeout(resolve, 250));
  const data = fixtures(kind);
  const valid = scope.type === "all" || data.campaigns.some(campaign => campaign.customer.id === scope.customer_id);
  const inScope = (row: { customer: { id: number } }) => valid && (scope.type === "all" || row.customer.id === scope.customer_id);
  return structuredClone({ data: { campaigns: data.campaigns.filter(inScope), participants: data.participants.filter(inScope), records: data.records.filter(inScope), catalog: valid ? data.catalog : [] }, meta: { scope, program: kind, source: EDUCATION_SOURCE, status: valid ? "ready" : "error", message: valid ? null : "Fictional program scope is unavailable." } });
}
// TODO(api): GET /api/security/awareness-training — provisional application-owned program read, not an approved provider contract
// request: { scope }
// response: { data: { campaigns, participants, records, catalog }, meta: { scope, program, source, status, message } }
export const getTrainingProgram = (scope: DashboardScope) => scopedProgram("training", scope);
// TODO(api): GET /api/security/phishing-simulations — provisional application-owned simulation read, not an approved provider contract
// request: { scope }
// response: { data: { campaigns, participants, records, catalog }, meta: { scope, program, source, status, message } }
export const getSimulationProgram = (scope: DashboardScope) => scopedProgram("simulation", scope);

const exact = (row: Record<string, unknown>, fields: string[]) => Object.keys(row).sort().join() === [...fields].sort().join();
const metadata = ["source", "is_demo", "created_at"];
const invalid = (): EducationState => ({ kind: "error", message: "Program examples are invalid or do not match the authorized viewing scope and fictional relationships." });
const reference = (value: unknown): value is { id: string } => isRecord(value) && exact(value, ["id"]) && typeof value.id === "string";
export function normalizeEducationProgram(response: unknown, kind: ProgramKind, requested: DashboardScope, customers: readonly KnownCustomer[]): EducationState {
  const registry = new Map(customers.map(customer => [customer.id, customer.name]));
  if (!parseScope(requested) || (requested.type === "customer" && !registry.has(requested.customer_id))) return invalid();
  if (!isRecord(response) || !exact(response, ["data", "meta"]) || !isRecord(response.meta) || !isRecord(response.data)) return invalid();
  const meta = response.meta;
  const scope = parseScope(meta.scope);
  if (!exact(meta, ["scope", "program", "source", "status", "message"]) || !scope || !sameScope(scope, requested) || !isRecord(meta.scope) || !exact(meta.scope, scope.type === "all" ? ["type"] : ["type", "customer_id"]) || meta.program !== kind || meta.source !== EDUCATION_SOURCE || meta.status !== "ready" || meta.message !== null) return invalid();
  const data = response.data;
  if (!exact(data, ["campaigns", "participants", "records", "catalog"]) || !Array.isArray(data.campaigns) || !Array.isArray(data.participants) || !Array.isArray(data.records) || !Array.isArray(data.catalog) || [data.campaigns, data.participants, data.records, data.catalog].some(rows => rows.length > 60)) return invalid();
  const seen = new Set<string>();
  const authored = fixtures(kind);
  const prefix = kind === "training" ? "tr" : "sim";
  function base(row: unknown, fields: string[], scoped: boolean): row is Record<string, unknown> {
    if (!isRecord(row) || !exact(row, [...metadata, ...fields, ...(scoped ? ["customer"] : [])]) || typeof row.id !== "string" || seen.has(row.id) || row.source !== EDUCATION_SOURCE || row.is_demo !== true || row.created_at !== AUTHORING_DATE || parseInstant(row.created_at) === null) return false;
    if (scoped) {
      if (!isRecord(row.customer) || !exact(row.customer, ["id", "name"]) || typeof row.customer.id !== "number" || !Number.isSafeInteger(row.customer.id) || registry.get(row.customer.id) !== row.customer.name || (requested.type === "customer" && row.customer.id !== requested.customer_id)) return false;
    }
    seen.add(row.id);
    return true;
  }
  const catalog = new Set<string>();
  for (const item of data.catalog) {
    if (!base(item, ["id", "title", "category", "description", "indicators"], false)) return invalid();
    const original = authored.catalog.find(content => content.id === item.id);
    if (!original || item.title !== original.title || item.category !== original.category || item.description !== original.description || !Array.isArray(item.indicators) || JSON.stringify(item.indicators) !== JSON.stringify(original.indicators)) return invalid();
    catalog.add(item.id as string);
  }
  const campaigns = new Map<string, Record<string, unknown>>();
  for (const campaign of data.campaigns) {
    if (!base(campaign, ["id", "title", "content", "state", "description"], true) || !reference(campaign.content) || !catalog.has(campaign.content.id) || !(CAMPAIGN_STATES as readonly unknown[]).includes(campaign.state)) return invalid();
    const original = authored.campaigns.find(item => item.id === campaign.id);
    const customer = campaign.customer as KnownCustomer;
    if (!original || original.customer.id !== customer.id || campaign.title !== original.title || campaign.description !== original.description || campaign.content.id !== original.content.id) return invalid();
    campaigns.set(campaign.id as string, campaign);
  }
  const participants = new Map<string, Record<string, unknown>>();
  for (const participant of data.participants) {
    if (!base(participant, ["id", "label"], true)) return invalid();
    const original = authored.participants.find(item => item.id === participant.id);
    if (!original || participant.label !== original.label || (participant.customer as KnownCustomer).id !== original.customer.id) return invalid();
    participants.set(participant.id as string, participant);
  }
  const pairs = new Set<string>();
  for (const record of data.records) {
    const fields = kind === "training" ? ["id", "campaign", "participant", "state", "progress"] : ["id", "campaign", "participant", "delivered", "interacted", "reported"];
    if (!base(record, fields, true) || !reference(record.campaign) || !reference(record.participant)) return invalid();
    const campaign = campaigns.get(record.campaign.id);
    const participant = participants.get(record.participant.id);
    const customer = record.customer as KnownCustomer;
    if (!campaign || !participant || (campaign.customer as KnownCustomer).id !== customer.id || (participant.customer as KnownCustomer).id !== customer.id) return invalid();
    const expected = record.campaign.id.replace("campaign", kind === "training" ? "assignment" : "outcome") + "-" + record.participant.id.slice(-2);
    const pair = `${record.campaign.id}:${record.participant.id}`;
    if (record.id !== expected || !record.campaign.id.startsWith(prefix + "-") || pairs.has(pair)) return invalid();
    pairs.add(pair);
    if (kind === "training") {
      if (!(ASSIGNMENT_STATES as readonly unknown[]).includes(record.state) || typeof record.progress !== "number" || !Number.isSafeInteger(record.progress) || record.progress < 0 || record.progress > 100 || (record.state === "completed" && record.progress !== 100) || (record.state === "not-started" && record.progress !== 0) || (record.state === "in-progress" && (record.progress === 0 || record.progress === 100))) return invalid();
    } else if (typeof record.delivered !== "boolean" || typeof record.interacted !== "boolean" || typeof record.reported !== "boolean" || (!record.delivered && (record.interacted || record.reported))) return invalid();
  }
  return { kind: "ready", data: structuredClone(data) as EducationData };
}
