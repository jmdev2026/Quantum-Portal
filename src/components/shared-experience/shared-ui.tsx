import Link from "next/link";
import type { ReactNode } from "react";
import type { ApplicationState } from "@/services/application-experience";
import { governanceAction, governancePanel } from "@/components/governance/governance-ui";
export function SharedPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main id="main-content" className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><header className="space-y-4"><p className="text-xs uppercase tracking-widest text-shield-300">Quantum Shield IT · application experience</p><h1 id="governance-heading" tabIndex={-1} className="text-3xl font-semibold leading-tight">{title}</h1><p className="max-w-3xl text-sm leading-relaxed text-ink-300">{description}</p></header><nav className="flex flex-wrap gap-2" aria-label="Application experiences">{[["/", "Dashboard"], ["/account", "Account"], ["/notifications", "Notifications"], ["/help", "Help"], ["/sign-in", "Sign-in Design"]].map(([href, label]) => <Link key={href} className={governanceAction} href={href}>{label}</Link>)}</nav>{children}</main>;
}
export function ApplicationSourceState({ state, retry }: { state: Exclude<ApplicationState, { kind: "ready" }>; retry: () => void }) {
  return <section className={governancePanel}><p role={state.kind === "error" ? "alert" : "status"}>{state.kind === "loading" ? "Loading and validating scoped application examples…" : state.kind === "error" ? state.message : "Authentication and application services are not connected. No fictional profile or notification data is shown in Live."}</p>{state.kind === "error" && <button className={governanceAction} onClick={retry}>Retry Scoped Examples</button>}<Link href="/help#limitations" className={governanceAction}>Understand Unavailable Data</Link></section>;
}
