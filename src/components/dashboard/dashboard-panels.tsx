import { Building2, DatabaseBackup, Lightbulb } from "lucide-react";
import { DashboardPanel, PanelPlaceholder } from "@/components/dashboard/dashboard-panel";
import { IssuesBySeverityPanel } from "@/components/dashboard/issues-by-severity-panel";
import { SecurityCoveragePanel } from "@/components/dashboard/security-coverage-panel";

const backupAreas = [
  { id: "freshness", label: "Backup freshness" },
  { id: "outcomes", label: "Job outcomes" },
  { id: "protected", label: "Protected assets" },
];

export function DashboardPanels() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SecurityCoveragePanel />

      <IssuesBySeverityPanel />

      <DashboardPanel
        id="backup-health"
        icon={DatabaseBackup}
        title="Backup Health"
        description="Datto backup freshness, outcomes and protected assets."
        status={{ label: "Not connected", tone: "disconnected" }}
      >
        <ul className="flex flex-1 flex-col gap-3">
          {backupAreas.map(({ id, label }) => (
            <li
              key={id}
              className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3"
            >
              <span className="text-sm font-medium text-ink-100">{label}</span>
              <span className="text-xs text-ink-400">Not connected</span>
            </li>
          ))}
        </ul>
      </DashboardPanel>

      <DashboardPanel
        id="customer-overview"
        icon={Building2}
        title="Customer Overview"
        description="MSP-wide summary of the managed customer portfolio."
        status={{ label: "Awaiting integration", tone: "pending" }}
        className="lg:col-span-2"
      >
        <PanelPlaceholder
          icon={Building2}
          title="Portfolio summary reserved"
          message="A portfolio summary will appear here once customer data is supplied by the platform."
        />
      </DashboardPanel>

      <DashboardPanel
        id="insights"
        icon={Lightbulb}
        title="Insights"
        description="Security, backup and operational recommendations."
        status={{ label: "Awaiting integration", tone: "pending" }}
        className="lg:col-span-3"
      >
        <PanelPlaceholder
          icon={Lightbulb}
          title="No insights yet"
          message="Recommendations will be generated once security and backup providers are connected and reporting data."
        />
      </DashboardPanel>
    </div>
  );
}
