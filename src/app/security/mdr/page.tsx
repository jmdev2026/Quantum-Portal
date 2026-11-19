import type { Metadata } from "next";
import { SecurityCapabilityWorkspace } from "@/components/security/security-capability-workspace";

export const metadata: Metadata = { title: "Managed Detection & Response · Quantum Shield Command", description: "Read-only fictional MDR investigation workspace and response limitations." };
export default function MdrPage() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><SecurityCapabilityWorkspace capabilityId="mdr" /></main>;
}
