import type { Metadata } from "next";
import { BackupExplorer } from "@/components/backup/backup-explorer";

export const metadata: Metadata = { title: "Protected Assets · Quantum Shield Command" };

export default function BackupAssetsPage() {
  return <BackupExplorer kind="assets" />;
}
