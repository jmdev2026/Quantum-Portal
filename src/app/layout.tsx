import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CustomerViewProvider } from "@/components/customer-view/customer-view-provider";
import { DashboardModeProvider } from "@/components/dashboard-mode/dashboard-mode-provider";
import { AppHeader } from "@/components/header/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quantum Shield Command",
  description: "Unified Cybersecurity & Backup Management",
};

export const viewport: Viewport = {
  themeColor: "#07090a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans">
        <DashboardModeProvider>
          <CustomerViewProvider>
            <a href="#portal-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink-950 focus:p-4 focus:text-shield-300">Skip to workspace</a>
            <div className="flex min-h-screen flex-col lg:flex-row">
              <AppSidebar />
              <div className="min-w-0 flex-1">
                <AppHeader />
                <div id="portal-content" tabIndex={-1} className="min-w-0">{children}</div>
              </div>
            </div>
          </CustomerViewProvider>
        </DashboardModeProvider>
      </body>
    </html>
  );
}
