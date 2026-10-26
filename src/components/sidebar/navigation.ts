import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  DatabaseBackup,
  LayoutDashboard,
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

// Items without an href are rendered as "planned" and are not navigable.
export const navSections: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" }],
  },
  {
    id: "protection",
    label: "Protection",
    items: [
      { id: "security", label: "Security", icon: ShieldCheck },
      { id: "backup", label: "Backup & Recovery", icon: DatabaseBackup },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "users-devices", label: "Users & Devices", icon: MonitorSmartphone },
      { id: "customers", label: "Customers", icon: Building2 },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { id: "reports", label: "Reports", icon: BarChart3 },
      { id: "compliance", label: "Compliance", icon: ClipboardCheck },
      { id: "administration", label: "Administration", icon: Settings2 },
    ],
  },
];

export function isNavItemActive(item: NavItem, pathname: string) {
  if (!item.href) return false;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
