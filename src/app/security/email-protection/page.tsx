import type { Metadata } from "next";
import { SecurityCapabilityWorkspace } from "@/components/security/security-capability-workspace";

export const metadata: Metadata = { title: "Email Protection · Quantum Shield Command", description: "Safe fictional message classifications with explicit quarantine limitations." };
export default function EmailProtectionPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><SecurityCapabilityWorkspace capabilityId="email-protection" /></main>;
}
