import type { Metadata } from "next";
import { ComplianceWorkspace } from "@/components/compliance/compliance-workspace";

export const metadata: Metadata = { title: "Compliance · Quantum Shield Command" };

export default function CompliancePage() {
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><ComplianceWorkspace /></main>;
}
