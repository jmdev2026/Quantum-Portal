import type { Metadata } from "next";
import { ObservationExplorer } from "@/components/users-devices/observation-explorer";
export const metadata: Metadata = { title: "Device Observations · Quantum Shield Command" };
export default function DevicesPage() { return <ObservationExplorer kind="endpoints" />; }
