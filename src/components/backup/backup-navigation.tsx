"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const backupAction = "inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-700 bg-ink-900 px-4 py-2 text-sm font-medium text-ink-100 hover:border-shield-400 hover:text-shield-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shield-400";

export function BackupNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Backup & Recovery navigation" className="flex flex-wrap gap-2">
    <Link href="/backup" aria-current={pathname === "/backup" ? "page" : undefined} className={backupAction}>Backup Overview</Link>
    <Link href="/backup/assets" aria-current={pathname === "/backup/assets" ? "page" : undefined} className={backupAction}>Protected Assets</Link>
    <Link href="/backup/jobs" aria-current={pathname === "/backup/jobs" ? "page" : undefined} className={backupAction}>Backup Jobs</Link>
    <Link href="/backup/recovery" aria-current={pathname === "/backup/recovery" ? "page" : undefined} className={backupAction}>Recovery Information</Link>
    <Link href="/reports" className={backupAction}>Existing Reports</Link>
    <Link href="/reports/backup" className={backupAction}>Open Backup Report</Link>
  </nav>;
}
