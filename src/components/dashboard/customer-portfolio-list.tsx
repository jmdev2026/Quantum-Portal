import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleDashed, CircleOff, Clock, DatabaseBackup, ShieldCheck } from "lucide-react";
import type { CustomerPortfolioRecord, ReportingStatus } from "@/services/customer-overview";

const statusDisplay: Record<ReportingStatus, { label: string; icon: LucideIcon; tone: string }> = {
  available: { label: "Available", icon: CircleCheck, tone: "border-shield-500/30 bg-shield-500/10 text-shield-300" },
  stale: { label: "Stale", icon: Clock, tone: "border-amber-signal/30 bg-amber-signal/10 text-amber-signal" },
  unavailable: { label: "Unavailable", icon: CircleOff, tone: "border-ink-600 bg-ink-800 text-ink-300" },
  unknown: { label: "Unknown", icon: CircleDashed, tone: "border-ink-600 bg-ink-800 text-ink-300" },
};

const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

function ReportingBadge({ kind, status }: { kind: "security" | "backup"; status: ReportingStatus }) {
  const { label, icon: Icon, tone } = statusDisplay[status];
  const KindIcon = kind === "security" ? ShieldCheck : DatabaseBackup;
  return (
    <span
      data-reporting={kind}
      data-status={status}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${tone}`}
    >
      <KindIcon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="text-ink-100">{kind === "security" ? "Security" : "Backup"}</span>
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="font-medium">{label}</span>
    </span>
  );
}

function SyncTime({ value }: { value: string | null }) {
  return value ? (
    <time dateTime={value}>{formatTimestamp(value)}</time>
  ) : (
    <span>Not reported</span>
  );
}

export function CustomerPortfolioList({ customers, stale }: { customers: CustomerPortfolioRecord[]; stale: boolean }) {
  return (
    <ul aria-label="Customer reporting status" className="flex flex-col divide-y divide-ink-800 rounded-xl border border-ink-800 bg-ink-950/40">
      {customers.map((customer) => (
        <li
          key={customer.id}
          data-customer-id={customer.id}
          className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-ink-800/40 @2xl:grid @2xl:grid-cols-[minmax(0,1fr)_auto_auto_11rem] @2xl:items-center @2xl:gap-3"
        >
          <span className={`min-w-0 break-words text-sm font-medium ${stale ? "text-ink-300" : "text-ink-100"}`}>
            {customer.name}
          </span>
          <span className="flex flex-wrap gap-2 @2xl:contents">
            <ReportingBadge kind="security" status={customer.securityReporting} />
            <ReportingBadge kind="backup" status={customer.backupReporting} />
          </span>
          <span className="text-xs text-ink-300 @2xl:text-right">
            <span className="@2xl:sr-only">Last synced </span>
            <SyncTime value={customer.lastSyncedAt} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CustomerPortfolioDetail({ customer, stale }: { customer: CustomerPortfolioRecord; stale: boolean }) {
  return (
    <div data-customer-id={customer.id} className="rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-4">
      <p className={`break-words text-lg font-semibold leading-tight ${stale ? "text-ink-300" : "text-ink-100"}`}>
        {customer.name}
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-4 @lg:grid-cols-3">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Security reporting</dt>
          <dd className="mt-1.5">
            <ReportingBadge kind="security" status={customer.securityReporting} />
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Backup reporting</dt>
          <dd className="mt-1.5">
            <ReportingBadge kind="backup" status={customer.backupReporting} />
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Last synced</dt>
          <dd className="mt-1.5 text-sm text-ink-100">
            <SyncTime value={customer.lastSyncedAt} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
