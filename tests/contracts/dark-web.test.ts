import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { getDemoDarkWeb, normalizeDemoDarkWeb } from "@/services/dark-web";
import { customersResponse } from "@/mocks/customers";
import { resetDarkWebFilters, updateDarkWebFilters, filterExposureFindings, darkWebSummary, accountFindings, domainFindings, selectDarkWebDetail, closeDarkWebNavigation, openDarkWebDetail, backDarkWebDetail, validateReviewDraft, visibleDarkWeb, type LoadedDarkWeb } from "@/components/security/dark-web-view";
import { EMPTY_REVIEW_DRAFT, DARK_WEB_DISCLOSURE, REVIEW_DISPOSITIONS, type DarkWebResponse, type DarkWebState, type DarkWebAccount, type DarkWebDomain } from "@/services/dark-web-types";
import { PLANNED_SECURITY_CAPABILITIES } from "@/components/security/security-capability-directory";
import { findActiveNavItem } from "@/components/sidebar/navigation";

const all = { type: "all" } as const;
const customers = customersResponse.data;
const sample = await getDemoDarkWeb(all);
const ready = (response: DarkWebResponse, scope = all): Extract<DarkWebState, { kind: "ready" }> => {
  const state = normalizeDemoDarkWeb(response, scope, customers);
  assert.equal(state.kind, "ready");
  if (state.kind !== "ready") throw new Error("Expected validated sample");
  return state;
};
const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const loose = (value: unknown) => value as Record<string, unknown>;

test("Dark Web: All/A/B/C/All gives six findings, two per customer and coherent reserved relationships", async () => {
  for (const id of [null, 1, 2, 3, null]) {
    const scope = id === null ? all : { type: "customer", customer_id: id } as const;
    const response = await getDemoDarkWeb(scope);
    const state = normalizeDemoDarkWeb(response, scope, customers);
    assert.equal(state.kind, "ready");
    if (state.kind !== "ready") continue;
    assert.equal(state.data.findings.length, id === null ? 6 : 2);
    assert.equal(state.data.accounts.length, id === null ? 3 : 1);
    assert.equal(state.data.domains.length, id === null ? 3 : 1);
    for (const finding of state.data.findings) {
      assert.ok(id === null || finding.customer.id === id);
      const account: DarkWebAccount = state.data.accounts.find(item => item.id === finding.account.id)!;
      const domain: DarkWebDomain = state.data.domains.find(item => item.id === finding.domain.id)!;
      assert.equal(account.customer.id, finding.customer.id);
      assert.equal(domain.customer.id, finding.customer.id);
      assert.equal(account.domain.id, domain.id);
      assert.ok(account.finding_ids.includes(finding.id));
      assert.match(domain.domain, /^demo-[abc]\.example\.(com|net|org)$/);
      assert.equal(finding.is_demo, true);
      assert.equal(finding.source, "Simulated demo data");
      assert.match(finding.title, /^Fictional /);
      assert.match(finding.observation, /^Fictional /);
      assert.equal(finding.created_at, "2026-11-01T10:00:00Z");
    }
  }
});

