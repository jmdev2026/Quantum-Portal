import { BackupHealthPanel } from "@/components/dashboard/backup-health-panel";
import { CustomerOverviewPanel } from "@/components/dashboard/customer-overview-panel";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { IssuesBySeverityPanel } from "@/components/dashboard/issues-by-severity-panel";
import { SecurityCoveragePanel } from "@/components/dashboard/security-coverage-panel";

export function DashboardPanels() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SecurityCoveragePanel />

      <IssuesBySeverityPanel />

      <BackupHealthPanel />

      <CustomerOverviewPanel />

      <InsightsPanel />
    </div>
  );
}
