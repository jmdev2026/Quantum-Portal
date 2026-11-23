import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GovernanceWorkspace, type GovernanceSection } from "@/components/governance/governance-workspace";
const sections = ["framework", "controls", "assessments", "evidence"];
export function generateStaticParams() { return sections.map(section => ({ section })); }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> { const { section } = await params; return { title: `Compliance · ${section} · Quantum Shield Command` }; }
export default async function ComplianceSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params; if (!sections.includes(section)) notFound();
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><Suspense fallback={<p role="status">Loading compliance workspace…</p>}><GovernanceWorkspace module="compliance" section={section as GovernanceSection} /></Suspense></main>;
}
