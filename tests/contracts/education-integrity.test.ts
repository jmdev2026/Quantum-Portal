import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTrainingProgram, getSimulationProgram, normalizeEducationProgram } from "@/services/education-programs";
import { customersResponse } from "@/mocks/customers";
import { visibleEducation, selectEducationDetail, type LoadedEducation } from "@/components/security/education-view";
import { PLANNED_SECURITY_CAPABILITIES, SECURITY_CAPABILITIES } from "@/components/security/security-capability-directory";
import { findActiveNavItem } from "@/components/sidebar/navigation";
import type { EducationResponse, ProgramKind } from "@/services/education-types";

const all = { type: "all" } as const;
const customers = customersResponse.data;
const samples = { training: await getTrainingProgram(all), simulation: await getSimulationProgram(all) };
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const loose = (value: unknown) => value as Record<string, unknown>;
const mutations: [string, (response: EducationResponse) => void][] = [
  ["extra envelope", response => { loose(response).provider = "verified"; }],
  ["missing data", response => { delete loose(response).data; }],
  ["extra metadata", response => { loose(response.meta).secret = "private"; }],
  ["wrong scope", response => { response.meta.scope = { type: "customer", customer_id: 2 }; }],
  ["extra scope", response => { loose(response.meta.scope).authorization = "all"; }],
  ["wrong program", response => { response.meta.program = response.meta.program === "training" ? "simulation" : "training"; }],
  ["error envelope", response => { response.meta.status = "error"; }],
  ["source mismatch", response => { response.meta.source = "Provider data"; }],
  ["missing records", response => { delete loose(response.data).records; }],
  ["extra data", response => { loose(response.data).emails = []; }],
  ["record list malformed", response => { loose(response.data).records = null; }],
  ["unbounded list", response => { response.data.records = Array(61).fill(response.data.records[0]); }],
  ["duplicate campaign ID", response => { response.data.campaigns.push(response.data.campaigns[0]); }],
  ["duplicate participant ID", response => { response.data.participants.push(response.data.participants[0]); }],
  ["duplicate record ID", response => { response.data.records.push(response.data.records[0]); }],
  ["duplicate content ID", response => { response.data.catalog.push(response.data.catalog[0]); }],
  ["unknown customer", response => { response.data.campaigns[0].customer.id = 99; }],
  ["incorrect customer name", response => { response.data.records[0].customer.name = "Demo Customer B"; }],
  ["extra customer field", response => { loose(response.data.participants[0].customer).email = "private"; }],
  ["contradictory campaign title", response => { response.data.campaigns[0].title = "Actual program"; }],
  ["unsafe participant label", response => { response.data.participants[0].label = "person@example.com"; }],
  ["non-demo marker", response => { loose(response.data.records[0]).is_demo = false; }],
  ["record source", response => { response.data.records[0].source = "Verified provider"; }],
  ["real event date", response => { response.data.records[0].created_at = "2026-11-19T10:00:00Z"; }],
  ["invalid timestamp", response => { response.data.records[0].created_at = "today"; }],
  ["unknown state", response => { loose(response.data.campaigns[0]).state = "launched"; }],
  ["private content", response => { response.data.catalog[0].description = "person@example.com"; }],
  ["tracking indicator", response => { response.data.catalog[0].indicators.push("https://example.com"); }],
  ["foreign content", response => { response.data.campaigns[0].content.id = "unavailable-content"; }],
  ["missing campaign relation", response => { response.data.campaigns.shift(); }],
  ["missing participant relation", response => { response.data.participants.shift(); }],
  ["missing catalog relation", response => { response.data.catalog.shift(); }],
  ["cross-customer campaign relation", response => { response.data.records[0].campaign.id = response.data.campaigns[2].id; }],
  ["cross-customer participant relation", response => { response.data.records[0].participant.id = response.data.participants[3].id; }],
  ["extra reference field", response => { loose(response.data.records[0].participant).label = "private"; }],
  ["contradictory record ID", response => { response.data.records[0].id = "wrong"; }],
  ["unexpected evidence", response => { loose(response.data.records[0]).credential_value = "not allowed"; }],
];
for (const program of ["training", "simulation"] as const) {
  test(`${program}: strict envelope, schema, metadata and graph mutation matrix rejects malformed data`, () => {
    for (const [name, mutate] of mutations) {
      const response = structuredClone(samples[program]);
      mutate(response);
      assert.equal(normalizeEducationProgram(response, program, all, customers).kind, "error", name);
    }
    const fields = program === "training" ? [{ state: "unknown" }, { progress: -1 }, { progress: 101 }, { progress: 1.5 }, { state: "completed", progress: 50 }, { state: "not-started", progress: 100 }, { state: "in-progress", progress: 0 }] : [{ delivered: "yes" }, { interacted: "yes" }, { reported: "yes" }, { delivered: false, interacted: true }, { delivered: false, reported: true }];
    for (const values of fields) {
      const response = structuredClone(samples[program]);
      Object.assign(response.data.records[0], values);
      assert.equal(normalizeEducationProgram(response, program, all, customers).kind, "error");
    }
  });
  test(`${program}: invalid, revoked and wrong-scope responses fail closed; success empty and clone isolation remain distinct`, async () => {
    const get = program === "training" ? getTrainingProgram : getSimulationProgram;
    for (const id of [-1, 0, 1.5, 99, Number.NaN]) {
      const scope = { type: "customer", customer_id: id } as const;
      const response = await get(scope);
      assert.equal(response.data.campaigns.length, 0);
      assert.equal(normalizeEducationProgram(response, program, scope, customers).kind, "error");
    }
    assert.equal(normalizeEducationProgram(samples[program], program, all, customers.slice(1)).kind, "error");
    assert.equal(normalizeEducationProgram(samples[program], program, { type: "customer", customer_id: 2 }, customers).kind, "error");
    const clone = structuredClone(samples[program]);
    clone.data = { campaigns: [], participants: [], records: [], catalog: [] };
    const empty = normalizeEducationProgram(clone, program, all, customers);
    assert.deepEqual(empty, { kind: "ready", data: clone.data });
    const state = normalizeEducationProgram(samples[program], program, all, customers);
    assert.equal(state.kind, "ready");
    if (state.kind === "ready") state.data.campaigns[0].title = "mutation";
    assert.notEqual(samples[program].data.campaigns[0].title, "mutation");
    const raw = await get(all);
    raw.data.participants.length = 0;
    assert.equal((await get(all)).data.participants.length, 9);
  });
  test(`${program}: Live/scope/retry/registry replacement gates clear records/details before display`, () => {
    const state = normalizeEducationProgram(samples[program], program, all, customers);
    const loaded: LoadedEducation = { program, mode: "demo", customerId: null, attempt: 0, registry: customers, state };
    assert.equal(visibleEducation(loaded, program, "demo", null, 0, customers).kind, "ready");
    const contexts = [visibleEducation(loaded, program, "live", null, 0, customers), visibleEducation(loaded, program, "demo", 2, 0, customers), visibleEducation(loaded, program, "demo", null, 1, customers), visibleEducation(loaded, program, "demo", null, 0, [...customers]), visibleEducation(loaded, program, "demo", null, 0, customers.slice(1)), visibleEducation(loaded, program, "demo", 99, 0, customers), visibleEducation(loaded, program, "demo", null, 0, null)];
    for (const gated of contexts) {
      assert.notEqual(gated.kind, "ready");
      assert.equal(selectEducationDetail(gated, { kind: "record", id: samples[program].data.records[0].id }), null);
    }
    const wrong = visibleEducation({ ...loaded, customerId: 2 }, program, "demo", 2, 0, customers);
    assert.equal(wrong.kind, "error");
    assert.equal(visibleEducation({ ...loaded, mode: "live" }, program, "demo", null, 0, customers).kind, "loading");
    assert.equal(visibleEducation(loaded, program === "training" ? "simulation" : "training", "demo", null, 0, customers).kind, "loading");
  });
}

