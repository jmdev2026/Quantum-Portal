"use client";

import { useState } from "react";
import { DARK_WEB_DISCLOSURE, REVIEW_DISPOSITIONS, EMPTY_REVIEW_DRAFT, type ExposureFinding, type ReviewDraft } from "@/services/dark-web-types";
import { validateReviewDraft, darkWebLabel } from "@/components/security/dark-web-view";
import { capabilityAction } from "@/components/security/capability-record-explorer";

export function DarkWebReviewPreview({ finding, onCancel }: { finding: ExposureFinding; onCancel: () => void }) {
  const [draft, setDraft] = useState<ReviewDraft>({ ...EMPTY_REVIEW_DRAFT });
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReviewDraft | null>(null);
  const reset = () => { setDraft({ ...EMPTY_REVIEW_DRAFT }); setPreview(null); setError(null); };
  return <section aria-labelledby="review-preview-title" className="mt-6 space-y-4">
    <h3 id="review-preview-title" className="text-lg font-semibold text-ink-100">Demonstration review preview</h3>
    <p className="rounded-xl border border-amber-signal/30 p-4 text-sm leading-relaxed text-amber-signal">{DARK_WEB_DISCLOSURE}</p>
    <p className="text-sm text-ink-300">Existing fictional status: {darkWebLabel(finding.review_status)}. The source finding remains unchanged.</p>
    {preview ? <div className="space-y-4 rounded-xl border border-ink-700 bg-ink-950 p-4"><p role="status" className="font-medium text-ink-100">Local proposed review only · not saved</p><dl className="space-y-4 text-sm"><div><dt className="text-ink-350">Proposed disposition</dt><dd className="mt-2 capitalize text-ink-100">{darkWebLabel(preview.disposition)}</dd></div><div><dt className="text-ink-350">Non-sensitive demonstration note</dt><dd className="mt-2 break-words leading-relaxed text-ink-100">{preview.note}</dd></div></dl><button type="button" onClick={() => setPreview(null)} className={capabilityAction}>Edit local preview</button></div> : <form noValidate onSubmit={event => {
      event.preventDefault();
      const problem = validateReviewDraft(draft);
      setError(problem);
      if (!problem) setPreview({ ...draft, note: draft.note.trim() });
    }} className="space-y-4">
      <label className="block space-y-2 text-sm text-ink-300"><span>Fictional review disposition</span><select value={draft.disposition} onChange={event => {
        const value = event.target.value;
        if (value === "" || (REVIEW_DISPOSITIONS as readonly string[]).includes(value)) setDraft({ ...draft, disposition: value as ReviewDraft["disposition"] });
      }} aria-describedby="review-disclaimer" className="min-h-11 w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400"><option value="">Choose a demonstration disposition</option>{REVIEW_DISPOSITIONS.map(value => <option key={value} value={value}>{darkWebLabel(value)}</option>)}</select></label>
      <label className="block space-y-2 text-sm text-ink-300"><span>Non-sensitive Demo note</span><textarea rows={4} maxLength={200} value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })} placeholder="Demo: fictional review guidance prepared" aria-describedby="review-disclaimer review-validation" aria-invalid={Boolean(error)} className="w-full resize-y rounded-lg border border-ink-600 bg-ink-950 p-3 text-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shield-400" /></label>
      <p id="review-disclaimer" className="text-xs leading-relaxed text-ink-350">Use 12–200 characters starting with Demo: and words only. Do not enter personal information, credentials, numbers or links. Nothing is sent or persisted.</p>
      <p id="review-validation" role={error ? "alert" : undefined} className="text-sm leading-relaxed text-red-300">{error}</p>
      <button type="submit" className={capabilityAction}>Preview proposed review</button>
    </form>}
    <div className="flex flex-wrap gap-3"><button type="button" onClick={reset} className={capabilityAction}>Reset preview</button><button type="button" onClick={() => { reset(); onCancel(); }} className={capabilityAction}>Cancel and return to finding</button></div>
  </section>;
}
