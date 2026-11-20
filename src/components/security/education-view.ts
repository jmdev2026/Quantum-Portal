import { CAMPAIGN_STATES, ASSIGNMENT_STATES, ASSIGNMENT_SETTINGS, OUTCOME_FILTERS, isAssignment, type ProgramKind, type EducationData, type EducationState, type ProgramRecord, type SimulationOutcome, type EducationSelection, type EducationDraft } from "@/services/education-types";
import type { KnownCustomer } from "@/services/security-detections";

export const educationLabel = (value: string) => value.replaceAll("-", " ");
export const ratio = (numerator: number, denominator: number) => denominator === 0 ? null : numerator / denominator * 100;
export const rateLabel = (value: number | null) => value === null ? "Not applicable · no eligible denominator" : `${value.toFixed(1)}%`;
export function trainingMetrics(records: readonly ProgramRecord[]) {
  const assignments = records.filter(isAssignment);
  const completed = assignments.filter(record => record.state === "completed").length;
  return { eligible: assignments.length, assignedParticipants: new Set(assignments.map(record => record.participant.id)).size, completed, inProgress: assignments.filter(record => record.state === "in-progress").length, notStarted: assignments.filter(record => record.state === "not-started").length, completionRate: ratio(completed, assignments.length) };
}
export function simulationMetrics(records: readonly ProgramRecord[]) {
  const outcomes = records.filter((record): record is SimulationOutcome => !isAssignment(record));
  const delivered = outcomes.filter(record => record.delivered).length;
  const interacted = outcomes.filter(record => record.delivered && record.interacted).length;
  const reported = outcomes.filter(record => record.delivered && record.reported).length;
  return { eligible: outcomes.length, uniqueParticipants: new Set(outcomes.map(record => record.participant.id)).size, delivered, interacted, reported, noInteraction: outcomes.filter(record => record.delivered && !record.interacted && !record.reported).length, notDelivered: outcomes.filter(record => !record.delivered).length, both: outcomes.filter(record => record.interacted && record.reported).length, clickRate: ratio(interacted, delivered), reportRate: ratio(reported, delivered) };
}
export const campaignRecords = (data: EducationData, id: string) => data.records.filter(record => record.campaign.id === id);
export function outcomeMatches(record: SimulationOutcome, value: string) {
  return value === "all" || (value === "delivered" && record.delivered) || (value === "interacted" && record.interacted) || (value === "reported" && record.reported) || (value === "not-delivered" && !record.delivered) || (value === "no-interaction" && record.delivered && !record.interacted && !record.reported);
}
export const outcomeLabel = (record: SimulationOutcome) => !record.delivered ? "Not delivered (illustrative)" : ["Delivered (illustrative)", record.interacted ? "interacted with scenario" : "", record.reported ? "reported suspicious message" : "", !record.interacted && !record.reported ? "no recorded interaction" : ""].filter(Boolean).join(" · ");
export type EducationFilters = { search: string; category: string; state: string; campaign: string; sort: "name-asc" | "name-desc" | "state" };
export const resetEducationFilters = (): EducationFilters => ({ search: "", category: "all", state: "all", campaign: "all", sort: "name-asc" });
export function updateEducationFilters(filters: EducationFilters, field: keyof EducationFilters, value: string, data: EducationData, kind: ProgramKind, section: "campaigns" | "records"): EducationFilters {
  if (field === "search") return { ...filters, search: value.slice(0, 200) };
  const options = { category: ["all", ...data.catalog.map(content => content.category)], state: ["all", ...(section === "campaigns" ? CAMPAIGN_STATES : kind === "training" ? ASSIGNMENT_STATES : OUTCOME_FILTERS)], campaign: ["all", ...data.campaigns.map(campaign => campaign.id)], sort: ["name-asc", "name-desc", "state"] };
  return options[field].includes(value) ? { ...filters, [field]: value } : filters;
}
export function filterEducationCampaigns(data: EducationData, filters: EducationFilters) {
  const query = filters.search.trim().toLowerCase();
  return data.campaigns.filter(campaign => {
    const content = data.catalog.find(content => content.id === campaign.content.id)!;
    return [campaign.title, campaign.description, campaign.customer.name, content.title, content.category, campaign.state].join(" ").toLowerCase().includes(query) && (filters.category === "all" || content.category === filters.category) && (filters.state === "all" || campaign.state === filters.state);
  }).sort((a, b) => {
    const title = a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en");
    return filters.sort === "name-desc" ? -title : filters.sort === "state" ? a.state.localeCompare(b.state, "en") || title : title;
  });
}
export function filterEducationRecords(data: EducationData, filters: EducationFilters) {
  const query = filters.search.trim().toLowerCase();
  const label = (record: ProgramRecord) => data.participants.find(participant => participant.id === record.participant.id)!.label;
  const status = (record: ProgramRecord) => isAssignment(record) ? record.state : outcomeLabel(record);
  return data.records.filter(record => {
    const campaign = data.campaigns.find(campaign => campaign.id === record.campaign.id)!;
    const content = data.catalog.find(content => content.id === campaign.content.id)!;
    return [label(record), campaign.title, record.customer.name, content.title, content.category, status(record)].join(" ").toLowerCase().includes(query) && (filters.campaign === "all" || record.campaign.id === filters.campaign) && (filters.state === "all" || (isAssignment(record) ? record.state === filters.state : outcomeMatches(record, filters.state)));
  }).sort((a, b) => {
    const name = label(a).localeCompare(label(b), "en") || a.id.localeCompare(b.id, "en");
    return filters.sort === "name-desc" ? -name : filters.sort === "state" ? status(a).localeCompare(status(b), "en") || name : name;
  });
}
export function selectEducationDetail(state: EducationState, selection: EducationSelection | null) {
  if (state.kind !== "ready" || !selection) return null;
  if (selection.kind === "campaign") { const record = state.data.campaigns.find(record => record.id === selection.id); return record ? { kind: "campaign" as const, record } : null; }
  if (selection.kind === "record") { const record = state.data.records.find(record => record.id === selection.id); return record ? { kind: "record" as const, record } : null; }
  if (selection.kind === "content") { const record = state.data.catalog.find(record => record.id === selection.id); return record ? { kind: "content" as const, record } : null; }
  return null;
}
export function validateEducationDraft(draft: EducationDraft, data: EducationData, kind: ProgramKind, scopeId: number | null): string | null {
  const title = draft.title.trim();
  if (title.length < 12 || title.length > 80 || !/^Demo: [A-Za-z][A-Za-z .,(')-]+$/.test(title) || /www\.|[a-z]\.[a-z]{2,}/i.test(title)) return "Use a 12–80-character title starting with Demo: and words only; no addresses, links or personal information.";
  if (draft.customerId === null || (scopeId !== null && draft.customerId !== scopeId) || !data.participants.some(participant => participant.customer.id === draft.customerId)) return "Select a fictional customer within the current viewing scope.";
  if (!data.catalog.some(content => content.id === draft.contentId)) return "Select a supplied educational topic or scenario.";
  const settings: readonly string[] = kind === "training" ? ASSIGNMENT_SETTINGS : ["inert-scenario-preview"];
  if (!settings.includes(draft.setting)) return "Select an available preview-only setting.";
  if (!draft.participantIds.length || new Set(draft.participantIds).size !== draft.participantIds.length || draft.participantIds.some(id => !data.participants.some(participant => participant.id === id && participant.customer.id === draft.customerId))) return "Choose unique fictional participants belonging to the selected customer.";
  if (kind === "training" && data.records.some(record => draft.participantIds.includes(record.participant.id) && data.campaigns.some(campaign => campaign.id === record.campaign.id && campaign.content.id === draft.contentId))) return "A selected participant already has a fictional assignment for this topic. Choose another topic to avoid duplicate assignments.";
  return null;
}
export type EducationNavigation = { current: EducationSelection | null; history: EducationSelection[] };
export const closeEducationNavigation = (): EducationNavigation => ({ current: null, history: [] });
export function openEducationDetail(state: EducationState, nav: EducationNavigation, selection: EducationSelection, related = false): EducationNavigation {
  return selectEducationDetail(state, selection) ? { current: selection, history: related && nav.current ? [...nav.history, nav.current] : [] } : closeEducationNavigation();
}
export const backEducationDetail = (nav: EducationNavigation): EducationNavigation => ({ current: nav.history.at(-1) ?? null, history: nav.history.slice(0, -1) });
export type LoadedEducation = { program: ProgramKind; mode: "live" | "demo"; customerId: number | null; attempt: number; registry: readonly KnownCustomer[] | null; state: EducationState };
export function visibleEducation(loaded: LoadedEducation, program: ProgramKind, mode: "live" | "demo", customerId: number | null, attempt: number, registry: readonly KnownCustomer[] | null): EducationState {
  if (mode === "live") return { kind: "unavailable" };
  if (!registry) return { kind: "loading" };
  if (customerId !== null && (!Number.isSafeInteger(customerId) || customerId <= 0 || !registry.some(customer => customer.id === customerId))) return { kind: "error", message: "Invalid customer scope. No All Customers fallback is permitted." };
  if (loaded.program !== program || loaded.mode !== mode || loaded.customerId !== customerId || loaded.attempt !== attempt) return { kind: "loading" };
  if (loaded.state.kind === "ready") {
    const rows = [...loaded.state.data.campaigns, ...loaded.state.data.participants, ...loaded.state.data.records];
    if (rows.some(row => (customerId !== null && row.customer.id !== customerId) || !registry.some(customer => customer.id === row.customer.id && customer.name === row.customer.name))) return { kind: "error", message: "Customer scope changed; previous program examples are hidden." };
  }
  return loaded.registry !== registry ? { kind: "loading" } : loaded.state;
}