const mutations: [string, (response: DarkWebResponse) => void][] = [
  ["unexpected envelope metadata", response => { loose(response).provider = "unknown"; }],
  ["missing data", response => { delete loose(response).data; }],
  ["unexpected dataset", response => { loose(response.data).credentials = []; }],
  ["unexpected meta", response => { loose(response.meta).case_id = "actual"; }],
  ["unexpected scope field", response => { loose(response.meta.scope).tenant = 1; }],
  ["wrong response scope", response => { response.meta.scope = { type: "customer", customer_id: 1 }; }],
  ["source mismatch", response => { response.meta.source = "Provider verified"; }],
  ["error envelope", response => { response.meta.status = "error"; response.meta.message = "failed"; }],
  ["malformed findings", response => { loose(response.data).findings = {}; }],
  ["too many records", response => { response.data.findings = Array(26).fill(response.data.findings[0]); }],
  ["duplicate finding", response => { response.data.findings.push(response.data.findings[0]); }],
  ["duplicate domain", response => { response.data.domains.push(response.data.domains[0]); }],
  ["duplicate account", response => { response.data.accounts.push(response.data.accounts[0]); }],
  ["unknown customer", response => { response.data.findings[0].customer.id = 99; }],
  ["contradictory customer name", response => { response.data.findings[0].customer.name = "Demo Customer B"; }],
  ["extra customer metadata", response => { loose(response.data.findings[0].customer).email = "private"; }],
  ["missing title", response => { delete loose(response.data.findings[0]).title; }],
  ["unsafe title", response => { response.data.findings[0].title = "<img>"; }],
  ["contradictory synthetic ID", response => { response.data.findings[0].id = "dw-finding-b-01"; }],
  ["missing fictional marker", response => { delete loose(response.data.findings[0]).is_demo; }],
  ["false fictional marker", response => { loose(response.data.findings[0]).is_demo = false; }],
  ["record source mismatch", response => { response.data.findings[0].source = "Verified"; }],
  ["historical discovery date", response => { response.data.findings[0].created_at = "2024-01-01T10:00:00Z"; }],
  ["malformed timestamp", response => { response.data.findings[0].created_at = "today"; }],
  ["unknown severity", response => { loose(response.data.findings[0]).severity = "urgent"; }],
  ["unknown category", response => { loose(response.data.findings[0]).category = "breach"; }],
  ["unknown review state", response => { loose(response.data.findings[0]).review_status = "remediated"; }],
  ["unknown response category", response => { loose(response.data.findings[0]).response_category = "rotate-now"; }],
  ["unsafe email observation", response => { response.data.findings[0].observation = "Fictional person@example.com"; }],
  ["unsafe external source", response => { response.data.findings[0].observation = "Fictional https://example.com"; }],
  ["unsafe onion source", response => { response.data.findings[0].observation = "Fictional hidden.onion"; }],
  ["unsafe IP", response => { response.data.findings[0].observation = "Fictional 192.0.2.1"; }],
  ["invented raw credential content", response => { response.data.findings[0].observation = "Fictional password secretvalue"; }],
  ["unexpected evidence", response => { loose(response.data.findings[0]).evidence = "dump"; }],
  ["nonreserved domain", response => { response.data.domains[0].domain = "demo-a.real.invalid"; }],
  ["domain customer contradiction", response => { response.data.domains[0].domain = "demo-b.example.com"; }],
  ["real monitoring claim", response => { loose(response.data.domains[0]).monitoring_status = "active"; }],
  ["unsafe account identifier", response => { response.data.accounts[0].label = "person@example.com"; }],
  ["missing related domain", response => { response.data.domains.shift(); }],
  ["missing related account", response => { response.data.accounts.shift(); }],
  ["cross-customer domain", response => { response.data.findings[0].domain.id = "dw-domain-b"; }],
  ["cross-customer account", response => { response.data.findings[0].account.id = "dw-account-b-01"; }],
  ["account/domain contradiction", response => { response.data.accounts[0].domain.id = "dw-domain-b"; }],
  ["extra reference fields", response => { loose(response.data.findings[0].account).name = "fake"; }],
  ["duplicate reverse reference", response => { response.data.accounts[0].finding_ids.push(response.data.accounts[0].finding_ids[0]); }],
  ["missing reverse association", response => { response.data.accounts[0].finding_ids.pop(); }],
  ["orphan reverse association", response => { response.data.accounts[0].finding_ids.push("dw-finding-missing"); }],
];
for (const [label, mutate] of mutations) test(`Dark Web rejects ${label}`, () => {
  const response = structuredClone(sample);
  mutate(response);
  assert.equal(normalizeDemoDarkWeb(response, all, customers).kind, "error");
});

