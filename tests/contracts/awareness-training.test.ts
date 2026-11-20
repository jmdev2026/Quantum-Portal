import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTrainingProgram, normalizeEducationProgram } from "@/services/education-programs";
import { customersResponse } from "@/mocks/customers";
import { TRAINING_NOTICE, isAssignment, emptyEducationDraft, type ProgramCampaign, type ProgramParticipant } from "@/services/education-types";
import { trainingMetrics, rateLabel, campaignRecords, resetEducationFilters, filterEducationCampaigns, filterEducationRecords, updateEducationFilters, selectEducationDetail, validateEducationDraft, closeEducationNavigation, openEducationDetail, backEducationDetail } from "@/components/security/education-view";

const customers = customersResponse.data;
const all = { type: "all" } as const;
const response = await getTrainingProgram(all);
const normalized = normalizeEducationProgram(response, "training", all, customers);
if (normalized.kind !== "ready") throw new Error("Training fixture failed normalization");
const state = normalized;
const data = state.data;
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("training route and unique overview/course/assignment/preview sections are concrete", () => {
  assert.match(read("src/app/security/awareness-training/page.tsx"), /program="training"/);
  assert.match(read("src/app/security/awareness-training/page.tsx"), /Security Awareness Training ·/);
  const workspace = read("src/components/security/education-workspace.tsx");
  assert.equal((workspace.match(/<h1\b/g) ?? []).length, 1);
  for (const text of ["TrainingOverview", 'section="campaigns"', 'section="records"', "EducationCatalog", "EducationConfiguration", "EducationDetail", 'href="/security"', 'href="/reports"']) assert.ok(workspace.includes(text), text);
  assert.match(read("src/components/security/education-overview.tsx"), /training-participation-title/);
});

test("training All/A/B/C/All campaign, participant and assignment scoping stays coherent", async () => {
  for (const id of [null, 1, 2, 3, null]) {
    const scope = id === null ? all : { type: "customer", customer_id: id } as const;
    const result = normalizeEducationProgram(await getTrainingProgram(scope), "training", scope, customers);
    assert.equal(result.kind, "ready");
    if (result.kind !== "ready") continue;
    assert.equal(result.data.campaigns.length, id === null ? 6 : 2);
    assert.equal(result.data.participants.length, id === null ? 9 : 3);
    assert.equal(result.data.records.length, id === null ? 18 : 6);
    for (const assignment of result.data.records) {
      assert.ok(isAssignment(assignment));
      assert.ok(id === null || assignment.customer.id === id);
      const campaign: ProgramCampaign = result.data.campaigns.find(item => item.id === assignment.campaign.id)!;
      const participant: ProgramParticipant = result.data.participants.find(item => item.id === assignment.participant.id)!;
      assert.equal(campaign.customer.id, assignment.customer.id);
      assert.equal(participant.customer.id, assignment.customer.id);
    }
  }
});

test("training completion numerator is six assignments; denominator eighteen, not nine participants or Dashboard users", () => {
  const metrics = trainingMetrics(data.records);
  assert.deepEqual({ eligible: metrics.eligible, participants: metrics.assignedParticipants, completed: metrics.completed, progress: metrics.inProgress, notStarted: metrics.notStarted }, { eligible: 18, participants: 9, completed: 6, progress: 6, notStarted: 6 });
  assert.equal(metrics.completionRate, 6 / 18 * 100);
  assert.equal(rateLabel(metrics.completionRate), "33.3%");
  assert.equal(trainingMetrics([]).completionRate, null);
  assert.match(rateLabel(null), /Not applicable/);
  for (const campaign of data.campaigns) {
    const metrics = trainingMetrics(campaignRecords(data, campaign.id));
    assert.equal(metrics.eligible, 3);
    assert.equal(metrics.completed, 1);
    assert.equal(metrics.inProgress, 1);
    assert.equal(metrics.notStarted, 1);
  }
});

test("training campaign search, topic/state combination, deterministic sort/reset and unsupported filter guard work", () => {
  const filters = resetEducationFilters();
  const campaign = data.campaigns[0];
  const content = data.catalog.find(item => item.id === campaign.content.id)!;
  for (const query of [campaign.title, campaign.description, campaign.customer.name, content.title, content.category]) assert.ok(filterEducationCampaigns(data, { ...filters, search: ` ${query.toUpperCase()} ` }).length);
  assert.deepEqual(filterEducationCampaigns(data, { ...filters, search: "CUSTOMER A", category: content.category, state: campaign.state }).map(item => item.id), [campaign.id]);
  for (const sort of ["name-asc", "name-desc", "state"] as const) assert.deepEqual(filterEducationCampaigns(data, { ...filters, sort }), filterEducationCampaigns({ ...data, campaigns: [...data.campaigns].reverse() }, { ...filters, sort }));
  assert.equal(filterEducationCampaigns(data, { ...filters, search: "no-match" }).length, 0);
  for (const field of ["category", "state", "sort"] as const) assert.deepEqual(updateEducationFilters(filters, field, "invalid", data, "training", "campaigns"), filters);
  assert.equal(updateEducationFilters(filters, "search", "x".repeat(300), data, "training", "campaigns").search.length, 200);
  filters.search = "draft";
  assert.equal(resetEducationFilters().search, "");
  assert.equal(filterEducationCampaigns(data, resetEducationFilters()).length, 6);
});

