import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CustomerViewProvider } from "@/components/customer-view/customer-view-provider";
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
        <CustomerViewProvider>
          <div className="flex min-h-screen flex-col lg:flex-row">
            <AppSidebar />
            <div className="min-w-0 flex-1">
              <AppHeader />
              {children}
            </div>
          </div>
        </CustomerViewProvider>
      </body>
    </html>
  );
}
