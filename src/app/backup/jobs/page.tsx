import type { Metadata } from "next";
import { BackupExplorer } from "@/components/backup/backup-explorer";

export const metadata: Metadata = { title: "Backup Jobs · Quantum Shield Command" };

export default async function BackupJobsPage({ searchParams }: { searchParams: Promise<{ outcome?: string | string[] }> }) {
  const { outcome } = await searchParams;
  return <BackupExplorer key={typeof outcome === "string" ? outcome : "all"} kind="jobs" initialOutcome={typeof outcome === "string" ? outcome : "all"} />;
}
