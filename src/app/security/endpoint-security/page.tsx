import type { Metadata } from "next";
import { SecurityCapabilityWorkspace } from "@/components/security/security-capability-workspace";

export const metadata: Metadata = { title: "Endpoint Security · Quantum Shield Command", description: "Canonical fictional endpoint observations, not a managed device inventory." };
export default function EndpointSecurityPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><SecurityCapabilityWorkspace capabilityId="endpoint-security" /></main>;
}
