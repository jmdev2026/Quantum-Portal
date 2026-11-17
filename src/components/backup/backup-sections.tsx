"use client";

import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { BackupJobActivityPanel } from "@/components/backup/backup-job-activity-panel";
import { BackupOverviewPanel } from "@/components/backup/backup-overview-panel";
import { ProtectedAssetsPanel } from "@/components/backup/protected-assets-panel";
import { RecoveryInformationPanel } from "@/components/backup/recovery-information-panel";
import { BACKUP_SECTIONS, backupAnnouncement } from "@/components/backup/backup-view";
import { securityScopeLabel } from "@/components/security/security-overview-view";

export function BackupSections() {
  const { view, selectedCustomer } = useCustomerView();
  const { mode } = useDashboardMode();
  const scopeLabel = securityScopeLabel(view.mode, selectedCustomer?.name);

  return (
    <div className="grid gap-6" data-mode={mode}>
      <p role="status" className="sr-only">
        {backupAnnouncement(mode, scopeLabel)}
      </p>
      {BACKUP_SECTIONS.map((section, index) => {
        const props = { section, mode, scopeLabel, delay: 60 + index * 60 };
        switch (section.id) {
          case "backup-overview":
            return <BackupOverviewPanel key={section.id} scopeLabel={scopeLabel} delay={props.delay} />;
          case "protected-assets":
            return <ProtectedAssetsPanel {...props} key={section.id} />;
          case "backup-job-activity":
            return <BackupJobActivityPanel {...props} key={section.id} />;
          case "recovery-information":
            return <RecoveryInformationPanel {...props} key={section.id} />;
        }
      })}
    </div>
  );
}
