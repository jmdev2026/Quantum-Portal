import { DatabaseBackup, ShieldCheck } from "lucide-react";
import { IntegrationCard } from "@/components/integration-card";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1c212355_1px,transparent_1px),linear-gradient(to_bottom,#1c212355_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-12rem] left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-shield-500/10 blur-[120px]"
      />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 sm:px-8 sm:pt-24">
        <section className="mx-auto max-w-3xl animate-rise text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-shield-500/30 bg-gradient-to-b from-shield-500/20 to-shield-500/5 text-shield-400 shadow-[0_0_60px_-12px] shadow-shield-500/50">
            <ShieldCheck className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink-100 sm:text-6xl">
            Quantum Shield <span className="text-shield-400">Command</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-300 sm:text-xl">
            Unified Cybersecurity &amp; Backup Management
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/80 px-4 py-2 text-sm text-ink-300">
            <span className="h-2 w-2 rounded-full bg-amber-signal" />
            Provider integrations are not connected yet
          </div>
        </section>

        <section
          aria-label="Planned integrations"
          className="mx-auto mt-16 grid max-w-5xl gap-6 sm:mt-24 md:grid-cols-2"
        >
          <IntegrationCard
            icon={ShieldCheck}
            title="Cybersecurity"
            provider="Guardz"
            description="Threat detection, alerting, and security posture across managed client environments will be surfaced here once the Guardz integration is configured."
            capabilities={["Threat detection and alerts", "Security posture overview", "Per-tenant visibility"]}
            delay="120ms"
          />
          <IntegrationCard
            icon={DatabaseBackup}
            title="Backup & Recovery"
            provider="Datto"
            description="Endpoint backup status, job history, and recovery readiness will be surfaced here once the Datto Endpoint Backup integration is configured."
            capabilities={["Backup job status", "Recovery readiness", "Protected endpoint coverage"]}
            delay="220ms"
          />
        </section>
      </main>

      <footer className="relative z-10 border-t border-ink-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-ink-400 sm:flex-row sm:px-8">
          <span>Quantum Shield Command</span>
          <span className="font-mono">No live data &middot; integrations pending</span>
        </div>
      </footer>
    </div>
  );
}
