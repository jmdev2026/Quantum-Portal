import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSimulationProgram, normalizeEducationProgram } from "@/services/education-programs";
import { customersResponse } from "@/mocks/customers";
import { SIMULATION_NOTICE, isAssignment, emptyEducationDraft, type SimulationOutcome, type ProgramCampaign, type ProgramParticipant } from "@/services/education-types";
import { simulationMetrics, rateLabel, outcomeMatches, outcomeLabel, campaignRecords, resetEducationFilters, filterEducationCampaigns, filterEducationRecords, updateEducationFilters, selectEducationDetail, validateEducationDraft } from "@/components/security/education-view";

const customers = customersResponse.data;
const all = { type: "all" } as const;
const response = await getSimulationProgram(all);
const state = normalizeEducationProgram(response, "simulation", all, customers);
if (state.kind !== "ready") throw new Error("Simulation fixture failed normalization");
const data = state.data;
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("simulation route has distinct outcome/results/opportunity/scenario and non-sendable configuration workflows", () => {
  assert.match(read("src/app/security/phishing-simulations/page.tsx"), /program="simulation"/);
  assert.match(read("src/app/security/phishing-simulations/page.tsx"), /Phishing Simulations ·/);
  const overview = read("src/components/security/education-overview.tsx");
  for (const token of ["simulation-results-title", "simulation-opportunities-title", "Illustrative simulation results", "both interacted and reported", "No employee ranking"]) assert.ok(overview.includes(token));
  const root = read("src/components/security/education-workspace.tsx");
  assert.match(root, /program === "training" \? <TrainingOverview.*: <SimulationOverview/);
  assert.match(root, /scenario-category and training-opportunity reporting/);
});

test("simulation All/A/B/C/All scopes six campaigns and eighteen outcome records with consistent participant relationships", async () => {
  for (const id of [null, 1, 2, 3, null]) {
    const scope = id === null ? all : { type: "customer", customer_id: id } as const;
    const current = normalizeEducationProgram(await getSimulationProgram(scope), "simulation", scope, customers);
    assert.equal(current.kind, "ready");
    if (current.kind !== "ready") continue;
    assert.equal(current.data.campaigns.length, id === null ? 6 : 2);
    assert.equal(current.data.participants.length, id === null ? 9 : 3);
    assert.equal(current.data.records.length, id === null ? 18 : 6);
    for (const outcome of current.data.records) {
      assert.ok(!isAssignment(outcome));
      assert.ok(id === null || outcome.customer.id === id);
      const campaign: ProgramCampaign = current.data.campaigns.find(item => item.id === outcome.campaign.id)!;
      const participant: ProgramParticipant = current.data.participants.find(item => item.id === outcome.participant.id)!;
      assert.equal(campaign.customer.id, participant.customer.id);
      assert.equal(campaign.customer.id, outcome.customer.id);
      assert.ok(!isAssignment(outcome) && (outcome.delivered || (!outcome.interacted && !outcome.reported)));
    }
  }
});

test("simulation metrics use delivered campaign-participant instances, preserve overlapping flags and do not infer safety", () => {
  const metrics = simulationMetrics(data.records);
  assert.deepEqual(metrics, { eligible: 18, uniqueParticipants: 9, delivered: 12, interacted: 6, reported: 6, noInteraction: 3, notDelivered: 6, both: 3, clickRate: 50, reportRate: 50 });
  assert.equal(metrics.clickRate, metrics.interacted / metrics.delivered * 100);
  assert.equal(metrics.reportRate, metrics.reported / metrics.delivered * 100);
  for (const campaign of data.campaigns) {
    const metrics = simulationMetrics(campaignRecords(data, campaign.id));
    assert.equal(metrics.eligible, 3);
    assert.equal(metrics.delivered, 2);
    assert.equal(metrics.interacted, 1);
    assert.equal(metrics.clickRate, 50);
    assert.equal(metrics.reported, campaign.id.endsWith("01") ? 2 : 0);
  }
  const both = data.records.find(record => !isAssignment(record) && record.interacted && record.reported) as SimulationOutcome;
  assert.ok(outcomeMatches(both, "interacted"));
  assert.ok(outcomeMatches(both, "reported"));
  assert.match(outcomeLabel(both), /interacted.*reported/);
  assert.ok(!outcomeMatches(both, "no-interaction"));
});

test("simulation zero denominator is unavailable for empty and valid non-delivered-only records, never a performance zero", () => {
  assert.equal(simulationMetrics([]).clickRate, null);
  assert.equal(simulationMetrics([]).reportRate, null);
  const response = structuredClone(data);
  response.records = response.records.filter(record => !isAssignment(record) && !record.delivered);
  const normalized = normalizeEducationProgram({ data: response, meta: { scope: all, program: "simulation", source: "Simulated demo data", status: "ready", message: null } }, "simulation", all, customers);
  assert.equal(normalized.kind, "ready");
  const metrics = simulationMetrics(response.records);
  assert.equal(metrics.delivered, 0);
  assert.equal(metrics.clickRate, null);
  assert.equal(metrics.reportRate, null);
  assert.match(rateLabel(metrics.clickRate), /Not applicable/);
});

