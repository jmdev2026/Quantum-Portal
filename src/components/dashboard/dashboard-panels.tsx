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

      <div
        data-row="backup-overview"
        className="grid grid-cols-1 items-start gap-6 lg:col-span-3 xl:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]"
      >
        <BackupHealthPanel />

        <CustomerOverviewPanel />
      </div>

      <InsightsPanel />
    </div>
  );
}
