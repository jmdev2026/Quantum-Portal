import type { Metadata } from "next";
import { EducationWorkspace } from "@/components/security/education-workspace";

export const metadata: Metadata = { title: "Phishing Simulations · Quantum Shield Command", description: "Inert educational scenarios, fictional campaign outcomes, explicit result definitions and non-sendable configuration previews." };
export default function PhishingSimulationsPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><EducationWorkspace program="simulation" /></main>;
}
