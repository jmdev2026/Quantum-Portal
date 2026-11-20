import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportCenter } from "@/components/reports/report-center";
import { reportDefinition, REPORTS } from "@/components/reports/report-model";

export function generateStaticParams() { return REPORTS.map(report => ({ report: report.id })); }
export async function generateMetadata({ params }: { params: Promise<{ report: string }> }): Promise<Metadata> {
  const { report } = await params;
  return { title: `${reportDefinition(report)?.title ?? "Report unavailable"} · Quantum Shield Command` };
}
export default async function ReportPage({ params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  const definition = reportDefinition(report);
  if (!definition) notFound();
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><ReportCenter id={definition.id} /></main>;
}
