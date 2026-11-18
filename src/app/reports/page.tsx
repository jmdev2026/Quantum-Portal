import type { Metadata } from "next";
import { ReportsWorkspace } from "@/components/reports/reports-workspace";

export const metadata: Metadata = { title: "Reports · Quantum Shield Command" };

export default function ReportsPage() {
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><ReportsWorkspace /></main>;
}
