import { DatabaseBackup, ShieldCheck } from "lucide-react";
import { IntegrationCard } from "@/components/integration-card";
import { AssetSummary } from "@/components/dashboard/asset-summary";
import { DashboardIntro } from "@/components/dashboard/dashboard-intro";
import { DashboardPanels } from "@/components/dashboard/dashboard-panels";

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

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <DashboardIntro />
        <AssetSummary />
        <DashboardPanels />

        <section aria-labelledby="integration-status-heading">
          <h2
            id="integration-status-heading"
            className="mb-4 font-mono text-[11px] uppercase tracking-widest text-ink-400"
          >
            Integration status
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
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
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-ink-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-ink-400 sm:flex-row sm:px-6 lg:px-8">
          <span>Quantum Shield Command</span>
          <span className="font-mono">No live data &middot; integrations pending</span>
        </div>
      </footer>
    </div>
  );
}
