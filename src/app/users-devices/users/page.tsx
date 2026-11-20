import type { Metadata } from "next";
import { ObservationExplorer } from "@/components/users-devices/observation-explorer";
export const metadata: Metadata = { title: "User Observations · Quantum Shield Command" };
export default function UsersPage() { return <ObservationExplorer kind="identities" />; }
