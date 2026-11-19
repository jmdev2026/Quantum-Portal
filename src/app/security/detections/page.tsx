import type { Metadata } from "next";
import { DetectionExplorer } from "@/components/security/detection-explorer";

export const metadata: Metadata = { title: "Detection Explorer · Quantum Shield Command" };

export default function DetectionsPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><DetectionExplorer /></main>;
}
