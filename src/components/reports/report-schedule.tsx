"use client";

import { useRef, useState } from "react";
import { defaultSchedule, validateSchedule, scheduleDescription, SCHEDULE_DISCLOSURE, ZONES, reportDefinition, type ReportConfig } from "@/components/reports/report-model";
export const reportControl = "min-h-11 w-full rounded-lg border border-ink-600 bg-ink-950 p-3 text-ink-100 focus-visible:outline-2 focus-visible:outline-shield-400";
export const reportAction = "min-h-11 rounded-lg border border-ink-600 px-4 py-3 text-sm font-medium text-ink-100 hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-shield-400";

export function ReportSchedule({ config, scopeLabel }: { config: ReportConfig; scopeLabel: string }) {
  const [draft, setDraft] = useState(defaultSchedule);
  const [review, setReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const errors = useRef<HTMLParagraphElement>(null);
  function reset() { setDraft(defaultSchedule()); setReview(false); setError(null); heading.current?.focus(); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = validateSchedule(draft);
    setError(message);
    if (message) requestAnimationFrame(() => errors.current?.focus());
    else { setReview(true); requestAnimationFrame(() => heading.current?.focus()); }
  }
  const days = draft.frequency === "Weekly" ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] : Array.from({ length: 28 }, (_, index) => String(index + 1));
  return <section className="space-y-4 rounded-xl border border-ink-700 p-4 sm:p-6" aria-labelledby="schedule-heading">
    <h3 id="schedule-heading" ref={heading} tabIndex={-1} className="text-xl font-semibold">Scheduling configuration preview</h3>
    <p className="text-sm leading-relaxed">{SCHEDULE_DISCLOSURE}</p>
    <p className="break-words text-sm">Report: {config.title} · Scope: {scopeLabel} · {config.sections.length} configured sections · {config.detail} presentation · examples {config.examples ? "included" : "excluded"}.</p>
    <p className="text-sm leading-relaxed">Selected sections: {reportDefinition(config.report)!.sections.filter((_, index) => config.sections.includes(index)).join(" · ")}. Illustrative record sections are omitted when examples are excluded.</p>
    {error && <p role="alert" tabIndex={-1} ref={errors} className="text-amber-300">{error}</p>}
    {review ? <div className="space-y-4"><p role="status">{scheduleDescription(draft)}</p><p className="break-words text-sm">Fictional recipient preview: {draft.recipients}</p><div className="flex flex-wrap gap-2"><button type="button" className={reportAction} onClick={() => { setReview(false); heading.current?.focus(); }}>Edit Schedule Preview</button><button type="button" className={reportAction} onClick={reset}>Cancel / Reset Schedule</button></div></div> : <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm">Frequency<select className={reportControl} value={draft.frequency} onChange={event => setDraft({ ...draft, frequency: event.target.value, day: event.target.value === "Weekly" ? "Monday" : "1" })}>{["Weekly", "Monthly", "Quarterly"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="space-y-2 text-sm">{draft.frequency === "Weekly" ? "Weekday" : "Day of month (1–28)"}<select className={reportControl} value={draft.day} onChange={event => setDraft({ ...draft, day: event.target.value })}>{days.map(day => <option key={day}>{day}</option>)}</select></label>
      <label className="space-y-2 text-sm">Local time<input type="time" required className={reportControl} value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} /></label>
      <label className="space-y-2 text-sm">Time zone<select className={reportControl} value={draft.zone} onChange={event => setDraft({ ...draft, zone: event.target.value })}>{ZONES.map(zone => <option key={zone}>{zone}</option>)}</select></label>
      <label className="space-y-2 text-sm sm:col-span-2">Reserved Demo recipients (comma-separated)<input required maxLength={400} className={reportControl} value={draft.recipients} onChange={event => setDraft({ ...draft, recipients: event.target.value })} /><span className="block text-ink-300">Example: reports@demo.example.com. No real personal addresses.</span></label>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button className={reportAction}>Preview Schedule</button><button type="button" className={reportAction} onClick={reset}>Cancel / Reset Schedule</button></div>
    </form>}
    <p className="text-sm leading-relaxed text-ink-300">Real scheduling requires authorized persistence, recurrence processing, recipient permission checks, email infrastructure and auditing. These values are not saved or activated.</p>
  </section>;
}
