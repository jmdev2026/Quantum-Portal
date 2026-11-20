"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WorkflowBoundary } from "@/components/customer-workflows/workflow-boundary";
import { WorkflowPage, action, control, panel } from "@/components/customer-workflows/workflow-ui";
import { ENVIRONMENTS, ONBOARDING_NOTICE, SERVICE_CHOICES, emptyOnboarding, validateAllOnboarding, validateOnboarding } from "@/components/customer-workflows/preview-model";

const steps = ["Organization", "Fictional primary contact", "Supported services", "Technology environment", "Review"];
export function OnboardingPreview() {
  return <WorkflowPage area="customers" title="Customer Onboarding Preview" description="Explore a prospective fictional organization in a local, temporary workflow. No account, tenant, invitation or service agreement is created."><WorkflowBoundary requireAll><OnboardingForm /></WorkflowBoundary></WorkflowPage>;
}
function OnboardingForm() {
  const [draft, setDraft] = useState(emptyOnboarding);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) alert.current?.focus(); else title.current?.focus(); }, [step, error, confirmed]);
  const reset = () => { setDraft(emptyOnboarding()); setStep(0); setError(null); setConfirmed(false); title.current?.focus(); };
  const move = (next: number) => { setError(null); setStep(next); };
  const submit = () => {
    const issue = step === 4 ? validateAllOnboarding(draft) : validateOnboarding(draft, step);
    if (issue) { setError(issue); alert.current?.focus(); return; }
    setError(null);
    if (step === 4) setConfirmed(true); else setStep(step + 1);
  };
  return <section className={panel} aria-labelledby="onboarding-step-title"><p id="onboarding-notice" className="rounded-lg border border-amber-signal/30 bg-amber-signal/10 p-4 text-sm leading-relaxed text-amber-signal">{ONBOARDING_NOTICE}</p><ol aria-label="Onboarding progress" className="my-6 flex flex-wrap gap-2">{steps.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={`rounded-lg border px-3 py-2 text-xs ${step === index ? "border-shield-500 text-shield-300" : "border-ink-700 text-ink-300"}`}>{index + 1}. {label}</li>)}</ol><h2 ref={title} tabIndex={-1} id="onboarding-step-title" className="text-xl font-semibold text-ink-100 outline-none">{confirmed ? "Local preview inspected" : steps[step]}</h2><p className="mt-2 text-sm leading-relaxed text-ink-300">Fictional input only. Drafts clear when you leave this page or change mode or scope. This is not a registration form.</p>{confirmed ? <div className="mt-6 grid gap-4"><p role="status" className="text-shield-300">{ONBOARDING_NOTICE}</p><button onClick={reset} className={`justify-self-start ${action}`}>Reset and start another preview</button><Link href="/customers" className={`justify-self-start ${action}`}>Return to portfolio</Link></div> : <form noValidate aria-describedby="onboarding-notice" className="mt-6 grid gap-6" onSubmit={event => { event.preventDefault(); submit(); }}>
      {error && <p ref={alert} tabIndex={-1} id="onboarding-error" role="alert" className="rounded-lg border border-red-400/40 p-4 text-sm text-red-300 outline-none">{error}</p>}
      {step === 0 && <label className="text-sm text-ink-300">Fictional organization name<input autoComplete="off" maxLength={80} value={draft.organization} placeholder="Demo: Cedar Practice" aria-describedby="organization-hint" aria-invalid={!!error} className={control} onChange={event => setDraft({ ...draft, organization: event.target.value })} /><span id="organization-hint" className="mt-2 block text-xs">Start with Demo:; 12–80 characters. No real organization or identifiers.</span></label>}
      {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-ink-300">Fictional contact label<input autoComplete="off" maxLength={80} value={draft.contact} placeholder="Demo: Avery Sample" aria-invalid={!!error} className={control} onChange={event => setDraft({ ...draft, contact: event.target.value })} /></label><label className="text-sm text-ink-300">Reserved example address<input type="email" autoComplete="off" maxLength={80} value={draft.email} placeholder="contact@demo.example.com" aria-describedby="contact-hint" aria-invalid={!!error} className={control} onChange={event => setDraft({ ...draft, email: event.target.value })} /><span id="contact-hint" className="mt-2 block text-xs">Only demo.example.com, demo.example.net or demo.example.org. No messages or invitations are sent.</span></label></div>}
      {step === 2 && <fieldset><legend className="text-sm text-ink-300">Reporting areas to consider — not purchased or enabled</legend><div className="mt-3 grid gap-3">{SERVICE_CHOICES.map(service => <label key={service} className="flex min-h-11 items-center gap-3 text-sm text-ink-100"><input type="checkbox" className="h-5 w-5 accent-shield-500" checked={draft.services.includes(service)} onChange={event => setDraft({ ...draft, services: event.target.checked ? [...draft.services, service] : draft.services.filter(value => value !== service) })} />{service}</label>)}</div></fieldset>}
      {step === 3 && <div className="grid gap-4"><label className="text-sm text-ink-300">Proposed technology environment<select className={control} value={draft.environment} aria-invalid={!!error} onChange={event => setDraft({ ...draft, environment: event.target.value })}><option value="">Choose an environment</option>{ENVIRONMENTS.map(value => <option key={value}>{value}</option>)}</select></label><label className="text-sm text-ink-300">Optional fictional environment notes<textarea maxLength={200} rows={3} className={control} value={draft.notes} placeholder="Demo: Example cloud workspace" onChange={event => setDraft({ ...draft, notes: event.target.value })} /><span className="mt-2 block text-xs">Start with Demo: if supplied. No domains, credentials, addresses, numbers or links.</span></label></div>}
      {step === 4 && <div className="grid gap-4">{[["Organization", draft.organization], ["Fictional contact", `${draft.contact} · ${draft.email}`], ["Reporting areas", draft.services.join(", ")], ["Environment", `${draft.environment}${draft.notes ? ` · ${draft.notes}` : ""}`]].map(([label, value], index) => <div key={label} className="rounded-lg border border-ink-700 p-4"><h3 className="font-medium text-ink-100">{label}</h3><p className="mt-2 break-words text-sm text-ink-300">{value}</p><button type="button" className={`mt-3 ${action}`} onClick={() => move(index)}>Edit {label.toLowerCase()}</button></div>)}<p className="text-sm leading-relaxed text-amber-signal">Confirmation only acknowledges inspecting this draft. It cannot add a customer to the canonical portfolio.</p></div>}
      <div className="flex flex-wrap gap-3">{step > 0 && <button type="button" className={action} onClick={() => move(step - 1)}>Back</button>}<button type="submit" className={action}>{step === 4 ? "Confirm local preview" : "Next"}</button><button type="button" className={action} onClick={reset}>Reset draft</button><Link className={action} href="/customers">Cancel preview</Link></div>
    </form>}</section>;
}