test("training assignment search/campaign/state filters sort without mutating source; every record selects its details", () => {
  const original = structuredClone(data);
  const filters = resetEducationFilters();
  const record = data.records[0];
  const participant = data.participants.find(item => item.id === record.participant.id)!;
  assert.ok(filterEducationRecords(data, { ...filters, search: participant.label.toUpperCase() }).length);
  const selected = filterEducationRecords(data, { ...filters, campaign: record.campaign.id, state: "completed" });
  assert.equal(selected.length, 1);
  assert.ok(selected.every(record => isAssignment(record) && record.state === "completed"));
  for (const sort of ["name-asc", "name-desc", "state"] as const) assert.deepEqual(filterEducationRecords(data, { ...filters, sort }), filterEducationRecords({ ...data, records: [...data.records].reverse() }, { ...filters, sort }));
  assert.equal(filterEducationRecords(data, { ...filters, search: "not-present" }).length, 0);
  for (const record of data.records) assert.deepEqual(selectEducationDetail(state, { kind: "record", id: record.id })?.record, record);
  assert.deepEqual(data, original);
});

test("training course details remain descriptive, selectable and linked to scoped campaigns without playback", () => {
  assert.equal(data.catalog.length, 6);
  for (const content of data.catalog) {
    assert.equal(selectEducationDetail(state, { kind: "content", id: content.id })?.record, content);
    assert.ok(content.description.length > 40);
    assert.ok(content.indicators.length >= 3);
  }
  const catalog = read("src/components/security/education-catalog.tsx");
  for (const token of ["setTopic", "data.catalog.some", "setSearch", "Reset catalog search", "Preview course details"]) assert.ok(catalog.includes(token));
  assert.match(catalog, /no Start Training action/);
  assert.doesNotMatch(catalog, /onClick=\{(?:play|start|enroll)/);
});

test("training campaign → assignment → course navigation validates records and supports back/close", () => {
  let nav = closeEducationNavigation();
  const campaign = { kind: "campaign", id: data.campaigns[0].id } as const;
  const assignment = { kind: "record", id: data.records[0].id } as const;
  const course = { kind: "content", id: data.campaigns[0].content.id } as const;
  nav = openEducationDetail(state, nav, campaign);
  nav = openEducationDetail(state, nav, assignment, true);
  nav = openEducationDetail(state, nav, course, true);
  assert.equal(nav.history.length, 2);
  assert.deepEqual(backEducationDetail(nav).current, assignment);
  assert.deepEqual(backEducationDetail(backEducationDetail(nav)).current, campaign);
  assert.deepEqual(openEducationDetail(state, nav, { kind: "record", id: "missing" }), closeEducationNavigation());
});

test("training configuration validates scope, title, course, settings and unique participants without duplicate existing assignments", () => {
  const draft = { ...emptyEducationDraft(1), title: "Demo: fictional education preview", contentId: "course-passkeys", participantIds: ["tr-participant-a-01"], setting: "self-paced-preview" };
  const original = structuredClone(data);
  assert.equal(validateEducationDraft(draft, data, "training", null), null);
  assert.equal(validateEducationDraft(draft, data, "training", 1), null);
  for (const invalid of [ { ...draft, title: "" }, { ...draft, title: "Demo: www.example.com" }, { ...draft, title: "Demo: person@example.com" }, { ...draft, title: "Demo: " + "x".repeat(100) }, { ...draft, customerId: 99 }, { ...draft, contentId: "invalid" }, { ...draft, setting: "schedule" }, { ...draft, participantIds: [] }, { ...draft, participantIds: ["tr-participant-b-01"] }, { ...draft, participantIds: ["tr-participant-a-01", "tr-participant-a-01"] }, { ...draft, contentId: "course-phishing" } ]) assert.ok(validateEducationDraft(invalid, data, "training", 1));
  assert.ok(validateEducationDraft(draft, data, "training", 2));
  assert.deepEqual(data, original);
  assert.equal(TRAINING_NOTICE, "Demonstration only. No training campaign or assignment has been created, delivered or saved.");
  const preview = read("src/components/security/education-configuration.tsx");
  for (const token of ["validateEducationDraft", "setPreview", "participantIds: [...draft.participantIds]", "setConfirmed(true)", "reset(); setOpen(false)", "setPreview(null)", "emptyEducationDraft(customerId)", "openRef.current?.focus()", "role={error ? \"alert\" : undefined}", "Select this fictional customer group"]) assert.ok(preview.includes(token), token);
});
