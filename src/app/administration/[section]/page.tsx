import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GovernanceWorkspace, type GovernanceSection } from "@/components/governance/governance-workspace";
const sections = ["access", "integrations", "audit", "settings"];
export function generateStaticParams() { return sections.map(section => ({ section })); }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> { const { section } = await params; return { title: `Administration · ${section} · Quantum Shield Command` }; }
export default async function AdministrationSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params; if (!sections.includes(section)) notFound();
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><Suspense fallback={<p role="status">Loading administration workspace…</p>}><GovernanceWorkspace module="administration" section={section as GovernanceSection} /></Suspense></main>;
}
