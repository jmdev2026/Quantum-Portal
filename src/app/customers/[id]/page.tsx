import type { Metadata } from "next";
import { CustomerProfile } from "@/components/customer-workflows/customer-profile";
export const metadata: Metadata = { title: "Customer Profile · Quantum Shield Command" };
export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  return <CustomerProfile profileId={profileId} />;
}
