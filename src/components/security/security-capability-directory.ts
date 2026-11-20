import { Radar, Fingerprint, Globe2, MailCheck, MonitorCheck, Cloud, type LucideIcon } from "lucide-react";
import type { CapabilityId } from "@/services/security-capability-types";

type Context = { title: string; body: string };
export type CapabilityDefinition = {
  id: CapabilityId;
  title: string;
  description: string;
  icon: LucideIcon;
  explorer: string;
  noun: string;
  filter: "severity" | "protection" | "category";
  categoryLabel?: string;
  overview: readonly Context[];
  limitationTitle: string;
  limitation: string;
  distinction: string;
};
export const SECURITY_CAPABILITIES: readonly CapabilityDefinition[] = [
  {
    id: "mdr", title: "Managed Detection & Response", icon: Radar,
    description: "A read-only investigation workspace for understanding security observations and the boundaries of future response services.",
    explorer: "Detection visibility & investigation workspace", noun: "detections", filter: "severity",
    overview: [{ title: "MDR overview", body: "MDR combines detection review, analyst investigation and authorized response. This frontend supplies fictional investigation visibility only; active monitoring and incident-response cases are not connected." }, { title: "Review, not response", body: "Search the existing example observations, inspect their severity and customer association, and open a read-only investigation preview. No incident timeline or closed-case outcome exists." }],
    limitationTitle: "Response capability information", limitation: "Containment, remediation, device isolation and provider case handling require independently verified provider support, authenticated tenant authorization and privileged operation review. No response action can execute here.",
    distinction: "Aggregated security issues, these fictional detection examples and actual incident-response cases are three distinct concepts. Example rows are not issue totals or real cases.",
  },
  {
    id: "itdr", title: "Identity Threat Detection & Response", icon: Fingerprint,
    description: "Inspect fictional account observations without inferring account compromise, credential exposure or active identity monitoring.",
    explorer: "Account observation explorer", noun: "account observations", filter: "protection",
    overview: [{ title: "Identity security overview", body: "Identity threat detection concerns account behavior and protection visibility. These existing examples illustrate observation notes, not actual identity-provider events or compromised accounts." }, { title: "Protection not verified", body: "The canonical protection note states that protection is not verified. It establishes neither active protection nor an unprotected account. No MFA enrollment, password score or login history is supplied." }],
    limitationTitle: "Identity security recommendations", limitation: "For real accounts, authorized administrators should review identity-provider visibility and approved access policies. Account disabling, password resets, session revocation and MFA changes are unavailable; recommendations do not imply any policy is configured.",
    distinction: "These account examples are not the Dashboard Users count, a complete identity directory or verified ITDR monitoring.",
  },
  {
    id: "external-footprint", title: "External Footprint Scanning", icon: Globe2,
    description: "Explore reserved-domain asset illustrations and exposure-review categories. No network scan takes place.",
    explorer: "Illustrative internet-facing assets & exposure findings", noun: "exposure examples", filter: "category", categoryLabel: "Exposure category",
    overview: [{ title: "External asset overview", body: "External footprint work identifies authorized internet-facing assets. The reserved .example labels below are fictional assets, not discovered customer domains." }, { title: "Domain visibility", body: "The domain category illustrates an ownership-review note. It does not establish a public IP address, open port or an asset monitored by a provider." }, { title: "Certificate visibility", body: "The certificate category illustrates a review topic only. No certificate retrieval, expiration timestamp, CVSS score or confirmed vulnerability is reported." }],
    limitationTitle: "Monitoring coverage & limitations", limitation: "No scanning, vulnerability confirmation or exploitation is available. Future discovery requires explicit asset ownership authorization and independently verified backend/provider capabilities. Illustrative severity is not a verified risk assessment.",
    distinction: "The small fictional asset list is independent of aggregate Internet Assets reporting. It is neither a coverage denominator nor a completed scan.",
  },
  {
    id: "email-protection", title: "Email Protection", icon: MailCheck,
    description: "Review safe fictional message classifications and illustrative status labels, without processing any real email.",
    explorer: "Example email threat findings", noun: "email finding examples", filter: "category", categoryLabel: "Illustrative threat category",
    overview: [{ title: "Email security overview", body: "Message security examines potential threats and approved handling policies. This workspace contains safe message labels only: no bodies, recipient addresses, senders, links or attachments." }, { title: "Threat type & status visibility", body: "Impersonation and attachment-review are illustrative categories. Illustrative and Not assessed are fixture statuses, not delivery or quarantine outcomes." }, { title: "Quarantine visibility", body: "Quarantine records are not implemented. No example represents an email actually quarantined, blocked, scanned or delivered by any provider." }],
    limitationTitle: "Quarantine & protection capability information", limitation: "Release, deletion, sender blocking, allowlists, policy changes and mailbox scans are unavailable. The intended email-security provider must be verified independently; no Check Point or Guardz capability is assumed.",
    distinction: "Message examples are unrelated to aggregate Mailboxes counts and do not constitute a mailbox inventory or dedicated email report.",
  },
  {
    id: "endpoint-security", title: "Endpoint Security", icon: MonitorCheck,
    description: "Inspect existing fictional endpoint observations and their explicitly unverified protection visibility.",
    explorer: "Endpoint visibility explorer", noun: "endpoint observations", filter: "protection",
    overview: [{ title: "Endpoint security overview", body: "Endpoint security reviews device observations and protection visibility. Existing synthetic endpoint labels are reused here, without creating a second device registry." }, { title: "Protection status explanation", body: "Not verified is an observation limitation, not installed-agent status or a health verdict. No OS version, antivirus version, IP address, last check-in or EDR result is supplied." }],
    limitationTitle: "Future response capability information", limitation: "No remote actions, agent installation, device isolation or configuration changes are available. SentinelOne, Guardz or any other provider capability must be independently verified before management claims are made.",
    distinction: "Dashboard Devices, these example endpoints, Backup Protected Assets and actual provider-managed inventory are distinct. They must not be inferred from one another.",
  },
  {
    id: "cloud-data-protection", title: "Cloud Data Protection", icon: Cloud,
    description: "Inspect illustrative cloud-service observations while keeping security visibility separate from backup and recovery.",
    explorer: "Illustrative cloud assets & security observations", noun: "cloud observation examples", filter: "category", categoryLabel: "Cloud service category",
    overview: [{ title: "Cloud protection overview", body: "Cloud data protection concerns authorized service visibility and data safeguards. The examples are synthetic workspaces, not actual cloud accounts, tenant identifiers or customer files." }, { title: "Shared-storage visibility", body: "Shared-storage examples illustrate a visibility-review topic. No sharing event, real drive, DLP enforcement event or confirmed data-loss incident is represented." }, { title: "Mail-service visibility", body: "Mail-service examples concern cloud visibility, not delivered messages, verified backup coverage or recovery points. Protection remains unverified." }],
    limitationTitle: "Protection & recovery limitations", limitation: "Cloud Data Protection is distinct from Datto Endpoint Backup. No cloud configuration, data restoration, protection coverage or recovery action is available. Microsoft 365 and other provider data require independent capability verification.",
    distinction: "These fictional workspaces are not derived from Dashboard Cloud Drives or Mailboxes and provide no evidence of backup or recovery success.",
  },
];
export const PLANNED_SECURITY_CAPABILITIES = [
  { title: "Dark Web Monitoring", milestone: "F02c · P1", id: "dark-web", href: "/security/dark-web", description: "Explore fictional exposure findings, related accounts and reserved-domain previews with safe investigation and local review workflows." },
  { title: "Security Awareness Training", milestone: "F02d", description: "Dedicated training visibility and safe preview workflows remain planned." },
  { title: "Phishing Simulations", milestone: "F02d", description: "Dedicated simulation visibility and safe preview workflows remain planned." },
] as const;
export const capabilityDefinition = (id: CapabilityId) => SECURITY_CAPABILITIES.find(capability => capability.id === id)!;
