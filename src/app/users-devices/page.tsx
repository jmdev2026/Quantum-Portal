import type { Metadata } from "next";
import { WorkflowNavigation } from "@/components/customer-workflows/workflow-ui";
import { UsersDevicesIntro } from "@/components/users-devices/users-devices-intro";
import { UsersDevicesSections } from "@/components/users-devices/users-devices-sections";

export const metadata: Metadata = {
  title: "Users & Devices · Quantum Shield Command",
};

export default function UsersDevicesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1c212355_1px,transparent_1px),linear-gradient(to_bottom,#1c212355_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-12rem] left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-shield-500/10 blur-[120px]"
      />

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <UsersDevicesIntro />
        <WorkflowNavigation area="inventory" />
        <UsersDevicesSections />
      </main>

      <footer className="relative z-10 border-t border-ink-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-ink-350 sm:flex-row sm:px-6 lg:px-8">
          <span>Quantum Shield Command</span>
          <span className="font-mono">No live data &middot; integrations pending</span>
        </div>
      </footer>
    </div>
  );
}
