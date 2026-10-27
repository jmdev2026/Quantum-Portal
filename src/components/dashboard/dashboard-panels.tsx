import { Building2 } from "lucide-react";
import { BackupHealthPanel } from "@/components/dashboard/backup-health-panel";
import { DashboardPanel, PanelPlaceholder } from "@/components/dashboard/dashboard-panel";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { IssuesBySeverityPanel } from "@/components/dashboard/issues-by-severity-panel";
import { SecurityCoveragePanel } from "@/components/dashboard/security-coverage-panel";

export function DashboardPanels() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SecurityCoveragePanel />

      <IssuesBySeverityPanel />

      <BackupHealthPanel />

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

      <InsightsPanel />
    </div>
  );
}
