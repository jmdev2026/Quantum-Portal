import type { Metadata } from "next";
import { EducationWorkspace } from "@/components/security/education-workspace";

export const metadata: Metadata = { title: "Security Awareness Training · Quantum Shield Command", description: "Fictional training campaigns, assignment visibility, descriptive courses and nonpersistent configuration previews." };
export default function AwarenessTrainingPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><EducationWorkspace program="training" /></main>;
}