test("education late responses from customer A cannot reappear in customer B or Live", async () => {
  for (const program of ["training", "simulation"] as ProgramKind[]) {
    const get = program === "training" ? getTrainingProgram : getSimulationProgram;
    const request = async (customerId: number, delay: number): Promise<LoadedEducation> => {
      const scope = { type: "customer", customer_id: customerId } as const;
      const response = await get(scope);
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      return { program, mode: "demo", customerId, attempt: 0, registry: customers, state: normalizeEducationProgram(response, program, scope, customers) };
    };
    const slow = request(1, 50);
    const current = await request(2, 0);
    assert.equal(visibleEducation(current, program, "demo", 2, 0, customers).kind, "ready");
    const late = await slow;
    assert.equal(visibleEducation(late, program, "demo", 2, 0, customers).kind, "loading");
    assert.equal(visibleEducation(late, program, "live", null, 0, customers).kind, "unavailable");
  }
});

test("all nine capability links are active without changing six baseline definitions, historical milestones or sidebar behavior", () => {
  const linked = PLANNED_SECURITY_CAPABILITIES.filter(item => "href" in item);
  assert.equal(SECURITY_CAPABILITIES.length + linked.length, 9);
  for (const path of ["/security/awareness-training", "/security/phishing-simulations"]) {
    assert.ok(linked.some(item => item.href === path));
    assert.equal(findActiveNavItem(path)?.href, "/security");
  }
  assert.equal(PLANNED_SECURITY_CAPABILITIES.filter(item => !("href" in item)).length, 0);
  const hub = read("src/components/security/security-capability-hub.tsx");
  assert.match(hub, /GraduationCap/);
  assert.match(hub, /ScanText/);
});

