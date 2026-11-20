import type { Metadata } from "next";
import { DarkWebWorkspace } from "@/components/security/dark-web-workspace";

export const metadata: Metadata = { title: "Dark Web Monitoring · Quantum Shield Command", description: "Fictional exposure, affected-account and reserved-domain investigation previews. Live monitoring remains unavailable." };
export default function DarkWebPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><DarkWebWorkspace /></main>;
}
