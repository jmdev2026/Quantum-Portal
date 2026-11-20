"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock,
  DatabaseBackup,
  Info,
  LoaderCircle,
  MonitorSmartphone,
  PlugZap,
  RotateCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { CustomerDirectory } from "@/components/customer-workflows/customer-directory";
import { ReportingBadge } from "@/components/dashboard/customer-portfolio-list";
import { useCustomerOverview } from "@/components/dashboard/use-customer-overview";
import {
  CUSTOMER_SCOPE_NOTICE,
  customersAnnouncement,
  customersPageView,
} from "@/components/customers/customers-view";
import type { CustomerPortfolioRecord } from "@/services/customer-overview";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-shield-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";
const secondaryAction = `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-800/60 px-3.5 py-2 text-sm font-medium text-ink-100 transition-colors duration-200 hover:border-shield-500/40 hover:text-shield-300 ${focusRing}`;
const primaryAction = `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-shield-500/40 bg-shield-500/10 px-3.5 py-2 text-sm font-medium text-shield-300 transition-colors duration-200 hover:bg-shield-500/20 ${focusRing}`;

export function CustomersPortfolio() {
  const { selectCustomer, selectAll } = useCustomerView();
  const { mode } = useDashboardMode();
  const { state, mode: layout, simulated, retry, contextKey } = useCustomerOverview();
  const view = customersPageView(state, layout);
  const contentRef = useRef<HTMLDivElement>(null);

  // The pressed control unmounts when the view changes, so keep keyboard focus inside the section.
  const keepFocus = (action: () => void) => () => {
    contentRef.current?.focus();
    action();
  };

  const title = layout === "customer" ? "Customer Details" : "Customer Portfolio";
  const description =
    layout === "customer"
      ? "Reporting availability and customer-specific destinations for the selected customer."
      : "Customers in the current view and whether reporting data is available for each.";

  return (
    <div className="grid gap-6">
      <section
        aria-labelledby="customers-portfolio-title"
        data-customers-section={layout === "customer" ? "detail" : "portfolio"}
        data-mode={mode}
        className="@container flex min-w-0 motion-safe:animate-slide-up flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 sm:p-6"
        style={{ animationDelay: "60ms" }}
      >
        <header className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-shield-400">
            <Building2 aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id="customers-portfolio-title" className="text-base font-semibold leading-tight text-ink-100">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-350">{description}</p>
          </div>
        </header>

        <p role="status" className="sr-only">
          {customersAnnouncement(view, mode)}
        </p>

        <div
          ref={contentRef}
          tabIndex={-1}
          data-state={state.kind}
          data-view={view.kind}
          aria-busy={view.kind === "loading"}
          className="mt-5 flex flex-col gap-4 outline-none"
        >
          {view.kind === "loading" && <LoadingRows detail={layout === "customer"} />}
          {view.kind === "unavailable" && (
            <StateMessage icon={PlugZap} tone="text-amber-signal" title="Customer reporting integrations are not connected">
              Customer records and reporting availability will appear here once Quantum Shield is connected to its
              reporting service. Nothing is shown until then.
            </StateMessage>
          )}
          {view.kind === "empty" && (
            <StateMessage icon={Info} tone="text-ink-100" title="No customer reporting data yet">
              No customers have reported data for this view yet.
            </StateMessage>
          )}
          {view.kind === "error" && (
            <StateMessage icon={AlertTriangle} tone="text-red-300" title="Could not load customers" role="alert">
              <p>{view.message}</p>
              <button type="button" onClick={keepFocus(retry)} className={`mt-3 ${secondaryAction}`}>
                <RotateCw aria-hidden className="h-4 w-4" strokeWidth={2} />
                Retry
              </button>
            </StateMessage>
          )}
          {(view.kind === "portfolio" || view.kind === "detail") && view.stale && (
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-signal">
              <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Stale data. Reporting availability may be out of date.
            </p>
          )}
          {view.kind === "portfolio" && (
            <CustomerDirectory key={contextKey} records={view.customers}>
              {records => <PortfolioGrid customers={records} stale={view.stale} simulated={simulated} onView={(id) => keepFocus(() => selectCustomer(id))()} />}
            </CustomerDirectory>
          )}
          {view.kind === "detail" && (
            <CustomerDetail customer={view.customer} stale={view.stale} simulated={simulated} onBack={keepFocus(selectAll)} />
          )}
        </div>
      </section>

      <aside
        aria-labelledby="customers-scope-title"
        data-scope-notice
        className="flex items-start gap-3 rounded-2xl border border-ink-800 bg-ink-950/40 px-5 py-4"
      >
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" strokeWidth={2} />
        <div className="min-w-0">
          <h2 id="customers-scope-title" className="text-sm font-semibold text-ink-100">
            About customer scope
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-300">{CUSTOMER_SCOPE_NOTICE}</p>
        </div>
      </aside>
    </div>
  );
}

