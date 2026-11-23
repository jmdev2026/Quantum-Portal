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
      { id: "security", label: "Security", icon: ShieldCheck, href: "/security" },
      { id: "backup", label: "Backup & Recovery", icon: DatabaseBackup, href: "/backup" },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "users-devices", label: "Users & Devices", icon: MonitorSmartphone, href: "/users-devices" },
      { id: "customers", label: "Customers", icon: Building2, href: "/customers" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { id: "reports", label: "Reports", icon: BarChart3, href: "/reports" },
      { id: "compliance", label: "Compliance", icon: ClipboardCheck, href: "/compliance" },
      { id: "administration", label: "Administration", icon: Settings2, href: "/administration" },
    ],
  },
];

export function isNavItemActive(item: NavItem, pathname: string) {
  if (!item.href) return false;
  if (item.href === "/reports") return pathname === "/reports" || ["executive", "cybersecurity", "backup", "dark-web", "awareness-training", "phishing-simulations"].some(report => pathname === `/reports/${report}`);
  if (item.href === "/compliance") return pathname === item.href || ["framework", "controls", "assessments", "evidence"].some(section => pathname === `/compliance/${section}`);
  if (item.href === "/administration") return pathname === item.href || ["access", "integrations", "audit", "settings"].some(section => pathname === `/administration/${section}`);
  if (item.href === "/") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findActiveNavItem(pathname: string): NavItem | undefined {
  const shared = [{ id: "account", label: "Account", href: "/account", icon: Settings2 }, { id: "notifications", label: "Notifications", href: "/notifications", icon: ClipboardCheck }, { id: "help", label: "Help & Support", href: "/help", icon: ShieldCheck }, { id: "sign-in", label: "Authentication Design", href: "/sign-in", icon: ShieldCheck }, { id: "access-denied", label: "Access State Preview", href: "/access-denied", icon: ShieldCheck }];
  return navSections.flatMap((section) => section.items).find((item) => isNavItemActive(item, pathname)) ?? shared.find(item => item.href === pathname);
}
