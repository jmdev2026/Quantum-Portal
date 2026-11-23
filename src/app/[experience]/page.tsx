import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHARED_ROUTES } from "@/components/shared-experience/experience-model";
import { ApplicationWorkspace } from "@/components/shared-experience/application-workspace";
export function generateStaticParams() { return SHARED_ROUTES.map(experience => ({ experience })); }
export async function generateMetadata({ params }: { params: Promise<{ experience: string }> }): Promise<Metadata> { const { experience } = await params; return { title: `${experience} · Quantum Shield Command` }; }
export default async function ApplicationPage({ params }: { params: Promise<{ experience: string }> }) {
  const { experience } = await params; const allowed = SHARED_ROUTES.find(route => route === experience); if (!allowed) notFound();
  return <ApplicationWorkspace experience={allowed} />;
}