function PortfolioGrid({
  customers,
  stale,
  simulated,
  onView,
}: {
  customers: CustomerPortfolioRecord[];
  stale: boolean;
  simulated: boolean;
  onView: (customerId: number) => void;
}) {
  return (
    <ul aria-label="Customer portfolio" className="grid grid-cols-1 gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
      {customers.map((customer) => (
        <li
          key={customer.id}
          data-customer-id={customer.id}
          className="flex min-w-0 flex-col gap-4 rounded-xl border border-ink-800 bg-ink-950/40 p-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-ink-300">
              <UserRound aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 className={`break-words text-sm font-semibold leading-tight ${stale ? "text-ink-300" : "text-ink-100"}`}>
                {customer.name}
              </h3>
              {simulated && <DemoTag />}
            </div>
          </div>
          <ReportingList customer={customer} simulated={simulated} />
          <button
            type="button"
            onClick={() => onView(customer.id)}
            aria-label={`View customer ${customer.name}`}
            className={`mt-auto w-full ${secondaryAction}`}
          >
            View customer
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function CustomerDetail({
  customer,
  stale,
  simulated,
  onBack,
}: {
  customer: CustomerPortfolioRecord;
  stale: boolean;
  simulated: boolean;
  onBack: () => void;
}) {
  return (
    <article data-customer-id={customer.id} aria-labelledby="customer-detail-name" className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-xl border border-ink-800 bg-ink-950/40 p-4 sm:p-5 @2xl:flex-row @2xl:items-start @2xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-shield-500/30 bg-shield-500/10 text-shield-400">
            <UserRound aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3
              id="customer-detail-name"
              className={`break-words text-lg font-semibold leading-tight ${stale ? "text-ink-300" : "text-ink-100"}`}
            >
              {customer.name}
            </h3>
            {simulated && <DemoTag />}
            <p data-detail-scope className="mt-2 text-xs text-ink-350">
              <span className="text-ink-300">Scope: </span>
              <span className="font-medium text-shield-300">{customer.name} only</span>
            </p>
          </div>
        </div>
        <button type="button" onClick={onBack} className={`self-start ${secondaryAction}`}>
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={2} />
          Back to all customers
        </button>
      </div>

      <Link href={`/customers/${customer.id}`} className={`self-start ${primaryAction}`}>Open full customer profile<ArrowRight aria-hidden className="h-4 w-4" /></Link>

      <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        <DestinationCard
          icon={ShieldCheck}
          title="Security reporting"
          badge={<ReportingBadge kind="security" status={customer.securityReporting} simulated={simulated} />}
          body="Detections, identities, endpoints and controls for this customer are on the Security page."
          href="/security"
          action="View Security"
        />
        <DestinationCard
          icon={DatabaseBackup}
          title="Backup reporting"
          badge={<ReportingBadge kind="backup" status={customer.backupReporting} simulated={simulated} />}
          body="Backup overview, protected assets, job activity and recovery information for this customer are on the Backup & Recovery page."
          href="/backup"
          action="View Backup & Recovery"
        />
        <DestinationCard
          icon={MonitorSmartphone}
          title="Users & devices"
          body="User and device summaries with example account and endpoint observations for this customer are on the Users & Devices page."
          href="/users-devices"
          action="View Users & Devices"
        />
      </div>

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-300">
        <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        Reporting availability shows whether data is present for an area. It does not indicate whether this customer is
        secure, monitored or backed up.
      </p>
    </article>
  );
}

function DestinationCard({
  icon: Icon,
  title,
  badge,
  body,
  href,
  action,
}: {
  icon: LucideIcon;
  title: string;
  badge?: ReactNode;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-ink-800 bg-ink-950/40 p-4">
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="h-4 w-4 shrink-0 text-shield-400" strokeWidth={1.75} />
        <h4 className="text-sm font-semibold text-ink-100">{title}</h4>
      </div>
      {badge && <div>{badge}</div>}
      <p className="text-sm leading-relaxed text-ink-300">{body}</p>
      <Link href={href} className={`mt-auto self-start ${primaryAction}`}>
        {action}
        <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
      </Link>
    </div>
  );
}

function ReportingList({ customer, simulated }: { customer: CustomerPortfolioRecord; simulated: boolean }) {
  return (
    <dl className="grid grid-cols-1 gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Security reporting</dt>
        <dd>
          <ReportingBadge kind="security" status={customer.securityReporting} simulated={simulated} />
        </dd>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-300">Backup reporting</dt>
        <dd>
          <ReportingBadge kind="backup" status={customer.backupReporting} simulated={simulated} />
        </dd>
      </div>
    </dl>
  );
}

function DemoTag() {
  return (
    <p data-demo-record className="mt-1 text-xs text-amber-signal">
      Fictional demonstration customer
    </p>
  );
}

function LoadingRows({ detail }: { detail: boolean }) {
  return (
    <div aria-hidden className={`grid grid-cols-1 gap-4 ${detail ? "@2xl:grid-cols-2" : "@3xl:grid-cols-2 @5xl:grid-cols-3"}`}>
      {(detail ? [0, 1] : [0, 1, 2]).map((row) => (
        <div key={row} className="flex flex-col gap-3 rounded-xl border border-ink-800 bg-ink-950/40 p-4">
          <span className="h-4 w-40 max-w-full motion-safe:animate-pulse rounded bg-ink-700" />
          <span className="h-6 w-36 motion-safe:animate-pulse rounded-full bg-ink-800" />
          <span className="h-6 w-36 motion-safe:animate-pulse rounded-full bg-ink-800" />
          <span className="inline-flex items-center gap-2 text-xs text-ink-350">
            <LoaderCircle className="h-3.5 w-3.5 motion-safe:animate-spin" strokeWidth={2} />
          </span>
        </div>
      ))}
    </div>
  );
}

function StateMessage({
  icon: Icon,
  tone,
  title,
  role,
  children,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  role?: "alert";
  children: ReactNode;
}) {
  return (
    <div
      role={role}
      data-state-message
      className="rounded-xl border border-dashed border-ink-700 bg-ink-950/40 px-4 py-3.5 text-sm leading-relaxed text-ink-300"
    >
      <p className={`flex items-center gap-2 font-medium ${tone}`}>
        <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
        {title}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
