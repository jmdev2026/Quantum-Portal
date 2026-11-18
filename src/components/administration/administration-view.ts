import type { DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import type { CustomerView } from "@/components/customer-view/customer-view-state";
import { LIVE_CUSTOMER_SCOPE_LABEL } from "@/components/customer-selector/live-scope";

export const ADMINISTRATION_BOUNDARY = "Administration capabilities are presented for planning and visibility. Authentication, authorization and operational management require the future secure backend.";

export function administrationScope(mode: DashboardMode, view: CustomerView, name?: string) {
  return mode === "live" ? LIVE_CUSTOMER_SCOPE_LABEL : view.mode === "all" ? "All Customers" : name ?? "Customer unavailable";
}

export const PROPOSED_ROLES = [
  { name: "MSP Administrator", description: "An authorized service-provider operator with access restricted to assigned management capabilities and permitted customer tenants." },
  { name: "Client Administrator", description: "An authorized customer operator with permissions limited to the customer’s own tenant and approved capabilities." },
  { name: "Client Viewer", description: "An authorized customer user with read-only access to permitted reporting information." },
] as const;

export const ACCESS_REQUIREMENTS = [
  { name: "Identity & Authentication", description: "Future Laravel requirements: secure authentication, appropriate MFA for privileged accounts, server-side session management, secure token handling and appropriate session expiration and revocation." },
  { name: "Role-Based Access", description: "Future server-side role and permission validation must enforce least-privilege access. Proposed role descriptions are not deployed permissions or user assignments." },
  { name: "Customer/Tenant Authorization", description: "Tenant-scoped resource authorization must establish explicit MSP versus customer boundaries, validate requests server-side and prevent cross-tenant access. Frontend customer selection is not authorization." },
  { name: "Privileged Actions", description: "Future sensitive operations require server-side authorization and auditing before execution. This interface provides no operational account or provider management." },
] as const;

export const INTEGRATION_PLANS = [
  { name: "Laravel Backend", description: "Planned responsibilities: authentication, authorization, customer/tenant boundaries, secure provider integrations, server-side response validation, audit logging and controlled API access. Administrative and read-only capabilities must remain separate." },
  { name: "Guardz Security Platform", description: "Intended cybersecurity reporting areas include customer-specific security signals, identity and endpoint visibility, and validated security-control information. Availability depends on verified provider access and actual API capability; no operations or data contracts are promised." },
  { name: "Datto Endpoint Backup", description: "Intended integration: Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup, subject to provider capability verification. Planned reporting areas include protected assets, backup activity, freshness and available recovery information where supported. This is not Datto SIRIS or Datto SaaS Protection." },
] as const;

export const CONNECTIVITY_REQUIREMENTS = [
  "Provider credentials must be stored securely on the server, never embedded in frontend bundles.",
  "Provider access must be authorized for the correct tenant and responses validated server-side.",
  "Sensitive operations must be authenticated and logged.",
  "Provider failures must not be mistaken for zero security incidents or zero backups.",
] as const;

export const AUDIT_EVENT_TYPES = [
  "Authentication events", "Role and permission changes", "Customer-access changes",
  "Integration configuration changes", "Privileged administrative actions", "Security-sensitive operations",
] as const;

export const AUDIT_REQUIREMENTS = "Future privileged operations require server-side authorization before execution, appropriate audit event generation, action attribution, tenant/customer association, error handling, protection against unauthorized replay or cross-tenant actions, and secure handling of provider credentials. These are planned requirements, not production protections.";