test("Dark Web unknown, invalid, revoked and mismatched scopes fail closed without All fallback", async () => {
  for (const id of [0, -1, 99, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const scope = { type: "customer", customer_id: id } as const;
    assert.equal(normalizeDemoDarkWeb(await getDemoDarkWeb(scope), scope, customers).kind, "error");
    assert.equal(normalizeDemoDarkWeb(sample, scope, customers).kind, "error");
  }
  assert.equal(normalizeDemoDarkWeb(sample, all, customers.slice(1)).kind, "error");
  assert.equal(normalizeDemoDarkWeb(null, all, customers).kind, "error");
});

test("Dark Web datasets and normalized results are clone-isolated; successful empty is not unavailable", async () => {
  const response = await getDemoDarkWeb(all);
  const state = ready(response);
  state.data.findings[0].title = "local mutation";
  assert.notEqual(response.data.findings[0].title, "local mutation");
  response.data.accounts.length = 0;
  assert.equal((await getDemoDarkWeb(all)).data.accounts.length, 3);
  const empty = structuredClone(sample);
  empty.data = { findings: [], accounts: [], domains: [] };
  assert.deepEqual(ready(empty).data, empty.data);
});

test("Dark Web search resolves title, observation, account, domain and category; filters combine and reset", () => {
  const { data } = ready(sample);
  const defaults = resetDarkWebFilters();
  const finding = data.findings[0];
  for (const search of [finding.title, finding.observation, data.accounts[0].label, data.domains[0].domain, "domain-mention"]) {
    assert.ok(filterExposureFindings(data, { ...defaults, search: `  ${search.toUpperCase()}  ` }).length > 0);
  }
  const combined = { ...defaults, search: "fictional", severity: finding.severity, category: finding.category, review: finding.review_status, domain: finding.domain.id };
  assert.deepEqual(filterExposureFindings(data, combined).map(record => record.id), [finding.id]);
  assert.equal(filterExposureFindings(data, { ...defaults, search: "nothing-matches" }).length, 0);
  for (const field of ["severity", "category", "review", "domain", "sort"] as const) assert.deepEqual(updateDarkWebFilters(defaults, field, "unsupported", data), defaults);
  assert.equal(updateDarkWebFilters(defaults, "search", "x".repeat(300), data).search.length, 200);
  assert.equal(updateDarkWebFilters(defaults, "domain", data.domains[0].id, data).domain, data.domains[0].id);
  defaults.search = "changed";
  assert.equal(resetDarkWebFilters().search, "");
  assert.equal(filterExposureFindings(data, resetDarkWebFilters()).length, 6);
});

test("Dark Web sorting is deterministic, stable under reversed input and never mutates canonical records", () => {
  const { data } = ready(sample);
  const original = structuredClone(data);
  for (const sort of ["severity", "category", "title-asc", "title-desc"] as const) {
    const filters = { ...resetDarkWebFilters(), sort };
    assert.deepEqual(filterExposureFindings(data, filters), filterExposureFindings({ ...data, findings: [...data.findings].reverse() }, filters));
  }
  assert.equal(filterExposureFindings(data, resetDarkWebFilters())[0].severity, "critical");
  const asc = filterExposureFindings(data, { ...resetDarkWebFilters(), sort: "title-asc" });
  const desc = filterExposureFindings(data, { ...resetDarkWebFilters(), sort: "title-desc" });
  assert.deepEqual(asc.map(record => record.id).reverse(), desc.map(record => record.id));
  assert.deepEqual(data, original);
});

test("Dark Web overview summaries derive solely from scoped validated relationships", async () => {
  for (const id of [null, 1, 2, 3]) {
    const scope = id === null ? all : { type: "customer", customer_id: id } as const;
    const state = normalizeDemoDarkWeb(await getDemoDarkWeb(scope), scope, customers);
    assert.equal(state.kind, "ready");
    if (state.kind !== "ready") continue;
    const summary = darkWebSummary(state.data);
    assert.equal(summary.findings, id === null ? 6 : 2);
    assert.equal(summary.accounts, id === null ? 3 : 1);
    assert.equal(summary.domains, id === null ? 3 : 1);
    assert.equal(summary.reviewExamples, id === null ? 3 : 1);
    assert.equal(summary.severities.reduce((sum, row) => sum + row.count, 0), summary.findings);
    assert.equal(summary.categoryCounts.reduce((sum, row) => sum + row.count, 0), summary.findings);
    assert.equal(summary.reviewStatuses.reduce((sum, row) => sum + row.count, 0), summary.findings);
    for (const account of state.data.accounts) assert.equal(accountFindings(state.data, account.id).length, 2);
    for (const domain of state.data.domains) assert.equal(domainFindings(state.data, domain.id).length, 2);
  }
});

test("Dark Web finding/account/domain navigation validates selection and supports related back/close", () => {
  const state = ready(sample);
  let nav = closeDarkWebNavigation();
  const domain = { kind: "domain", id: state.data.domains[0].id } as const;
  const account = { kind: "account", id: state.data.accounts[0].id } as const;
  const finding = { kind: "finding", id: state.data.findings[0].id } as const;
  nav = openDarkWebDetail(state, nav, domain);
  nav = openDarkWebDetail(state, nav, account, true);
  nav = openDarkWebDetail(state, nav, finding, true);
  assert.equal(selectDarkWebDetail(state, nav.current)?.kind, "finding");
  nav = backDarkWebDetail(nav);
  assert.deepEqual(nav.current, account);
  nav = backDarkWebDetail(nav);
  assert.deepEqual(nav.current, domain);
  assert.deepEqual(backDarkWebDetail(nav), closeDarkWebNavigation());
  assert.deepEqual(openDarkWebDetail(state, nav, { kind: "finding", id: "missing" }), closeDarkWebNavigation());
  assert.equal(selectDarkWebDetail(state, null), null);
  for (const kind of ["loading", "unavailable", "error"] as const) {
    const unavailable: DarkWebState = kind === "error" ? { kind, message: "failed" } : { kind };
    assert.equal(selectDarkWebDetail(unavailable, finding), null);
    assert.deepEqual(openDarkWebDetail(unavailable, nav, finding), closeDarkWebNavigation());
  }
});

test("Dark Web context envelopes hide stale, Live, retry and registry-revoked records and details immediately", async () => {
  const state = ready(sample);
  const loaded: LoadedDarkWeb = { mode: "demo", customerId: null, attempt: 0, state };
  assert.equal(visibleDarkWeb(loaded, "demo", null, 0, customers).kind, "ready");
  assert.deepEqual(visibleDarkWeb(loaded, "live", null, 0, customers), { kind: "unavailable" });
  assert.equal(visibleDarkWeb(loaded, "demo", 1, 0, customers).kind, "loading");
  assert.equal(visibleDarkWeb(loaded, "demo", null, 1, customers).kind, "loading");
  assert.equal(visibleDarkWeb(loaded, "demo", null, 0, null).kind, "loading");
  assert.equal(visibleDarkWeb(loaded, "demo", 99, 0, customers).kind, "error");
  assert.equal(visibleDarkWeb(loaded, "demo", null, 0, customers.slice(1)).kind, "error");
  assert.equal(visibleDarkWeb(loaded, "demo", null, 0, customers.map(customer => ({ ...customer, name: "changed" }))).kind, "error");
  const wrongScope = visibleDarkWeb({ ...loaded, customerId: 1 }, "demo", 1, 0, customers);
  assert.equal(wrongScope.kind, "error");
  assert.equal(selectDarkWebDetail(wrongScope, { kind: "finding", id: state.data.findings[0].id }), null);
  const bScope = { type: "customer", customer_id: 2 } as const;
  const b = normalizeDemoDarkWeb(await getDemoDarkWeb(bScope), bScope, customers);
  assert.equal(selectDarkWebDetail(b, { kind: "account", id: state.data.accounts[0].id }), null);
});

test("Dark Web out-of-order results cannot display customer A after customer B or after Live", async () => {
  const load = async (id: number, delay: number): Promise<LoadedDarkWeb> => {
    const scope = { type: "customer", customer_id: id } as const;
    const response = await getDemoDarkWeb(scope);
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    return { mode: "demo", customerId: id, attempt: 0, state: normalizeDemoDarkWeb(response, scope, customers) };
  };
  const slowA = load(1, 50);
  const fastB = await load(2, 0);
  assert.equal(visibleDarkWeb(fastB, "demo", 2, 0, customers).kind, "ready");
  const stale = await slowA;
  assert.equal(visibleDarkWeb(stale, "demo", 2, 0, customers).kind, "loading");
  assert.equal(visibleDarkWeb(stale, "live", null, 0, customers).kind, "unavailable");
});

test("Dark Web review validates allowed dispositions and bounded demonstration-only non-sensitive notes", () => {
  assert.ok(validateReviewDraft(EMPTY_REVIEW_DRAFT));
  for (const disposition of REVIEW_DISPOSITIONS) assert.equal(validateReviewDraft({ disposition, note: "Demo: fictional guidance prepared" }), null);
  for (const note of ["", "Demo: x", "ordinary review", "Demo: " + "x".repeat(200), "Demo: password reset", "Demo: private token", "Demo: person@example.com", "Demo: https://example.com", "Demo: hidden.onion", "Demo: 12345", "Demo: <script>", "Demo: credential contents", "Demo: username person"]) assert.ok(validateReviewDraft({ disposition: "review-needed", note }));
  assert.ok(validateReviewDraft({ disposition: "unsupported" as never, note: "Demo: fictional guidance prepared" }));
  const state = ready(sample);
  const original = structuredClone(state.data);
  const draft = { disposition: "guidance-prepared" as const, note: "Demo: fictional guidance prepared" };
  assert.equal(validateReviewDraft(draft), null);
  const preview = { ...draft, note: draft.note.trim() };
  assert.notEqual(preview, draft);
  assert.deepEqual(state.data, original);
  assert.equal(DARK_WEB_DISCLOSURE, "Demonstration only. No real finding is updated, saved, dismissed or remediated.");
});

test("Dark Web concrete route, active hub, existing sidebar and Security/ITDR/Reports destinations remain coherent", () => {
  assert.ok(existsSync("src/app/security/dark-web/page.tsx"));
  assert.match(source("src/app/security/dark-web/page.tsx"), /DarkWebWorkspace/);
  const milestone = PLANNED_SECURITY_CAPABILITIES.find(item => item.title === "Dark Web Monitoring");
  assert.ok(milestone && "href" in milestone);
  const hub = source("src/components/security/security-capability-hub.tsx");
  assert.match(hub, /activeCapabilities/);
  assert.match(hub, /pendingCapabilities = PLANNED_SECURITY_CAPABILITIES.filter\(item => !\("href" in item\)\)/);
  assert.equal(findActiveNavItem("/security/dark-web")?.href, "/security");
  const workspace = source("src/components/security/dark-web-workspace.tsx");
  for (const href of ["/security", "/security/itdr", "/reports"]) assert.ok(workspace.includes(`href="${href}"`));
  assert.match(workspace, /existing Reports module does not include Dark Web data/);
  assert.match(workspace, /F05 must add scoped exposure/);
});

test("Dark Web accessible dialogs, related navigation, review preview/cancel/reset and context unmount are wired", () => {
  const dialog = source("src/components/security/dark-web-detail.tsx");
  for (const token of ["showModal()", "dialog?.close()", "onCancel=", "event.preventDefault()", "aria-labelledby=", "aria-describedby=", "trigger.focus()", "dark-web-page-title", "max-h-[85dvh]", "overflow-y-auto", "Back to previous detail", "Back to investigation", "key={finding.id}"]) assert.ok(dialog.includes(token), token);
  const review = source("src/components/security/dark-web-review-preview.tsx");
  for (const token of ["DARK_WEB_DISCLOSURE", "validateReviewDraft", "onSubmit=", "aria-invalid=", "maxLength={200}", "role={error ? \"alert\" : undefined}", "role=\"status\"", "Reset preview", "onCancel()", "setPreview(null)", "setDraft", "not saved"]) assert.ok(review.includes(token), token);
  const workspace = source("src/components/security/dark-web-workspace.tsx");
  assert.match(workspace, /state.kind === "ready" \? <DarkWebDemoContent key=\{contextKey\}/);
  assert.match(workspace, /setNav\(closeDarkWebNavigation\(\)\)/);
  assert.match(workspace, /DarkWebFindingsExplorer/);
  assert.match(workspace, /DarkWebRelationships/);
});

test("Dark Web Live read guard, cancellation and registry gates precede source visibility; no provider or persistence controls", () => {
  const hook = source("src/components/security/use-dark-web.ts");
  assert.ok(hook.indexOf('mode !== "demo"') < hook.indexOf("getDemoDarkWeb(scope)"));
  for (const token of ["cancelled = true", "if (!cancelled)", "visibleDarkWeb", "customersFailed", "customers.some", "contextKey:"]) assert.ok(hook.includes(token), token);
  const files = ["dark-web-workspace", "dark-web-overview", "dark-web-findings-explorer", "dark-web-relationships", "dark-web-detail", "dark-web-review-preview"];
  for (const file of files) {
    const text = source(`src/components/security/${file}.tsx`);
    assert.doesNotMatch(text, /fetch\(|axios\.|localStorage|sessionStorage|dangerouslySetInnerHTML|@\/mocks\/|@\/demo\//);
    assert.doesNotMatch(text, /onClick=\{(?:enroll|remediate|rotate|save|dismiss|scan)/i);
  }
  const workspace = source("src/components/security/dark-web-workspace.tsx");
  assert.match(workspace, /Unavailable monitoring does not mean no threats, zero breaches or full protection/);
  const explorer = source("src/components/security/dark-web-findings-explorer.tsx");
  for (const token of ["type=\"search\"", "onChange=", "role=\"status\"", "aria-live=\"polite\"", "No matching exposure examples", "No fictional findings supplied", "xl:grid-cols-2", "break-words", "sm:grid-cols-2"]) {
    assert.ok(explorer.includes(token), token);
  }
});

test("Next public API configuration ignores unsupported Vite fallback and never causes a network request", () => {
  const api = source("src/services/api.ts");
  assert.match(api, /process.env.NEXT_PUBLIC_API_BASE_URL \?\? ""/);
  assert.doesNotMatch(api, /VITE_API_BASE_URL/);
  assert.doesNotMatch(source("next.config.ts"), /VITE_API_BASE_URL/);
  const clean = { ...process.env };
  delete clean.NEXT_PUBLIC_API_BASE_URL;
  delete clean.VITE_API_BASE_URL;
  for (const [publicValue, viteValue, expected] of [[undefined, undefined, ""], [undefined, "https://ignored.example.com", ""], ["https://api.example.com", "https://ignored.example.com", "https://api.example.com"]]) {
    const env = { ...clean, ...(publicValue === undefined ? {} : { NEXT_PUBLIC_API_BASE_URL: publicValue }), ...(viteValue === undefined ? {} : { VITE_API_BASE_URL: viteValue }) };
    const value = execFileSync(process.execPath, ["--import", "./tests/register-alias.mjs", "--input-type=module", "-e", "import { API_BASE_URL } from './src/services/api.ts'; process.stdout.write(API_BASE_URL);"], { env, encoding: "utf8" });
    assert.equal(value, expected);
  }
});
