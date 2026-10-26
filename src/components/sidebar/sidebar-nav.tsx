import Link from "next/link";
import { navSections, isNavItemActive, type NavItem } from "@/components/sidebar/navigation";

type SidebarNavProps = {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({ pathname, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-6">
      {navSections.map((section) => (
        <div key={section.id} role="group" aria-labelledby={`nav-section-${section.id}`}>
          <p
            id={`nav-section-${section.id}`}
            className={
              collapsed
                ? "sr-only"
                : "mb-2 px-3 font-mono text-[11px] uppercase tracking-widest text-ink-400"
            }
          >
            {section.label}
          </p>
          {collapsed && <div aria-hidden className="mx-auto mb-2 h-px w-6 bg-ink-700" />}
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <ActiveItem
                    item={item}
                    active={isNavItemActive(item, pathname)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <PlannedItem item={item} collapsed={collapsed} />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const rowBase =
  "group/item relative flex h-11 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-200";

function ActiveItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${rowBase} ${collapsed ? "justify-center px-0" : "px-3"} outline-none focus-visible:ring-2 focus-visible:ring-shield-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 ${
        active
          ? "bg-shield-500/10 text-shield-300"
          : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-shield-400 shadow-[0_0_12px_2px] shadow-shield-500/60"
        />
      )}
      <Icon
        aria-hidden
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-shield-400" : "text-ink-400 group-hover/item:text-ink-100"}`}
        strokeWidth={1.75}
      />
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
      {collapsed && <CollapsedTooltip label={item.label} />}
    </Link>
  );
}

function PlannedItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <div
      aria-disabled="true"
      title={collapsed ? undefined : `${item.label} is not yet implemented`}
      className={`${rowBase} ${collapsed ? "justify-center px-0" : "px-3"} cursor-not-allowed text-ink-400`}
    >
      <span className="relative">
        <Icon aria-hidden className="h-[18px] w-[18px] shrink-0 opacity-70" strokeWidth={1.75} />
        {collapsed && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-signal/80"
          />
        )}
      </span>
      <span className={collapsed ? "sr-only" : "flex-1 truncate"}>
        {item.label}
        <span className="sr-only"> (not yet implemented)</span>
      </span>
      {!collapsed && (
        <span
          aria-hidden
          className="rounded-md border border-ink-700 bg-ink-800/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-400"
        >
          Soon
        </span>
      )}
      {collapsed && <CollapsedTooltip label={item.label} note="Not yet implemented" />}
    </div>
  );
}

function CollapsedTooltip({ label, note }: { label: string; note?: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full z-50 ml-3 -translate-x-1 rounded-md border border-ink-700 bg-ink-800 px-2.5 py-1.5 whitespace-nowrap opacity-0 shadow-xl shadow-black/40 transition-all duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100"
    >
      <span className="block text-xs font-medium text-ink-100">{label}</span>
      {note && <span className="block font-mono text-[10px] uppercase tracking-wider text-amber-signal">{note}</span>}
    </span>
  );
}
