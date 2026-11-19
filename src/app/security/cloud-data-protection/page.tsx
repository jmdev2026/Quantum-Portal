import type { Metadata } from "next";
import { SecurityCapabilityWorkspace } from "@/components/security/security-capability-workspace";

export const metadata: Metadata = { title: "Cloud Data Protection · Quantum Shield Command", description: "Fictional cloud service visibility, separate from endpoint backup and recovery." };
export default function CloudDataProtectionPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><SecurityCapabilityWorkspace capabilityId="cloud-data-protection" /></main>;
}
