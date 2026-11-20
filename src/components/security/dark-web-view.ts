import { SEVERITY_LEVELS } from "@/services/security-severity";
import { EXPOSURE_CATEGORIES, EXPOSURE_REVIEW_STATUSES, REVIEW_DISPOSITIONS, type DarkWebData, type DarkWebState, type DarkWebSelection, type ReviewDraft } from "@/services/dark-web-types";
import type { KnownCustomer } from "@/services/security-detections";

export type DarkWebFilters = { search: string; severity: string; category: string; review: string; domain: string; sort: "title-asc" | "title-desc" | "severity" | "category" };
export const resetDarkWebFilters = (): DarkWebFilters => ({ search: "", severity: "all", category: "all", review: "all", domain: "all", sort: "severity" });
export function updateDarkWebFilters(filters: DarkWebFilters, field: keyof DarkWebFilters, value: string, data: DarkWebData): DarkWebFilters {
  const options: Record<Exclude<keyof DarkWebFilters, "search">, readonly string[]> = {
    severity: ["all", ...SEVERITY_LEVELS], category: ["all", ...EXPOSURE_CATEGORIES], review: ["all", ...EXPOSURE_REVIEW_STATUSES], domain: ["all", ...data.domains.map(domain => domain.id)], sort: ["title-asc", "title-desc", "severity", "category"],
  };
  if (field === "search") return { ...filters, search: value.slice(0, 200) };
  return options[field].includes(value) ? { ...filters, [field]: value } : filters;
}
export const darkWebLabel = (value: string) => value.replaceAll("-", " ");
export function filterExposureFindings(data: DarkWebData, filters: DarkWebFilters) {
  const search = filters.search.trim().toLowerCase();
  return data.findings.filter(finding => {
    const domain = data.domains.find(domain => domain.id === finding.domain.id)!;
    const account = data.accounts.find(account => account.id === finding.account.id)!;
    return [finding.title, finding.observation, finding.category, domain.domain, domain.label, account.label].join(" ").toLowerCase().includes(search) &&
      (filters.severity === "all" || filters.severity === finding.severity) && (filters.category === "all" || filters.category === finding.category) &&
      (filters.review === "all" || filters.review === finding.review_status) && (filters.domain === "all" || filters.domain === domain.id);
  }).sort((a, b) => {
    const title = a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en");
    if (filters.sort === "title-desc") return -title;
    if (filters.sort === "severity") return SEVERITY_LEVELS.indexOf(a.severity) - SEVERITY_LEVELS.indexOf(b.severity) || title;
    if (filters.sort === "category") return a.category.localeCompare(b.category, "en") || title;
    return title;
  });
}
export function darkWebSummary(data: DarkWebData) {
  return { findings: data.findings.length, accounts: data.accounts.length, domains: data.domains.length, categories: new Set(data.findings.map(finding => finding.category)).size,
    reviewExamples: data.findings.filter(finding => finding.review_status === "review-example").length,
    severities: SEVERITY_LEVELS.map(severity => ({ severity, count: data.findings.filter(finding => finding.severity === severity).length })),
    reviewStatuses: EXPOSURE_REVIEW_STATUSES.map(status => ({ status, count: data.findings.filter(finding => finding.review_status === status).length })),
    categoryCounts: EXPOSURE_CATEGORIES.map(category => ({ category, count: data.findings.filter(finding => finding.category === category).length })),
  };
}
export const accountFindings = (data: DarkWebData, id: string) => data.findings.filter(finding => finding.account.id === id);
export const domainFindings = (data: DarkWebData, id: string) => data.findings.filter(finding => finding.domain.id === id);
export function selectDarkWebDetail(state: DarkWebState, selection: DarkWebSelection | null) {
  if (state.kind !== "ready" || !selection) return null;
  if (selection.kind === "finding") { const record = state.data.findings.find(record => record.id === selection.id); return record ? { kind: "finding" as const, record } : null; }
  if (selection.kind === "account") { const record = state.data.accounts.find(record => record.id === selection.id); return record ? { kind: "account" as const, record } : null; }
  const record = state.data.domains.find(record => record.id === selection.id); return record ? { kind: "domain" as const, record } : null;
}
export type DarkWebNavigation = { current: DarkWebSelection | null; history: DarkWebSelection[] };
export const closeDarkWebNavigation = (): DarkWebNavigation => ({ current: null, history: [] });
export function openDarkWebDetail(state: DarkWebState, nav: DarkWebNavigation, selection: DarkWebSelection, related = false): DarkWebNavigation {
  return selectDarkWebDetail(state, selection) ? { current: selection, history: related && nav.current ? [...nav.history, nav.current] : [] } : closeDarkWebNavigation();
}
export const backDarkWebDetail = (nav: DarkWebNavigation): DarkWebNavigation => ({ current: nav.history.at(-1) ?? null, history: nav.history.slice(0, -1) });
export function validateReviewDraft(draft: ReviewDraft): string | null {
  if (!(REVIEW_DISPOSITIONS as readonly string[]).includes(draft.disposition)) return "Select an available demonstration review disposition.";
  const note = draft.note.trim();
  if (note.length < 12 || note.length > 200 || !/^Demo: [A-Za-z ,.'()-]+$/.test(note) || /password|credential|token|secret|hash|https|www|onion|username|address/i.test(note)) return "Use 12–200 characters beginning with ‘Demo: ’, with words only. Do not include personal details, credentials, numbers or links.";
  return null;
}
export type LoadedDarkWeb = { mode: "demo" | "live"; customerId: number | null; attempt: number; state: DarkWebState };
export function visibleDarkWeb(loaded: LoadedDarkWeb, mode: "demo" | "live", customerId: number | null, attempt: number, customers: readonly KnownCustomer[] | null): DarkWebState {
  if (mode === "live") return { kind: "unavailable" };
  if (!customers) return { kind: "loading" };
  if (customerId !== null && (!Number.isSafeInteger(customerId) || customerId <= 0 || !customers.some(customer => customer.id === customerId))) return { kind: "error", message: "Customer scope is invalid. No portfolio fallback is available." };
  if (loaded.mode !== mode || loaded.customerId !== customerId || loaded.attempt !== attempt) return { kind: "loading" };
  if (loaded.state.kind === "ready") {
    const rows = [...loaded.state.data.findings, ...loaded.state.data.accounts, ...loaded.state.data.domains];
    if (rows.some(row => (customerId !== null && row.customer.id !== customerId) || !customers.some(customer => customer.id === row.customer.id && customer.name === row.customer.name))) return { kind: "error", message: "Customer scope changed. Previous examples are no longer available." };
  }
  return loaded.state;
}
export const RESPONSE_GUIDANCE = {
  "access-review": "Ask an authorized administrator to review account access and unexpected sign-in activity, verify MFA configuration, and follow approved credential-rotation procedures if appropriate. No action has been performed.",
  "policy-review": "Review domain ownership and approved email/identity protection policies with an authorized administrator. Consider additional employee awareness guidance. No domain is enrolled or protection verified.",
  "administrator-review": "Use approved organizational investigation procedures, confirm authorized account scope and review access policies. Determine whether additional awareness guidance is appropriate. This is informational, not a remediation result.",
} as const;
