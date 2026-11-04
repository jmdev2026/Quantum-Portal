"use client";

import { FlaskConical, PlugZap } from "lucide-react";
import { useDashboardMode, type DashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";

const segmentBase =
  "inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-shield-500/70 sm:flex-none";
const segmentIdle = "text-ink-300 hover:bg-ink-800 hover:text-ink-100";
const activeTone: Record<DashboardMode, string> = {
  live: "bg-shield-500/15 text-shield-300 ring-1 ring-inset ring-shield-500/30",
  demo: "bg-amber-signal/15 text-amber-signal ring-1 ring-inset ring-amber-signal/40",
};

export const DEMO_MODE_NOTICE =
  "All displayed demonstration statistics are fictional and do not represent actual customer security or backup activity.";

export function DashboardModeSwitch() {
  const { mode, setMode } = useDashboardMode();
  const options = [
    { value: "live", label: "Live / Not Connected", icon: PlugZap },
    { value: "demo", label: "Demo Mode", icon: FlaskConical },
  ] as const;

  return (
    <div className="w-full sm:w-auto">
      <div
        role="group"
        aria-label="Dashboard data mode"
        className="flex w-full items-center gap-1 rounded-lg border border-ink-700 bg-ink-950/60 p-1 sm:w-auto"
      >
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`${segmentBase} ${mode === value ? activeTone[value] : segmentIdle}`}
          >
            <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
      <p role="status" className="sr-only">
        {mode === "demo"
          ? `Demo Mode on. Simulated data. ${DEMO_MODE_NOTICE}`
          : "Live mode. Provider integrations are not connected, so no statistics are shown."}
      </p>
    </div>
  );
}

export function DemoModeNotice() {
  const { mode } = useDashboardMode();
  if (mode !== "demo") return null;
  return (
    <div
      data-demo-notice
      className="flex items-start gap-3 rounded-xl border border-amber-signal/40 bg-amber-signal/10 px-4 py-3"
    >
      <FlaskConical aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-signal" strokeWidth={2} />
      <p className="text-sm leading-relaxed text-ink-100">
        <strong className="font-semibold tracking-wide text-amber-signal">DEMO MODE — SIMULATED DATA.</strong>{" "}
        {DEMO_MODE_NOTICE}
      </p>
    </div>
  );
}
