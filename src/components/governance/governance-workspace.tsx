"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { WorkflowBoundary } from "@/components/customer-workflows/workflow-boundary";
import { getGovernanceData, type GovernanceState } from "@/services/governance";
import { GovernanceNavigation, governancePanel, governanceAction } from "@/components/governance/governance-ui";
import { GovernanceExplorer } from "@/components/governance/governance-explorer";
import { FrameworkPreview } from "@/components/governance/framework-preview";
import { AssessmentPreview } from "@/components/governance/assessment-preview";
import { EvidencePreview } from "@/components/governance/evidence-preview";
import { AccessPreview } from "@/components/governance/access-preview";
import { IntegrationPreview } from "@/components/governance/integration-preview";
import { SettingsPreview } from "@/components/governance/settings-preview";
import { EVIDENCE_CATEGORIES, CONTROL_DISCLOSURE } from "@/components/compliance/compliance-view";
import { AUDIT_EVENT_TYPES, AUDIT_REQUIREMENTS } from "@/components/administration/administration-view";
export type GovernanceSection = "framework" | "controls" | "assessments" | "evidence" | "access" | "integrations" | "audit" | "settings";
export function GovernanceWorkspace({ module, section }: { module: "compliance" | "administration"; section: GovernanceSection }) {
  return <><header className="space-y-4"><p className="text-sm uppercase tracking-widest text-shield-300">Quantum Shield IT · governance</p><h1 id="governance-heading" tabIndex={-1} className="text-3xl font-semibold leading-tight">{module === "compliance" ? "Compliance" : "Administration"} · {section[0].toUpperCase() + section.slice(1)}</h1><p className="text-sm leading-relaxed text-ink-300">Demonstration workflows only. Frontend customer isolation is not server authorization. No certification, access mutation, provider connection or saved setting is represented.</p></header><GovernanceNavigation module={module} /><WorkflowBoundary><GovernanceSession section={section} /></WorkflowBoundary></>;
}
function GovernanceSession({ section }: { section: GovernanceSection }) {
  const { view, selectedCustomer, customersState } = useCustomerView(); const { mode } = useDashboardMode(); const query = useSearchParams().get("control");
  const selected = view.mode === "customer" ? view.customerId : null; const registry = customersState.status === "ready" ? customersState.customers : null;
  const [attempt, setAttempt] = useState(0); const [loaded, setLoaded] = useState<{ selected: number | null; registry: typeof registry; attempt: number; state: GovernanceState } | null>(null);
  useEffect(() => {
    if (mode !== "demo" || !registry) return;
    let active = true; const scope = selected === null ? { type: "all" as const } : { type: "customer" as const, customer_id: selected };
    getGovernanceData(scope, registry, mode).then(state => { if (active) setLoaded({ selected, registry, attempt, state }); }).catch(() => { if (active) setLoaded({ selected, registry, attempt, state: { kind: "error", message: "Scoped governance sources could not be loaded. Retry without widening scope." } }); });
    return () => { active = false; };
  }, [mode, selected, registry, attempt]);
  const valid = mode === "demo" && registry !== null && (selected === null || registry.some(customer => customer.id === selected));
  const state: GovernanceState = !valid ? { kind: "unavailable" } : !loaded || loaded.selected !== selected || loaded.registry !== registry || loaded.attempt !== attempt ? { kind: "loading" } : loaded.state;
  if (state.kind !== "ready" || !registry) return <section className={governancePanel}><p role={state.kind === "error" ? "alert" : "status"}>{state.kind === "loading" ? "Loading and validating customer-scoped governance examples…" : state.kind === "error" ? state.message : "Live governance data and secure administrative services are not connected. No fictional records or actionable draft are shown."}</p>{state.kind === "error" && <button className={governanceAction} onClick={() => setAttempt(attempt + 1)}>Retry Scoped Sources</button>}</section>;
  const { data } = state; const scopeName = selected === null ? "All Customers" : selectedCustomer?.name ?? "Customer unavailable";
  return <div key={`${section}:${selected}:${attempt}:${query ?? ""}`} className="min-w-0 space-y-6"><p className="text-sm text-ink-300">Scope: {scopeName} · Simulated data · local drafts clear on scope, mode, source or route changes.</p>
    {section === "framework" && <FrameworkPreview />}
    {section === "controls" && <><p className="text-sm">{CONTROL_DISCLOSURE}</p><GovernanceExplorer kind="controls" rows={data.controls.map(control => ({ id: control.key, title: control.label, category: "No validated NIST mapping", state: data.statuses[control.key] ?? "unknown", customer: scopeName, description: "Canonical security-reporting signal; control-specific observation and verified evidence requirement are not supplied.", control: control.key }))} /></>}
    {section === "assessments" && <AssessmentPreview data={data} selected={selected} registry={registry} />}
    {section === "evidence" && <><section className={governancePanel}><h2 className="text-xl font-semibold">Evidence planning requirements</h2><p className="text-sm">Educational categories only. Required records and retention must be determined by an authorized reviewer; none are mapped to official NIST outcomes here.</p><ul className="list-inside list-disc space-y-3 text-sm">{EVIDENCE_CATEGORIES.map(category => <li key={category}>{category}</li>)}</ul></section><GovernanceExplorer kind="evidence" rows={data.evidence.map(row => ({ id: row.id, title: row.category, category: row.category, state: row.state, customer: row.customer.name, description: row.description, control: row.control.key }))} /><EvidencePreview data={data} selected={selected} registry={registry} /></>}
    {section === "access" && <AccessPreview data={data} selected={selected} registry={registry} />}
    {section === "integrations" && <IntegrationPreview selected={selected} registry={registry} />}
    {section === "audit" && <><GovernanceExplorer kind="audit" rows={data.audit.map(row => ({ id: row.id, title: row.category, category: row.category, state: "Synthetic schema example", customer: row.customer.name, description: `${row.actor.label}: ${row.description}` }))} /><section className={governancePanel}><h2 className="text-xl font-semibold">Auditability design requirements</h2><p className="text-sm">{AUDIT_REQUIREMENTS}</p><ul className="list-inside list-disc space-y-3 text-sm">{AUDIT_EVENT_TYPES.map(category => <li key={category}>{category}</li>)}</ul><p className="text-sm">Future event schema: immutable event identifier, authorized actor reference, tenant, action category, target reference, result and server-recorded occurrence time. Fictional fixture authoring metadata is never an event time. Retention policy, tamper resistance, restricted access and authorized redacted export require backend implementation. No audit export or recording operates here.</p></section></>}
    {section === "settings" && <SettingsPreview />}
  </div>;
}
