import Link from "next/link";
import type { Metadata } from "next";
import { InsightsPanel } from "@/components/dashboard/insights-panel";

export const metadata: Metadata = { title: "Security Insights · Quantum Shield Command" };

export default function InsightsPage() {
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><Link href="/security" className="self-start rounded-lg px-3 py-2 text-sm text-shield-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400">Back to Security</Link><h1 className="text-3xl font-semibold text-ink-100">Security Insights</h1><p className="text-sm leading-relaxed text-ink-300">Validated read-only insights for the shared display scope. Demo information is fictional; Live reporting remains unavailable.</p><InsightsPanel showNavigation={false} /></main>;
}
