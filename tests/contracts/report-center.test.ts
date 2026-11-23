import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REPORTS, defaultConfig, validateConfig, reportDefinition, defaultSchedule, validateSchedule, scheduleDescription, csvCell, csvContent, DEMO_DISCLOSURE, SCHEDULE_DISCLOSURE } from "@/components/reports/report-model";
import { getReportData } from "@/services/report-data";
import { isNavItemActive, navSections } from "@/components/sidebar/navigation";
import { trainingMetrics, simulationMetrics } from "@/components/security/education-view";
import { getTrainingProgram, getSimulationProgram, normalizeEducationProgram } from "@/services/education-programs";
import { getDemoDarkWeb, normalizeDemoDarkWeb } from "@/services/dark-web";
import type { DashboardScope } from "@/services/dashboard-response";
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const registry = [1, 2, 3].map((id, index) => ({ id, name: `Demo Customer ${"ABC"[index]}` }));
const center = read("src/components/reports/report-center.tsx");
const renderer = read("src/components/reports/report-renderer.tsx");

test("six distinct report definitions and direct routes preserve Reports navigation", () => {
  assert.equal(REPORTS.length, 7); assert.equal(new Set(REPORTS.map(report => report.id)).size, 7);
  const nav = navSections.flatMap(section => section.items).find(item => item.id === "reports")!;
  for (const report of REPORTS) { assert.equal(isNavItemActive(nav, `/reports/${report.id}`), true); assert.ok(report.sections.length >= 6); }
  assert.equal(isNavItemActive(nav, "/reports/history"), false);
  assert.equal(reportDefinition("unknown"), undefined);
  assert.match(read("src/app/reports/[report]/page.tsx"), /notFound\(\)/);
  assert.match(center, /Return to Report Library/);
  assert.match(center, /aria-current=\{id === item.id/);
});
for (const scopeId of [null, 1, 2, 3]) test(`all six reports validate canonical sources for scope ${scopeId ?? "all"}`, async () => {
  const scope: DashboardScope = scopeId === null ? { type: "all" } : { type: "customer", customer_id: scopeId };
  const reports = await Promise.all(REPORTS.map(report => getReportData(report.id, scope, registry, "demo")));
  for (const [index, result] of reports.entries()) {
    assert.equal(result.kind, "ready", JSON.stringify(result));
    if (result.kind !== "ready") continue;
    assert.equal(result.data.report, REPORTS[index].id); assert.equal(result.data.scope, scopeId);
    assert.equal(result.data.sections.length, REPORTS[index].sections.length);
    for (const section of result.data.sections) { assert.ok(section.source); assert.ok(section.definition); if (scopeId !== null) for (const row of section.rows) for (const value of row) if (typeof value === "string" && /^Demo Customer [ABC]$/.test(value)) assert.equal(value, registry[scopeId - 1].name); }
  }
  const executive = reports[0]; const backup = reports[2];
  if (executive.kind === "ready") { const rows = executive.data.sections[1].rows; assert.equal(rows.find(row => row[0] === "users")?.[1], [146, 62, 48, 36][scopeId ?? 0]); assert.equal(rows.find(row => row[0] === "devices")?.[1], [83, 35, 27, 21][scopeId ?? 0]); }
  if (backup.kind === "ready") { assert.equal(backup.data.sections[1].rows[0][1], [61, 18, 27, 16][scopeId ?? 0]); assert.equal(backup.data.sections[4].rows.length, scopeId === null ? 6 : 2); assert.equal(backup.data.sections[5].rows.length, scopeId === null ? 6 : 2); }
});
test("Dark Web report reconciles with F02c graph without monitoring claims", async () => {
  const scope: DashboardScope = { type: "all" };
  const canonical = normalizeDemoDarkWeb(await getDemoDarkWeb(scope), scope, registry);
  const report = await getReportData("dark-web", scope, registry, "demo");
  assert.ok(canonical.kind === "ready" && report.kind === "ready");
  if (canonical.kind === "ready" && report.kind === "ready") { assert.equal(report.data.sections[0].rows[0][1], canonical.data.findings.length); assert.equal(report.data.sections[2].rows.length, canonical.data.accounts.length); assert.equal(report.data.sections[3].rows.length, canonical.data.domains.length); assert.match(report.data.sections[3].text, /not actively enrolled/); }
});
test("training report completion numerator and denominator reuse F02d", async () => {
  const scope: DashboardScope = { type: "all" };
  const canonical = normalizeEducationProgram(await getTrainingProgram(scope), "training", scope, registry);
  const report = await getReportData("awareness-training", scope, registry, "demo");
  assert.ok(canonical.kind === "ready" && report.kind === "ready");
  if (canonical.kind === "ready" && report.kind === "ready") { const metrics = trainingMetrics(canonical.data.records); const rows = report.data.sections[0].rows; assert.equal(rows[0][1], metrics.eligible); assert.equal(rows[2][1], metrics.completed); assert.equal(rows[5][1], "33.3%"); assert.equal(report.data.sections[4].rows.length, metrics.inProgress + metrics.notStarted); }
});
test("simulation rates retain overlapping outcomes and delivered denominator", async () => {
  const scope: DashboardScope = { type: "all" };
  const canonical = normalizeEducationProgram(await getSimulationProgram(scope), "simulation", scope, registry);
  const report = await getReportData("phishing-simulations", scope, registry, "demo");
  assert.ok(canonical.kind === "ready" && report.kind === "ready");
  if (canonical.kind === "ready" && report.kind === "ready") { const metrics = simulationMetrics(canonical.data.records); assert.equal(report.data.sections[0].rows[4][1], metrics.both); assert.deepEqual(report.data.sections[3].rows[0].slice(1), [metrics.interacted, metrics.delivered, "50.0%"]); assert.deepEqual(report.data.sections[3].rows[1].slice(1), [metrics.reported, metrics.delivered, "50.0%"]); }
});
test("zero education denominators remain unavailable rather than zero success", () => { assert.equal(trainingMetrics([]).completionRate, null); assert.equal(simulationMetrics([]).clickRate, null); assert.equal(simulationMetrics([]).reportRate, null); assert.match(read("src/services/report-data.ts"), /value === null \? "Not available"/); });
test("Live rejects all report fixture output", async () => { for (const report of REPORTS) assert.deepEqual(await getReportData(report.id, { type: "all" }, registry, "live"), { kind: "unavailable" }); });
test("unknown, revoked and unsafe selected scope cannot widen", async () => { for (const id of [999, -1, NaN, 1.5]) assert.equal((await getReportData("executive", { type: "customer", customer_id: id }, registry, "demo")).kind, "error"); assert.equal((await getReportData("dark-web", { type: "customer", customer_id: 2 }, registry.filter(row => row.id !== 2), "demo")).kind, "error"); });
test("wrong customer names fail canonical relationship normalization", async () => { assert.equal((await getReportData("cybersecurity", { type: "customer", customer_id: 2 }, [{ id: 2, name: "Wrong" }], "demo")).kind, "error"); });
test("configuration defaults provide valid supported sections", () => { for (const report of REPORTS) { const config = defaultConfig(report.id, 2); assert.equal(validateConfig(config, report.id, 2), null); assert.deepEqual(config.sections, report.sections.map((_, index) => index)); } });
test("configuration rejects report/scope manipulation", () => { const config = defaultConfig("executive", 1); assert.ok(validateConfig(config, "backup", 1)); assert.ok(validateConfig(config, "executive", 2)); assert.ok(validateConfig({ ...config, report: "unknown" as typeof config.report }, "executive", 1)); });
test("required, duplicate and unknown section IDs are rejected", () => { const config = defaultConfig("executive", null); for (const sections of [[], [1], [0, 0], [0, 99], [0, -1], [0, 1.2]]) assert.ok(validateConfig({ ...config, sections }, "executive", null)); assert.equal(validateConfig({ ...config, sections: [0, 2] }, "executive", null), null); });
test("custom title and presentation boundary validation", () => { const config = defaultConfig("executive", null); for (const title of ["Short", "X".repeat(81), "<script>bad</script>", "Customer\nReport", "contact@example.com"]) assert.ok(validateConfig({ ...config, title }, "executive", null)); assert.ok(validateConfig({ ...config, detail: "invalid" as typeof config.detail }, "executive", null)); assert.ok(validateConfig({ ...config, examples: "yes" as unknown as boolean }, "executive", null)); });
test("independent defaults permit meaningful reset without mutation", () => { const first = defaultConfig("backup", 1); first.sections.pop(); assert.equal(defaultConfig("backup", 1).sections.length, 7); assert.equal(defaultConfig("backup", 2).scope, 2); });
test("preview applies explicit config and Edit discards output", () => { assert.match(center, /validateConfig\(draft, id, scopeId\)/); assert.match(center, /structuredClone\(draft\)/); assert.match(center, /setEditing\(true\); setPreview\(null\)/); assert.match(center, /setDraft\(defaultConfig\(id, scopeId\)\)/); assert.match(renderer, /config.sections.includes/); assert.match(renderer, /config.examples/); assert.match(renderer, /config.detail === "summary"/); });
test("source envelopes cancel stale results and gate registry identity before rendering", () => { for (const pattern of [/active = false/, /loaded.registry !== registry/, /loaded.scope !== scopeId/, /loaded.id !== id/, /loaded.attempt !== attempt/, /preview\?\.data === state.data/, /WorkflowBoundary/]) assert.match(center, pattern); });
test("print operates against actual isolated report with persistent disclosure", () => { assert.match(center, /window.print\(\)/); assert.match(center, /createPortal/); assert.match(center, /className="report-print-root"/); assert.match(renderer, /DEMO_DISCLOSURE/g); assert.equal(DEMO_DISCLOSURE, "DEMONSTRATION REPORT — SIMULATED DATA — NOT FOR OPERATIONAL DECISIONS."); const css = read("src/app/globals.css"); assert.match(css, /@page \{ size: letter/); assert.match(css, /body > \*:not\(\.report-print-root\)/); assert.match(css, /table-header-group/); assert.match(css, /break-inside: avoid/); });
test("CSV quoting handles commas, quotes and multiline Unicode", () => { assert.equal(csvCell('é, "quoted"\nnext'), '"é, ""quoted""\nnext"'); assert.equal(csvCell(12), '"12"'); assert.ok(csvContent([["é", "value"]]).startsWith("\uFEFF")); assert.match(csvContent([["a"], ["b"]]), /\r\n/); });
test("CSV neutralizes formula and control-prefixed cells", () => { for (const value of ["=1+1", "+SUM(A1)", "-1+1", "@SUM(A1)", "  =1", "\tformula", "\rvalue", "\nvalue", "\u0001=1"]) assert.ok(csvCell(value).startsWith('"\'')); });
test("CSV download checks current context and includes only configured example sections", () => { for (const pattern of [/outputValid\(\)/, /section.examples/, /currentPreview.config.sections.includes/, /currentPreview.config.examples/, /new Blob/, /URL.createObjectURL/, /anchor.download = `quantum-demo-/, /anchor.click\(\)/, /URL.revokeObjectURL/, /No current enabled example rows/]) assert.match(center, pattern); assert.doesNotMatch(center, /Download PDF|export successful/i); });
test("cadence validation and honest descriptions cover all supported frequencies", () => { for (const frequency of ["Weekly", "Monthly", "Quarterly"]) { const draft = { ...defaultSchedule(), frequency, day: frequency === "Weekly" ? "Monday" : "15" }; assert.equal(validateSchedule(draft), null); assert.match(scheduleDescription(draft), /Proposed configuration only/); } assert.match(scheduleDescription({ ...defaultSchedule(), frequency: "Quarterly", day: "1" }), /January, April, July and October/); });
test("schedule rejects unsupported time, zones and cadence-specific settings", () => { for (const patch of [{ frequency: "Daily" }, { time: "24:00" }, { time: "09:60" }, { zone: "Mars" }, { day: "32" }, { frequency: "Monthly", day: "Monday" }, { frequency: "Quarterly", day: "29" }]) assert.ok(validateSchedule({ ...defaultSchedule(), ...patch })); });
test("recipients remain reserved, unique and bounded", () => { for (const recipients of ["real@gmail.com", "reports@demo.example.com,reports@demo.example.com", "bad..name@demo.example.com", "=formula@demo.example.com", "", "reports@demo.example.com\nother"]) assert.ok(validateSchedule({ ...defaultSchedule(), recipients })); assert.equal(validateSchedule({ ...defaultSchedule(), recipients: "reports@demo.example.com,review@demo.example.net" }), null); });
test("schedule review/reset and errors are meaningful but nonoperational", () => { const source = read("src/components/reports/report-schedule.tsx"); for (const pattern of [/validateSchedule\(draft\)/, /Preview Schedule/, /setDraft\(defaultSchedule\(\)\)/, /setReview\(false\)/, /role="alert"/, /heading.current\?\.focus/]) assert.match(source, pattern); assert.equal(SCHEDULE_DISCLOSURE, "Demonstration only. No report has been scheduled, saved, emailed or delivered."); assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|Activate Schedule/); });
test("reports do not invent historical filters or event timestamps", () => { const source = read("src/services/report-data.ts"); assert.doesNotMatch(source, /new Date\(|Date.now\(|type="date"/); assert.match(center, /new Date\(\).toLocaleString/); assert.match(renderer, /not a data observation date or coverage period/); });
test("native forms, labels, announcements, tables and print contrast are implemented", () => { assert.match(center, /<form onSubmit=\{apply\}/); assert.match(center, /<fieldset/); assert.match(center, /role="status"/); assert.match(renderer, /<caption/); assert.match(renderer, /scope="col"/); assert.match(renderer, /bg-white/); assert.match(renderer, /text-slate-900/); assert.match(renderer, /overflow-wrap:anywhere/); assert.match(read("src/components/reports/report-schedule.tsx"), /focus-visible/); });
test("existing three tabs and canonical sources are retained", () => { const original = read("src/components/reports/reports-workspace.tsx"); assert.match(original, /REPORT_TYPES = \["Executive Summary", "Cybersecurity Report", "Backup & Recovery Report"\]/); assert.match(original, /<ReportLibrary/); for (const name of ["ExecutiveSummary", "SecurityCoveragePanel", "BackupOverviewPanel"]) assert.match(original, new RegExp(name)); });
