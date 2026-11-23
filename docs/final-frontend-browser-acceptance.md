# Final frontend browser acceptance — F08 (consolidated)

Status: **NOT RUN.** No browser, screenshot or frame-capture tool was available to the developer during F08. Every row below is NOT RUN until a human reviewer records evidence. This list consolidates and deduplicates the browser checklists in `phase-4-c-manual-qa.md`, `phase-5-*-manual-qa.md` and `phase-f04`…`phase-f07-browser-qa-handoff.md`; those documents remain the detailed historical references.

Rules: record the source revision/BUILD_ID under test; mark FAIL with severity; a PASS requires evidence (screenshot, recording or notes). Do not mark PASS from source review.

Viewports: M = 375×812, T = 768×1024, D = 1440×900. Modes: L = Live (default), D = Demo. Scope: All / A / B / C.

## P0 — must pass before any owner acceptance

| Test ID | Viewport | Mode/scope | Action | Expected | Actual | Result | Severity | Evidence | Reviewer | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0-01 | D | L / All | Open every route in the route inventory | Live shows unavailable/not-connected states; no fictional figures, names or reports | | NOT RUN | P0 | | | |
| P0-02 | D | D→L | Switch Demo to Live on Dashboard, Security, Backup, Reports, Compliance | All Demo content disappears in the same frame; no Demo values in Live | | NOT RUN | P0 | | | |
| P0-03 | D | D / A→B→C | Rapidly switch customers on each module | No mixed-customer frames; final view matches final selection | | NOT RUN | P0 | | | |
| P0-04 | D | D / invalid | Visit `/customers/999`, `/customers/abc`, removed customer | Fails closed; never widens to All | | NOT RUN | P0 | | | |
| P0-05 | D | D / B | Open a dialog/drawer then switch customer or mode | Dialog closes or unmounts; no stale customer data | | NOT RUN | P0 | | | |
| P0-06 | D | D / B | Start Print or CSV, then change scope | Output is for the scope shown at action time or is blocked; never mixed | | NOT RUN | P0 | | | |
| P0-07 | D | D / each | Print / Save as PDF on all 7 reports | Only the report prints, with demo disclosure; shell hidden | | NOT RUN | P0 | | | |
| P0-08 | D | D / each | Download CSV on all 7 reports; open in a spreadsheet | UTF-8 readable; disclosure row; formula cells neutralized; only scoped rows | | NOT RUN | P0 | | | |
| P0-09 | D | D / any | Compliance Report: try to remove required sections | Cover, Overview, Evidence Limitations, Methodology and Data Source/Legal cannot be removed | | NOT RUN | P0 | | | |
| P0-10 | D | any | Read all Compliance text | No claim of certification, compliance, audit or score | | NOT RUN | P0 | | | |

## P1 — required for frontend acceptance

| Test ID | Viewport | Mode/scope | Action | Expected | Actual | Result | Severity | Evidence | Reviewer | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1-01 | M | any | Open the mobile menu; Tab through it; press Escape | Focus trapped in menu; background not reachable; Escape closes and returns focus | | NOT RUN | P1 | | | |
| P1-02 | M, T, D | D / All | Visit every route | No horizontal page scroll; tables scroll inside their own container | | NOT RUN | P1 | | | |
| P1-03 | D | any | Keyboard-only through each module | Visible focus ring; skip link works; logical order | | NOT RUN | P1 | | | |
| P1-04 | D | any | Screen reader over status changes (loading → ready) | Polite announcements; no duplicate spam | | NOT RUN | P1 | | | |
| P1-05 | D | D / B | Assessment Workspace: draft → preview → Compliance report preview → Print/CSV | Only draft entries shown; notes never in output; Cancel clears | | NOT RUN | P1 | | | |
| P1-06 | D | D / B | Draft assessment, then switch to C | Draft and its preview are discarded | | NOT RUN | P1 | | | |
| P1-07 | D | D / any | Dashboard insight → Review Insight Context | Dialog opens, read-only text, links work, focus returns on close | | NOT RUN | P1 | | | |
| P1-08 | D | any | Global search, notifications, account, help, 404 and error pages | Work as previewed; no fake contact data; no fake sign-in success | | NOT RUN | P1 | | | |
| P1-09 | D | D / any | Reports Library filters including Governance | Seven reports listed; filter counts correct | | NOT RUN | P1 | | | |
| P1-10 | D | any | Browser with storage blocked (private mode) | Sidebar still works; no crash | | NOT RUN | P1 | | | |
| P1-11 | D | any | 200% zoom and Windows High Contrast | Content readable; controls usable | | NOT RUN | P1 | | | |

## P2 — polish

| Test ID | Viewport | Mode/scope | Action | Expected | Actual | Result | Severity | Evidence | Reviewer | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P2-01 | M, T, D | D | Visual consistency of cards, badges, spacing | Consistent charcoal/green theme, readable contrast | | NOT RUN | P2 | | | |
| P2-02 | D | any | Reduced-motion preference | Non-essential animation suppressed | | NOT RUN | P2 | | | |
| P2-03 | D | any | Print preview in Chrome, Edge, Firefox, Safari | Page breaks reasonable; no clipped tables | | NOT RUN | P2 | | | |
| P2-04 | D | any | Tab title and empty favicon | Titles correct; favicon gap noted under Branding gate | | NOT RUN | P2 | | | |

## Optional automated plan (not installed)

Playwright is not installed and was not added. If the owner approves it later: add `@playwright/test` as a dev dependency, run `npx playwright install chromium`, start `npm run build && npm start`, and script P0-01…P0-08 and P1-01…P1-03 at the three viewports, capturing screenshots into `docs/screenshots/final/`. Frame-level mixed-scope checks (P0-03) need trace recording.
