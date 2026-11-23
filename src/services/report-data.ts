import { getDemoAssetSummary, normalizeAssetSummary } from "@/services/dashboard-assets";
import { getDemoSecuritySeverity, normalizeSecuritySeverity } from "@/services/security-severity";
import { getDemoSecurityCoverage, normalizeSecurityCoverage, SECURITY_CONTROLS } from "@/services/security-coverage";
import { getDemoInsights, normalizeInsights } from "@/services/insights";
import { getDemoBackupHealth, normalizeBackupHealth, FRESHNESS_BUCKETS, JOB_OUTCOMES } from "@/services/backup-health";
import { getDemoBackupAssets, normalizeDemoBackupAssets } from "@/services/backup-assets";
import { getDemoBackupJobActivity, normalizeDemoBackupJobActivity } from "@/services/backup-job-activity";
import { getDemoSecurityDetections, normalizeDemoSecurityDetections, type KnownCustomer } from "@/services/security-detections";
import { getDemoVisibilityRecords, normalizeDemoVisibilityRecords } from "@/services/security-visibility-records";
import { getDemoDarkWeb, normalizeDemoDarkWeb } from "@/services/dark-web";
import { getTrainingProgram, getSimulationProgram, normalizeEducationProgram } from "@/services/education-programs";
import { trainingMetrics, simulationMetrics, campaignRecords, outcomeLabel } from "@/components/security/education-view";
import { isAssignment } from "@/services/education-types";
import { type DashboardScope, parseScope } from "@/services/dashboard-response";
import { type ReportId, reportDefinition } from "@/components/reports/report-model";

import { getGovernanceData } from "@/services/governance";
import { buildComplianceReport } from "@/services/compliance-report";

export type ReportSection = { index: number; text: string; headers: string[]; rows: (string | number)[][]; examples?: boolean; definition: string; source: string };
export type ReportData = { report: ReportId; scope: number | null; sections: ReportSection[] };
export type ReportState = { kind: "loading" | "unavailable" } | { kind: "error"; message: string } | { kind: "ready"; data: ReportData };
const count = (value: number | null) => value ?? "Not available";
const rate = (value: number | null) => value === null ? "Not available" : `${value.toFixed(1)}%`;
const general = "All values are fictional and scoped to the selected customers. No historical filtering, verified incidents, industry comparisons or operational conclusions are supported.";

