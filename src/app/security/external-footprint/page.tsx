import type { Metadata } from "next";
import { SecurityCapabilityWorkspace } from "@/components/security/security-capability-workspace";

export const metadata: Metadata = { title: "External Footprint Scanning · Quantum Shield Command", description: "Reserved-domain fictional asset and exposure review without real scanning." };
export default function ExternalFootprintPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><SecurityCapabilityWorkspace capabilityId="external-footprint" /></main>;
}
