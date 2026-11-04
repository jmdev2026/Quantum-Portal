"use client";

import { createContext, useContext, useMemo, useState } from "react";

// "demo" shows fictional frontend fixtures only. Never persisted, so every page load starts in "live".
export type DashboardMode = "live" | "demo";

type DashboardModeContextValue = { mode: DashboardMode; setMode: (mode: DashboardMode) => void };

const DashboardModeContext = createContext<DashboardModeContextValue | null>(null);

export function DashboardModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DashboardMode>("live");
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <DashboardModeContext.Provider value={value}>{children}</DashboardModeContext.Provider>;
}

export function useDashboardMode() {
  const context = useContext(DashboardModeContext);
  if (!context) throw new Error("useDashboardMode must be used inside DashboardModeProvider");
  return context;
}