// TODO(api): GET /reports/data — future authorized aggregation seam; endpoint not approved
// request: { report, scope, mode }
// response: { kind, data?: { report, scope, sections }, message? }
export async function getReportData(id: ReportId, scope: DashboardScope, registry: readonly KnownCustomer[], mode: "demo" | "live"): Promise<ReportState> {
  if (mode === "live") return { kind: "unavailable" };
  if (!reportDefinition(id) || !parseScope(scope) || (scope.type === "customer" && !registry.some(customer => customer.id === scope.customer_id))) return { kind: "error", message: "Invalid report or customer scope. No All Customers fallback is permitted." };
  const sections: ReportSection[] = [];
  const add = (index: number, text: string, headers: string[], rows: (string | number)[][], source: string, definition: string, examples = false) => sections.push({ index, text, headers, rows, source, definition, examples });
  if (["executive", "cybersecurity", "backup"].includes(id)) {
    const [rawAssets, rawSeverity, rawCoverage, rawInsights, rawBackup] = await Promise.all([getDemoAssetSummary(scope), getDemoSecuritySeverity(scope), getDemoSecurityCoverage(scope), getDemoInsights(scope), getDemoBackupHealth(scope)]);
    const assets = normalizeAssetSummary(rawAssets, scope), severity = normalizeSecuritySeverity(rawSeverity, scope), coverage = normalizeSecurityCoverage(rawCoverage, scope), insights = normalizeInsights(rawInsights, scope), backup = normalizeBackupHealth(rawBackup, scope);
    if (!assets.ok || severity.kind !== "ready" || coverage.kind !== "ready" || insights.kind !== "ready" || backup.kind !== "ready") return { kind: "error", message: "A canonical summary is unavailable, stale or invalid. Retry before preparing a report." };
    const technology = Object.entries(assets.metrics).map(([key, metric]) => [key.replaceAll("_", " "), metric.kind === "ready" ? metric.value : "Not available"]);
    const severityRows = Object.entries(severity.counts);
    const insightRows = insights.insights.map(item => [item.title, item.category, item.summary]);
    const coverageRows = [["Fictional coverage indicator", coverage.coverage ? `${coverage.coverage.percentage}%` : "Not available"], ...insightRows];
    const backupRows = [["Protected assets (aggregate)", count(backup.protectedAssets)]];
    const severityDefinition = "Aggregate open issue counts by severity; numerator = issue count, no denominator. Sample detections are separate. No validated coverage period.";
    const coverageDefinition = `Supplied fictional indicator, not calculated from control badges. Numerator/denominator not exposed; no security effectiveness inference. Basis: ${coverage.coverage?.basis ?? "Not available"}. Insights retain source meaning; no supported historical period.`;
    const backupDefinition = "Aggregate protected asset count; no total inventory denominator or complete coverage inference. No verified recovery points.";
    if (id === "executive") {
      add(0, "Business review of fictional visibility, not a risk assessment. Organization scope is the shared viewing preference; contacts, agreements and operational environment are not connected.", ["Review", "Meaning"], [["Executive overview", "Use this report to discuss reporting gaps, not verified business impact."]], "Customer registry and canonical summaries", general);
      add(1, "Technology visibility is aggregate, not inferred from observation examples.", ["Metric", "Aggregate total"], technology, "Asset Summary", "Numerator = supplied metric count; no denominator. No validated historical reporting period or protection conclusion.");
      add(2, "Security posture remains illustrative.", ["Severity", "Aggregate issues"], severityRows, "Security Severity", severityDefinition);
      add(3, "Coverage and validated insights retain their original meanings.", ["Indicator / insight", "Value / category", "Explanation"], coverageRows, "Security Coverage and Insights", coverageDefinition);
      add(4, "Backup reporting does not establish recoverability.", ["Metric", "Aggregate total"], backupRows, "Backup Health", backupDefinition);
      add(5, "General recommendations, not confirmed customer findings.", ["Review area", "Suggested discussion"], [["Security", "Review provider reporting gaps and issue classifications."], ["Technology", "Reconcile inventory with authorized source systems."], ["Resilience", "Arrange authorized restore testing and document recovery requirements."]], "General guidance", general);
    }
    if (id === "cybersecurity") {
      const [rawDetections, rawIdentities, rawEndpoints] = await Promise.all([getDemoSecurityDetections(scope), getDemoVisibilityRecords("identities", scope), getDemoVisibilityRecords("endpoints", scope)]);
      const detections = normalizeDemoSecurityDetections(rawDetections, scope, registry), identities = normalizeDemoVisibilityRecords(rawIdentities, "identities", scope, registry), endpoints = normalizeDemoVisibilityRecords(rawEndpoints, "endpoints", scope, registry);
      if (detections.kind !== "ready" || identities.kind !== "ready" || endpoints.kind !== "ready") return { kind: "error", message: "Security observations did not validate against the current scope." };
      add(0, "No live monitoring or remediation is connected.", ["Metric", "Aggregate total"], [["Open issues", count(severity.total)], ...technology.slice(0, 2)], "Asset Summary and Security Severity", severityDefinition);
      add(1, "Aggregate issues are separate from detection examples.", ["Severity", "Aggregate issues"], severityRows, "Security Severity", severityDefinition);
      add(2, "Coverage badges do not establish active protection.", ["Indicator / insight", "Value / category", "Explanation"], coverageRows, "Security Coverage and Insights", coverageDefinition);
      add(3, "Nine developed frontend capabilities; provider connectivity is not established.", ["Capability", "Fictional status", "Connectivity"], SECURITY_CONTROLS.map(control => [control.abbreviation ? `${control.abbreviation} · ${control.label}` : control.label, coverage.controls?.[control.key] ?? "unknown", "Not connected"]), "Security Coverage control definitions", "Statuses are supplied classifications; no numerator/denominator or coverage-period inference.");
      add(4, "Illustrative detections, not complete incident history.", ["Customer", "Title", "Severity", "Observation"], detections.detections.map(row => [row.customerName, row.title, row.severity, row.summary]), "Detection Explorer", "Rows are scoped examples; count is not aggregate issues. No incident timeline or actor attribution.", true);
      add(5, "Identity and endpoint observations are not full inventories.", ["Customer", "Label", "Visibility", "Observation"], [...identities.records, ...endpoints.records].map(row => [row.customerName, row.name, row.protectionVisibility, row.observation]), "Canonical identity and endpoint observations", "Rows are illustrative samples, not Dashboard user/device totals. No complete protection inference.", true);
      add(6, "Review source availability, access policies and authorized investigation processes. No remediation action is offered.", [], [], "General security guidance", general);
    }
    if (id === "backup") {
      const [rawAssetRows, rawJobRows] = await Promise.all([getDemoBackupAssets(scope), getDemoBackupJobActivity(scope)]);
      const assetRows = normalizeDemoBackupAssets(rawAssetRows, scope, registry), jobRows = normalizeDemoBackupJobActivity(rawJobRows, scope, registry);
      if (assetRows.kind !== "ready" || jobRows.kind !== "ready") return { kind: "error", message: "Backup examples did not validate against the current scope." };
      add(0, "Restore operations are not available in Quantum Shield Command. A successful backup job does not establish a tested, recoverable restoration.", [], [], "Backup Health and Recovery limitations", backupDefinition);
      add(1, "Protected assets are not equivalent to illustrative asset rows or total devices.", ["Metric", "Aggregate total"], backupRows, "Backup Health", backupDefinition);
      add(2, "Fictional freshness categorization, not complete protection or data-integrity verification.", ["Freshness bucket", "Aggregate assets"], FRESHNESS_BUCKETS.map(bucket => [bucket.label, count(backup.freshness?.[bucket.key] ?? null)]), "Backup Health freshness", "Numerator = assets in supplied bucket. Denominator not used. Bucket boundaries require backend confirmation; no historical filter.");
      add(3, "Fictional illustrative last-24-hours execution summary; not the preview generation date.", ["Execution outcome", "Aggregate executions"], JOB_OUTCOMES.map(outcome => [outcome.label, count(backup.jobOutcomes?.counts[outcome.key] ?? null)]), "Backup Health job outcomes", "Numerator = supplied job execution count, not unique assets; no success-rate denominator calculated. Period = illustrative last_24_hours; Not Available is not automatically failed.");
      add(4, "Illustrative assets only; protection not verified.", ["Customer", "Asset", "Protection", "Observation"], assetRows.records.map(row => [row.customerName, row.name, row.protectionState, row.visibilityNote]), "Backup Asset Explorer", "Example rows do not define protected aggregate totals.", true);
      add(5, "Illustrative jobs only, not historical executions.", ["Customer", "Job", "Outcome", "Description"], jobRows.records.map(row => [row.customerName, row.title, row.outcome, row.description]), "Backup Job Explorer", "Example rows do not define execution aggregate totals; no invented run date.", true);
      add(6, "Review provider mappings, approved restore tests, retention and recovery requirements. RTO/RPO, recovery points, restoration success and data integrity are not verified. Datto integration and cross-provider identifiers require developer confirmation.", [], [], "Recovery limitations and general guidance", general);
    }
  } else if (id === "compliance") {
    const governance = await getGovernanceData(scope, registry, mode);
    if (governance.kind !== "ready") return governance;
    const data = buildComplianceReport(governance.data, scope.type === "all" ? null : scope.customer_id, registry);
    return data ? { kind: "ready", data } : { kind: "error", message: "Compliance report scope did not validate." };
  } else if (id === "dark-web") {
    const state = normalizeDemoDarkWeb(await getDemoDarkWeb(scope), scope, registry);
    if (state.kind !== "ready") return { kind: "error", message: "Dark Web relationships did not validate." };
    const data = state.data;
    const grouping = (key: "severity" | "category" | "review_status") => [...new Set(data.findings.map(row => row[key]))].map(value => [value, data.findings.filter(row => row[key] === value).length]);
    const definition = "Counts derived only from validated F02c example records in this scope. Numerator = example count; no denominator. Not verified breaches; no scan, discovery or monitoring period is supplied.";
    add(0, "Fictional exposure overview; no operational monitoring is connected.", ["Example resource", "Count"], [["Findings", data.findings.length], ["Accounts", data.accounts.length], ["Domain previews", data.domains.length]], "F02c Dark Web normalized graph", definition);
    add(1, "Example findings and their classifications.", ["Customer / classification", "Title / example count", "Severity", "Category", "Observation"], [...grouping("severity"), ...grouping("category"), ...data.findings.map(row => [row.customer.name, row.title, row.severity, row.category, row.observation])], "F02c findings", definition, true);
    add(2, "Fictional account labels only; no credentials, hashes or illicit source links.", ["Customer", "Account label", "Linked example findings"], data.accounts.map(row => [row.customer.name, row.label, row.finding_ids.length]), "F02c accounts", definition, true);
    add(3, "Reserved example domains are not actively enrolled with a provider.", ["Customer", "Domain", "Status"], data.domains.map(row => [row.customer.name, row.domain, row.monitoring_status]), "F02c domains", definition, true);
    add(4, "Canonical illustrative review statuses, not completed operational investigations.", ["Review classification", "Example findings"], grouping("review_status"), "F02c findings", definition);
    add(5, "General guidance: seek authorized validation, review access policies and involve an administrator. No example establishes an actual compromise.", [], [], "General response guidance", definition);
  } else {
    const kind = id === "awareness-training" ? "training" : "simulation";
    const state = normalizeEducationProgram(await (kind === "training" ? getTrainingProgram(scope) : getSimulationProgram(scope)), kind, scope, registry);
    if (state.kind !== "ready") return { kind: "error", message: "Education records or relationships did not validate." };
    const data = state.data;
    const campaignRows = data.campaigns.map(row => [row.customer.name, row.title, data.catalog.find(item => item.id === row.content.id)!.category, row.state]);
    const records = data.records.map(row => [row.customer.name, data.participants.find(item => item.id === row.participant.id)!.label, data.campaigns.find(item => item.id === row.campaign.id)!.title, isAssignment(row) ? row.state : outcomeLabel(row)]);
    const definition = "Validated F02d fictional assignments/outcomes, not a real employee directory. Fixture authoring timestamps are not course completion or delivery dates; no validated historical reporting period.";
    if (kind === "training") {
      const metrics = trainingMetrics(data.records);
      add(0, "Training program example summary.", ["Metric", "Example value"], [["Eligible assignments", metrics.eligible], ["Unique assigned participants", metrics.assignedParticipants], ["Completed", metrics.completed], ["In progress", metrics.inProgress], ["Not started", metrics.notStarted], ["Completion rate", rate(metrics.completionRate)]], "F02d trainingMetrics", "Completion numerator = completed eligible assignments; denominator = all eligible assignments. Zero denominator = Not available. " + definition);
      add(1, "Illustrative campaigns, not live launches.", ["Customer", "Campaign", "Topic category", "State"], campaignRows, "F02d training campaigns and catalog", definition, true);
      add(2, "Assigned participant outcomes are fictional.", ["Customer", "Participant", "Campaign", "Completion status"], records, "F02d training assignments", definition, true);
      add(3, "Training topic breakdown from scoped campaign relationships.", ["Topic", "Category", "Example assignments"], data.catalog.map(item => [item.title, item.category, data.records.filter(row => data.campaigns.find(campaign => campaign.id === row.campaign.id)?.content.id === item.id).length]), "F02d training catalog and assignments", definition);
      add(4, "Outstanding fictional assignments, not overdue real employees.", ["Customer", "Participant", "Campaign", "Status"], records.filter((_, index) => isAssignment(data.records[index]) && data.records[index].state !== "completed"), "F02d training assignments", definition, true);
      add(5, "General recommendations: discuss suitable topics, accessible learning and follow-up support. No certificates, individual risk rankings or compliance score is established.", [], [], "General educational guidance", definition);
    } else {
      const metrics = simulationMetrics(data.records);
      add(0, "Fictional simulation program; no email delivery or tracking occurs.", ["Metric", "Example value"], [["Eligible outcomes", metrics.eligible], ["Unique participants", metrics.uniqueParticipants], ["Delivered examples", metrics.delivered], ["Not delivered", metrics.notDelivered], ["Both interacted and reported", metrics.both]], "F02d simulationMetrics", definition);
      add(1, "Campaigns and scenario categories retain validated relationships.", ["Customer", "Campaign", "Scenario category", "State"], campaignRows, "F02d simulation campaigns and scenarios", definition, true);
      add(2, "Participants can both interact and report; outcomes are not mutually exclusive.", ["Customer", "Participant", "Campaign", "Outcome"], records, "F02d simulation outcomes", definition, true);
      add(3, "Click rate means illustrative scenario interaction, not actual compromised employees.", ["Metric", "Numerator", "Denominator", "Rate"], [["Click / interaction rate", metrics.interacted, metrics.delivered, rate(metrics.clickRate)], ["Report rate", metrics.reported, metrics.delivered, rate(metrics.reportRate)]], "F02d simulationMetrics", "Numerators = delivered outcomes with interaction / report; common denominator = delivered outcomes. Overlap is retained; zero denominator = Not available. " + definition);
      add(4, "Campaign-level breakdown uses the same outcome definitions.", ["Campaign", "Delivered", "Interacted", "Reported", "Both", "Click rate", "Report rate"], data.campaigns.map(row => { const metric = simulationMetrics(campaignRecords(data, row.id)); return [row.title, metric.delivered, metric.interacted, metric.reported, metric.both, rate(metric.clickRate), rate(metric.reportRate)]; }), "F02d campaignRecords and simulationMetrics", definition);
      add(5, "General learning opportunities: discuss reporting suspicious messages and recognizing scenario indicators. No real campaign launching, credential capture or employee risk ranking is available.", [], [], "General educational guidance", definition);
    }
  }
  return { kind: "ready", data: { report: id, scope: scope.type === "all" ? null : scope.customer_id, sections } };
}
