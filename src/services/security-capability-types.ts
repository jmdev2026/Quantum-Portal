import type { DashboardScope } from "@/services/dashboard-response";
import type { SeverityLevel } from "@/services/security-severity";

export type CapabilityId = "mdr" | "itdr" | "external-footprint" | "email-protection" | "endpoint-security" | "cloud-data-protection";
export type NewCapabilityId = "external-footprint" | "email-protection" | "cloud-data-protection";
export const CAPABILITY_SOURCE = "Simulated demo data";
export const CAPABILITY_CATEGORIES = {
  "external-footprint": ["domain", "certificate"],
  "email-protection": ["impersonation", "attachment-review"],
  "cloud-data-protection": ["shared-storage", "mail-service"],
} as const;
export const ILLUSTRATIVE_STATUSES = ["illustrative", "not-assessed"] as const;
export type CapabilityResource = {
  id: string;
  name: string;
  customer: { id: number; name: string };
  asset_label: string;
  category: string;
  status: typeof ILLUSTRATIVE_STATUSES[number];
  severity: SeverityLevel | null;
  observation: string;
  protection_visibility: "Protection not verified";
  source: typeof CAPABILITY_SOURCE;
  is_fictional: true;
  created_at: string;
};
export type CapabilityResponse = {
  data: CapabilityResource[];
  meta: { scope: DashboardScope; capability: NewCapabilityId; source: string; status: "ready" | "error"; message: string | null };
};
export type CapabilityRecord = {
  id: string;
  name: string;
  customerId: number;
  customerName: string;
  observation: string;
  source: string;
  severity?: SeverityLevel;
  protectionVisibility?: string;
  assetLabel?: string;
  category?: string;
  status?: string;
};
export type CapabilityState = { kind: "ready"; records: CapabilityRecord[] } | { kind: "loading" | "unavailable" } | { kind: "error"; message: string };
