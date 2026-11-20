import type { Metadata } from "next";
import { BackupRecoveryWorkspace } from "@/components/backup/backup-recovery-workspace";

export const metadata: Metadata = { title: "Recovery Information · Quantum Shield Command" };

export default function BackupRecoveryPage() {
  return <BackupRecoveryWorkspace />;
}
