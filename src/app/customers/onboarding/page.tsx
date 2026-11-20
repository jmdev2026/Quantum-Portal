import type { Metadata } from "next";
import { OnboardingPreview } from "@/components/customer-workflows/onboarding-preview";
export const metadata: Metadata = { title: "Onboarding Preview · Quantum Shield Command" };
export default function OnboardingPage() { return <OnboardingPreview />; }