test("simulation campaigns search and category/state filters sort deterministically and reset", () => {
  const filters = resetEducationFilters();
  const campaign = data.campaigns[0];
  const scenario = data.catalog.find(item => item.id === campaign.content.id)!;
  for (const query of [campaign.title, campaign.description, campaign.customer.name, scenario.title, scenario.category]) assert.ok(filterEducationCampaigns(data, { ...filters, search: ` ${query.toUpperCase()} ` }).length);
  assert.deepEqual(filterEducationCampaigns(data, { ...filters, search: "CUSTOMER A", category: scenario.category, state: campaign.state }).map(item => item.id), [campaign.id]);
  const original = structuredClone(data);
  for (const sort of ["name-asc", "name-desc", "state"] as const) assert.deepEqual(filterEducationCampaigns(data, { ...filters, sort }), filterEducationCampaigns({ ...data, campaigns: [...data.campaigns].reverse() }, { ...filters, sort }));
  assert.equal(filterEducationCampaigns(data, { ...filters, search: "not-present" }).length, 0);
  assert.equal(filterEducationCampaigns(data, resetEducationFilters()).length, 6);
  assert.deepEqual(data, original);
});

test("simulation participant search, combined campaign/outcome filters and immutable deterministic ordering work", () => {
  const filters = resetEducationFilters();
  const campaign = data.campaigns[0];
  const records = filterEducationRecords(data, { ...filters, campaign: campaign.id, state: "reported" });
  assert.equal(records.length, 2);
  assert.ok(records.every(record => !isAssignment(record) && record.reported && record.campaign.id === campaign.id));
  assert.equal(filterEducationRecords(data, { ...filters, state: "not-delivered" }).length, 6);
  assert.equal(filterEducationRecords(data, { ...filters, state: "no-interaction" }).length, 3);
  assert.equal(filterEducationRecords(data, { ...filters, search: ` ${data.participants[0].label.toUpperCase()} ` }).length, 2);
  for (const sort of ["name-asc", "name-desc", "state"] as const) assert.deepEqual(filterEducationRecords(data, { ...filters, sort }), filterEducationRecords({ ...data, records: [...data.records].reverse() }, { ...filters, sort }));
  assert.equal(filterEducationRecords(data, { ...filters, search: "no-match" }).length, 0);
  for (const field of ["campaign", "state", "sort"] as const) assert.deepEqual(updateEducationFilters(filters, field, "unknown", data, "simulation", "records"), filters);
});

test("simulation campaigns/outcomes/scenarios have validated details and inert descriptive scenario information", () => {
  for (const campaign of data.campaigns) assert.equal(selectEducationDetail(state, { kind: "campaign", id: campaign.id })?.record, campaign);
  for (const outcome of data.records) assert.equal(selectEducationDetail(state, { kind: "record", id: outcome.id })?.record, outcome);
  assert.equal(data.catalog.length, 5);
  for (const scenario of data.catalog) {
    assert.equal(selectEducationDetail(state, { kind: "content", id: scenario.id })?.record, scenario);
    assert.ok(scenario.description.length > 60);
    assert.equal(scenario.indicators.length, 3);
    assert.doesNotMatch(JSON.stringify(scenario), /https?:|www\.|@|\.onion|<form|<input/i);
  }
  assert.match(read("src/components/security/education-catalog.tsx"), /Inert, non-sendable educational concepts only/);
});

test("simulation configuration validates synthetic group/scope/scenario/settings; never mutates outcomes or sends", () => {
  const draft = { ...emptyEducationDraft(2), title: "Demo: fictional scenario review", contentId: "scenario-invoice", participantIds: ["sim-participant-b-01", "sim-participant-b-02"], setting: "inert-scenario-preview" };
  const original = structuredClone(data);
  assert.equal(validateEducationDraft(draft, data, "simulation", 2), null);
  for (const invalid of [{ ...draft, title: "not a demo" }, { ...draft, title: "Demo: https://example.com" }, { ...draft, customerId: 1 }, { ...draft, contentId: "course-phishing" }, { ...draft, setting: "scheduled-send" }, { ...draft, participantIds: [] }, { ...draft, participantIds: ["tr-participant-b-01"] }, { ...draft, participantIds: ["sim-participant-b-01", "sim-participant-b-01"] }]) assert.ok(validateEducationDraft(invalid, data, "simulation", 2));
  assert.ok(validateEducationDraft(draft, data, "simulation", 3));
  assert.deepEqual(data, original);
  assert.equal(SIMULATION_NOTICE, "Demonstration only. No simulation is created, scheduled, sent or tracked.");
  const source = read("src/components/security/education-configuration.tsx");
  assert.match(source, /Confirm local preview · not saved/);
  assert.match(source, /Cancel configuration preview/);
  assert.doesNotMatch(source, /fetch\(|axios\.|localStorage|sessionStorage|onClick=\{(?:send|schedule|track|launch)/i);
});
