"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Layers, Loader2, RotateCw, TriangleAlert } from "lucide-react";
import type { Customer } from "@/services/customers";
import type { CustomersState } from "@/components/customer-view/use-customers";
import { useCustomerView } from "@/components/customer-view/customer-view-provider";

const segmentBase =
  "inline-flex h-8 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-shield-500/70";
const segmentActive = "bg-shield-500/15 text-shield-300 ring-1 ring-inset ring-shield-500/30";
const segmentIdle = "text-ink-300 hover:bg-ink-800 hover:text-ink-100";

export function CustomerSelector() {
  const {
    view,
    selectedCustomer: selected,
    notice,
    customersState: state,
    reloadCustomers: reload,
    selectAll,
    selectCustomer,
  } = useCustomerView();
  const selectedId = view.mode === "customer" ? view.customerId : null;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const panelId = `${baseId}-panel`;

  const customers = state.status === "ready" ? state.customers : [];

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (open && state.status === "ready" && state.customers.length > 0) listRef.current?.focus();
  }, [open, state]);

  const showAll = () => {
    selectAll();
    close(false);
  };

  const toggleMenu = () => {
    if (open) {
      close(false);
      return;
    }
    const index = customers.findIndex((customer) => customer.id === selectedId);
    setActiveIndex(index >= 0 ? index : 0);
    setOpen(true);
  };

  const choose = (customer: Customer | undefined) => {
    if (customer) selectCustomer(customer.id);
    close(true);
  };

  const onRootKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const last = customers.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i >= last ? 0 : i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? last : i - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(customers[activeIndex]);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  const announcement = notice ?? (selected ? `Viewing ${selected.name} (demo)` : "Viewing all customers");

  return (
    <div ref={rootRef} onKeyDown={onRootKeyDown} className="relative w-full lg:w-auto">
      <div
        role="group"
        aria-label="Customer view (demonstration)"
        className="flex w-full items-center gap-1 rounded-lg border border-ink-700 bg-ink-950/60 p-1 lg:w-auto"
      >
        <button
          type="button"
          onClick={showAll}
          aria-pressed={selectedId === null}
          className={`${segmentBase} flex-1 lg:flex-none ${selectedId === null ? segmentActive : segmentIdle}`}
        >
          <Layers aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate">All customers</span>
        </button>

        <button
          ref={triggerRef}
          type="button"
          onClick={toggleMenu}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={panelId}
          className={`${segmentBase} flex-1 lg:flex-none ${selected ? segmentActive : segmentIdle} ${open && !selected ? "bg-ink-800 text-ink-100" : ""}`}
        >
          <Building2 aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate lg:max-w-[10rem]">
            {selected ? (
              <>
                <span className="sr-only">Single customer: </span>
                {selected.name}
              </>
            ) : (
              "Single customer"
            )}
          </span>
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            strokeWidth={1.75}
          />
        </button>

        <span
          title="Frontend demonstration only"
          className="hidden shrink-0 rounded-md border border-amber-signal/30 bg-amber-signal/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal sm:inline-block"
        >
          Demo
        </span>
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-30 mt-2 origin-top animate-rise overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl shadow-black/60 [animation-duration:200ms] lg:left-auto lg:w-80"
      >
        <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
          <p id={`${baseId}-label`} className="text-sm font-semibold text-ink-100">
            Select a customer
          </p>
          <span className="rounded-md border border-amber-signal/30 bg-amber-signal/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-signal">
            Demo data
          </span>
        </div>

        {notice && (
          <p className="flex items-start gap-2 border-b border-ink-800 bg-amber-signal/5 px-4 py-2.5 text-xs leading-relaxed text-amber-signal">
            <TriangleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {notice}
          </p>
        )}

        <PanelBody
          state={state}
          reload={reload}
          listRef={listRef}
          baseId={baseId}
          activeIndex={activeIndex}
          selectedId={selectedId}
          onHover={setActiveIndex}
          onChoose={choose}
          onListKeyDown={onListKeyDown}
        />

        <p className="border-t border-ink-800 bg-ink-950/50 px-4 py-3 text-xs leading-relaxed text-ink-400">
          Frontend demonstration only. Choosing a customer does not filter data or control access.
        </p>
      </div>
    </div>
  );
}

type PanelBodyProps = {
  state: CustomersState;
  reload: () => Promise<void>;
  listRef: React.RefObject<HTMLUListElement | null>;
  baseId: string;
  activeIndex: number;
  selectedId: number | null;
  onHover: (index: number) => void;
  onChoose: (customer: Customer) => void;
  onListKeyDown: (event: React.KeyboardEvent<HTMLUListElement>) => void;
};

function PanelBody({
  state,
  reload,
  listRef,
  baseId,
  activeIndex,
  selectedId,
  onHover,
  onChoose,
  onListKeyDown,
}: PanelBodyProps) {
  if (state.status === "loading") {
    return (
      <p className="flex items-center gap-2 px-4 py-6 text-sm text-ink-300">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-shield-400" strokeWidth={2} />
        Loading customers...
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div className="px-4 py-5">
        <p className="flex items-center gap-2 text-sm text-ink-100">
          <TriangleAlert aria-hidden className="h-4 w-4 text-amber-signal" strokeWidth={2} />
          {state.message}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 px-3 text-sm font-medium text-ink-100 outline-none transition-colors hover:border-shield-500/40 focus-visible:ring-2 focus-visible:ring-shield-500/70"
        >
          <RotateCw aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          Try again
        </button>
      </div>
    );
  }

  if (state.customers.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Building2 aria-hidden className="mx-auto h-6 w-6 text-ink-400" strokeWidth={1.5} />
        <p className="mt-2 text-sm font-medium text-ink-100">No customers available</p>
        <p className="mt-1 text-xs text-ink-400">Customers will appear here once they are added.</p>
      </div>
    );
  }

  const activeCustomer = state.customers[activeIndex];

  return (
    <ul
      ref={listRef}
      role="listbox"
      tabIndex={0}
      aria-labelledby={`${baseId}-label`}
      aria-activedescendant={activeCustomer ? `${baseId}-option-${activeCustomer.id}` : undefined}
      onKeyDown={onListKeyDown}
      className="max-h-64 overflow-y-auto p-2 outline-none"
    >
      {state.customers.map((customer, index) => {
        const isSelected = customer.id === selectedId;
        const isActive = index === activeIndex;
        return (
          <li
            key={customer.id}
            id={`${baseId}-option-${customer.id}`}
            role="option"
            aria-selected={isSelected}
            onPointerEnter={() => onHover(index)}
            onClick={() => onChoose(customer)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              isActive ? "bg-ink-800" : ""
            } ${isActive ? "ring-1 ring-inset ring-shield-500/40" : ""}`}
          >
            <span
              aria-hidden
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-xs ${
                isSelected
                  ? "border-shield-500/40 bg-shield-500/15 text-shield-300"
                  : "border-ink-700 bg-ink-800 text-ink-300"
              }`}
            >
              {customer.name.slice(-1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm font-medium ${isSelected ? "text-shield-300" : "text-ink-100"}`}>
                {customer.name}
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-400">
                {customer.is_demo ? "Demo record" : customer.status}
              </span>
            </span>
            {isSelected && <Check aria-hidden className="h-4 w-4 shrink-0 text-shield-400" strokeWidth={2} />}
          </li>
        );
      })}
    </ul>
  );
}
