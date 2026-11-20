import type { DashboardScope } from "@/services/dashboard-response";
import type { SeverityLevel } from "@/services/security-severity";

export const DARK_WEB_SOURCE = "Simulated demo data";
export const EXPOSURE_CATEGORIES = ["account-mention", "domain-mention", "access-review"] as const;
export const EXPOSURE_REVIEW_STATUSES = ["unreviewed", "review-example"] as const;
export const RESPONSE_CATEGORIES = ["access-review", "policy-review", "administrator-review"] as const;
export const REVIEW_DISPOSITIONS = ["review-needed", "administrator-review", "guidance-prepared"] as const;
export type ExposureCategory = typeof EXPOSURE_CATEGORIES[number];
export type ExposureReviewStatus = typeof EXPOSURE_REVIEW_STATUSES[number];
export type ResponseCategory = typeof RESPONSE_CATEGORIES[number];
export type ReviewDisposition = typeof REVIEW_DISPOSITIONS[number];
type DemoMetadata = { customer: { id: number; name: string }; source: string; is_demo: true; created_at: string };
export type DarkWebDomain = DemoMetadata & { id: string; label: string; domain: string; monitoring_status: "demo-preview" };
export type DarkWebAccount = DemoMetadata & { id: string; label: string; domain: { id: string }; finding_ids: string[] };
export type ExposureFinding = DemoMetadata & {
  id: string; title: string; domain: { id: string }; account: { id: string };
  category: ExposureCategory; severity: SeverityLevel; review_status: ExposureReviewStatus;
  observation: string; response_category: ResponseCategory;
};
export type DarkWebData = { findings: ExposureFinding[]; domains: DarkWebDomain[]; accounts: DarkWebAccount[] };
export type DarkWebResponse = { data: DarkWebData; meta: { scope: DashboardScope; source: string; status: "ready" | "error"; message: string | null } };
export type DarkWebState = { kind: "loading" | "unavailable" } | { kind: "error"; message: string } | { kind: "ready"; data: DarkWebData };
export type DarkWebSelection = { kind: "finding" | "account" | "domain"; id: string };
export type ReviewDraft = { disposition: ReviewDisposition | ""; note: string };
export const EMPTY_REVIEW_DRAFT: ReviewDraft = { disposition: "", note: "" };
export const DARK_WEB_DISCLOSURE = "Demonstration only. No real finding is updated, saved, dismissed or remediated.";
