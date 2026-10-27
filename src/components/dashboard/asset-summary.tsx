import type { LucideIcon } from "lucide-react";
import { Cloud, Globe, Mail, MonitorSmartphone, Users } from "lucide-react";

const assets: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "devices", label: "Devices", icon: MonitorSmartphone },
  { id: "mailboxes", label: "Mailboxes", icon: Mail },
  { id: "cloud-drives", label: "Cloud Drives", icon: Cloud },
  { id: "internet-assets", label: "Internet Assets", icon: Globe },
];

export function AssetSummary() {
  return (
    <section aria-labelledby="assets-heading">
      <h2 id="assets-heading" className="mb-4 font-mono text-[11px] uppercase tracking-widest text-ink-400">
        Protected assets
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {assets.map(({ id, label, icon: Icon }) => (
          <li
            key={id}
            className="group flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-900/80 p-4 transition-colors duration-300 hover:border-shield-500/30"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400 transition-transform duration-300 group-hover:-translate-y-0.5">
              <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink-100">{label}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full border border-ink-400" />
                Awaiting integration
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
