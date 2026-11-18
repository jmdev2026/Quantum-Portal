import type { Metadata } from "next";
import { AdministrationWorkspace } from "@/components/administration/administration-workspace";

export const metadata: Metadata = { title: "Administration · Quantum Shield Command" };

export default function AdministrationPage() {
  return <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><AdministrationWorkspace /></main>;
}
