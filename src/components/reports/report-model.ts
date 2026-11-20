export const REPORTS = [
  { id: "executive", title: "Executive Summary", category: "Leadership", purpose: "Technology, security and backup visibility for business review.", sections: ["Organization and executive overview", "Technology visibility", "Security posture and severity", "Coverage and insights", "Backup visibility", "Observations and recommended reviews"] },
  { id: "cybersecurity", title: "Cybersecurity Report", category: "Security", purpose: "Security summaries, nine capabilities and illustrative observations.", sections: ["Security executive summary", "Severity breakdown", "Security coverage and insights", "Nine security capabilities", "Illustrative detections", "Identity and endpoint observations", "Security considerations"] },
  { id: "backup", title: "Backup & Recovery Report", category: "Resilience", purpose: "Protected totals, freshness, execution outcomes and recovery limitations.", sections: ["Backup visibility overview", "Protected asset summary", "Backup freshness distribution", "Backup execution outcomes", "Illustrative assets", "Illustrative jobs", "Recovery considerations and provider requirements"] },
  { id: "dark-web", title: "Dark Web Monitoring Report", category: "Security", purpose: "Fictional exposure findings, accounts and domain previews.", sections: ["Exposure overview", "Findings by severity and category", "Fictional affected accounts", "Monitored-domain preview", "Illustrative review status", "General response guidance"] },
  { id: "awareness-training", title: "Security Awareness Training Report", category: "Education", purpose: "Campaigns, topics, assignments and example completion metrics.", sections: ["Training program summary", "Illustrative campaigns", "Assigned participants and completion", "Training topics", "Outstanding example assignments", "General training recommendations"] },
  { id: "phishing-simulations", title: "Phishing Simulation Report", category: "Education", purpose: "Scenario categories, overlapping outcomes and illustrative rates.", sections: ["Simulation program overview", "Illustrative campaigns and scenarios", "Fictional participant outcomes", "Illustrative click and report rates", "Campaign-level breakdown", "Training opportunities"] },
] as const;
export type ReportId = typeof REPORTS[number]["id"];
export type ReportConfig = { report: ReportId; scope: number | null; title: string; sections: number[]; detail: "summary" | "detailed"; examples: boolean };
export const reportDefinition = (id: string) => REPORTS.find(report => report.id === id);
export const defaultConfig = (id: ReportId, scope: number | null): ReportConfig => ({ report: id, scope, title: reportDefinition(id)!.title, sections: reportDefinition(id)!.sections.map((_, index) => index), detail: "detailed", examples: true });
export function validateConfig(config: ReportConfig, id: ReportId, scope: number | null): string | null {
  const report = reportDefinition(config.report);
  if (!report || config.report !== id || config.scope !== scope) return "Report or customer scope changed. Start a new preview.";
  if (config.title.trim().length < 8 || config.title.trim().length > 80 || !/^[A-Za-z0-9 ,.&()'–—-]+$/.test(config.title.trim())) return "Use an 8–80-character report title without addresses or markup.";
  if (!Array.isArray(config.sections) || !config.sections.includes(0) || new Set(config.sections).size !== config.sections.length || config.sections.some(section => !Number.isSafeInteger(section) || section < 0 || section >= report.sections.length)) return "Include the required overview and choose unique supported sections.";
  if (!["summary", "detailed"].includes(config.detail) || typeof config.examples !== "boolean") return "Choose supported presentation options.";
  return null;
}
export const DEMO_DISCLOSURE = "DEMONSTRATION REPORT — SIMULATED DATA — NOT FOR OPERATIONAL DECISIONS.";
export const SCHEDULE_DISCLOSURE = "Demonstration only. No report has been scheduled, saved, emailed or delivered.";
export const ZONES = ["UTC", "America/New_York", "Europe/London", "Australia/Sydney"] as const;
export type ScheduleDraft = { frequency: string; time: string; zone: string; day: string; recipients: string };
export const defaultSchedule = (): ScheduleDraft => ({ frequency: "Weekly", time: "09:00", zone: "UTC", day: "Monday", recipients: "reports@demo.example.com" });
export function validateSchedule(draft: ScheduleDraft): string | null {
  if (!["Weekly", "Monthly", "Quarterly"].includes(draft.frequency) || !ZONES.includes(draft.zone as typeof ZONES[number]) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) return "Choose a supported cadence, time and time zone.";
  if (draft.frequency === "Weekly" ? !["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(draft.day) : !/^(?:[1-9]|1\d|2[0-8])$/.test(draft.day)) return "Choose a weekday or a day from 1 to 28.";
  const recipients = draft.recipients.split(",").map(value => value.trim());
  if (recipients.length > 5 || new Set(recipients).size !== recipients.length || recipients.some(value => !/^[a-z]+(?:[.-][a-z]+)*@demo\.example\.(com|net|org)$/.test(value))) return "Use up to five unique reserved Demo recipient addresses separated by commas.";
  return null;
}
export const scheduleDescription = (draft: ScheduleDraft) => `${draft.frequency}: ${draft.frequency === "Weekly" ? draft.day : `day ${draft.day}${draft.frequency === "Quarterly" ? " of January, April, July and October" : " of each month"}`} at ${draft.time} (${draft.zone}). Proposed configuration only; no delivery is arranged.`;
export function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? "'" + text : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export const csvContent = (rows: (string | number)[][]) => "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
