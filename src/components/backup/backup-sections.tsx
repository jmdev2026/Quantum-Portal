"use client";

import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { BackupJobActivityPanel } from "@/components/backup/backup-job-activity-panel";
import { BackupOverviewPanel } from "@/components/backup/backup-overview-panel";
import { BackupSummaryDrilldowns } from "@/components/backup/backup-summary-drilldowns";
import { BackupPreviewActions } from "@/components/backup/backup-preview-actions";
import { ProtectedAssetsPanel } from "@/components/backup/protected-assets-panel";
import { RecoveryInformationPanel } from "@/components/backup/recovery-information-panel";
import { BACKUP_SECTIONS, backupAnnouncement } from "@/components/backup/backup-view";
import { securityScopeLabel } from "@/components/security/security-overview-view";

export function BackupSections() {
  const { view, selectedCustomer } = useCustomerView();
  const { mode } = useDashboardMode();
  const scopeLabel = mode === "live" ? "Customer scope unavailable" : securityScopeLabel(view.mode, selectedCustomer?.name);

  return (
    <div className="grid gap-6" data-mode={mode}>
      <p role="status" className="sr-only">
        {backupAnnouncement(mode, scopeLabel)}
      </p>
      {BACKUP_SECTIONS.map((section, index) => {
        const props = { section, mode, scopeLabel, delay: 60 + index * 60 };
        switch (section.id) {
          case "backup-overview":
            return <div key={section.id} className="grid gap-6"><BackupOverviewPanel scopeLabel={scopeLabel} delay={props.delay} /><BackupSummaryDrilldowns /></div>;
          case "protected-assets":
            return <div key={section.id} className="grid gap-4"><ProtectedAssetsPanel {...props} /><BackupPreviewActions kind="assets" /></div>;
          case "backup-job-activity":
            return <div key={section.id} className="grid gap-4"><BackupJobActivityPanel {...props} /><BackupPreviewActions kind="jobs" /></div>;
          case "recovery-information":
            return <RecoveryInformationPanel {...props} key={section.id} />;
        }
      })}
    </div>
  );
}