test("education source wiring supports native modal keyboard/focus/back and synchronous context unmount of previews", () => {
  const modal = read("src/components/security/education-detail.tsx");
  for (const token of ["showModal()", "dialog?.close()", "onCancel=", "event.preventDefault()", "aria-labelledby=", "aria-describedby=", "trigger.focus()", "headingRef.current?.focus()", "max-h-[85dvh]", "overflow-y-auto", "Back to previous detail", "Inspect associated campaign"]) assert.ok(modal.includes(token), token);
  const root = read("src/components/security/education-workspace.tsx");
  assert.match(root, /state.kind === "ready" \? <EducationDemoContent key=\{contextKey\}/);
  const hook = read("src/components/security/use-education-program.ts");
  assert.ok(hook.indexOf('mode !== "demo"') < hook.indexOf("request(scope)"));
  for (const token of ["if (!cancelled)", "cancelled = true", "visibleEducation", "registry", "attempt"]) assert.ok(hook.includes(token));
  assert.match(root, /Unavailable does not mean no employees require training or no phishing incidents occurred/);
});

test("education responsive table/list, form errors and resource states are wired without operational or privacy leaks", () => {
  const explorer = read("src/components/security/education-explorer.tsx");
  for (const token of ["<table", "<caption", 'scope="col"', 'scope="row"', "lg:hidden", "lg:block", "break-words", "No matching examples", "No fictional records supplied", 'aria-live="polite"', "training.completionRate !== null"]) assert.ok(explorer.includes(token), token);
  for (const file of ["education-workspace", "education-overview", "education-explorer", "education-catalog", "education-detail", "education-configuration"]) {
    const code = read(`src/components/security/${file}.tsx`);
    assert.doesNotMatch(code, /fetch\(|axios\.|localStorage|sessionStorage|dangerouslySetInnerHTML|@\/mocks\/|@\/demo\//);
    assert.doesNotMatch(code, /onClick=\{(?:send|launch|schedule|track|capture|delete|save|enroll|markComplete)/i);
  }
  const root = read("src/components/security/education-workspace.tsx");
  assert.match(root, /restricted client viewer access must be enforced server-side/);
  assert.match(root, /Existing Reports does not include a dedicated/);
  assert.match(root, /Frontend customer selection is not tenant authorization/);
  assert.match(read("src/services/api.ts"), /NEXT_PUBLIC_API_BASE_URL/);
  assert.doesNotMatch(read("src/services/api.ts"), /VITE_API_BASE_URL/);
});
