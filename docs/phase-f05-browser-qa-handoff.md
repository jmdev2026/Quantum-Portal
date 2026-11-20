# F05 reporting center — browser acceptance handoff

Date: 2026-11-20. **Browser QA NOT RUN. Printed/PDF/CSV files NOT visually inspected.** Source contracts and automated checks are not browser acceptance or WCAG conformance. No browser tool is available in this environment; do not use historical screenshots as F05 evidence.

## Actual routes and matrix

Library `/reports` preserves the three original locally selected summary tabs. New purpose-built report destinations:

- `/reports/executive`
- `/reports/cybersecurity`
- `/reports/backup`
- `/reports/dark-web`
- `/reports/awareness-training`
- `/reports/phishing-simulations`

They are implemented by `src/app/reports/[report]/page.tsx`, with approved static params and unknown-report rejection. Configuration, preview, output and schedule review are inline, not separate routes or dialogs.

Run all six destinations at 320, 375, 768, 1024, 1280, 1440 and 1920px across Live All, Demo All and Demo Customer B: **126 minimum report/viewport/context combinations**, all NOT RUN. Test the library additionally at all seven widths and three contexts (21 additional cases), plus direct invalid routes, matched A/C scopes and scope stress cases below. Record route, context, viewport, browser/version, result, screenshot or artifact, and defect reference. Do not mark a case PASS without executing it.

## Interactive acceptance checklist

- Library: six unique definitions/purposes/categories; bounded search/category/reset; empty matches; every Open Report destination; original three tabs still work; active Reports sidebar on all six routes.
- Direct entry, library return, capability links, shared customer preference, Back/Forward; unknown report returns not-found. No query parameter grants or selects scope.
- For each report: inspect every unique section and source definition. Reconcile All/A/B/C canonical user/device counts, severity, coverage, insights, protected assets/freshness/outcomes separately from samples.
- Executive: organization limitations, technology, severity, coverage/insights, backup and clearly general recommendations.
- Cybersecurity: nine capabilities, aggregate issues versus detections, identities/endpoints sample notes, no active-provider claims.
- Backup: protected totals/freshness/execution basis and illustrative last-24-hours period; separate six asset/job examples (two per customer). Persistent restore-unavailable statement and no tested restoration/RTO/RPO inference.
- Dark Web: counts/classifications/accounts/domains/review reconcile to F02c; no verified breach/enrollment/scan date/credential claims.
- Training: eligible/completed/in-progress/not-started assignments; 6/18 All completion = 33.3%; assignments never Dashboard employee totals; outstanding rows and topics.
- Simulation: delivered denominator 12 All, interacted 6, reported 6, overlap 3; 50.0% rates; overlap retained in campaign breakdown; no actual delivery or compromise claim.
- Configuration: bounded safe title; required overview cannot be omitted; optional section selection; Summary shows first five rows per section with explicit truncation; Detailed shows all; example toggle removes example sections. No unsupported date picker. Definitions and limitations remain included.
- Apply Preview renders actual selected options; Edit removes old output; Cancel/Reset clears preview and restores defaults; return/unmount clears drafts; scheduling reflects prepared configuration.
- Keyboard: native labels/fieldsets/buttons/links, visible focus, error focus, review heading focus, announcements, navigation anchors, no nested controls or keyboard traps. No new dialog was introduced; shared native dialogs remain unchanged.
- Mobile: long titles/customer labels, library cards, section links, configuration checkboxes, dense tables, schedule controls, output buttons; no unintended horizontal overflow, illegible text, hidden rows or clipped legends. Check light report contrast inside dark shell.

## Actual print/PDF acceptance — mandatory open gate

1. Prepare each report in Detailed, then in Summary, with sections/examples included and excluded.
2. Use **Print / Save as PDF**. Confirm browser print dialog invokes the actual prepared report, not an invented file or application shell.
3. Inspect Letter paper, margins, multiple pages, portrait, browser headers/footers settings, table headers and row splitting; check unusually long cells and titles.
4. No sidebar, header/navigation, configuration, scheduling or output buttons may print. Every selected report section must print; summary truncation must match the screen preview.
5. The printable cover/footer must retain `DEMONSTRATION REPORT — SIMULATED DATA — NOT FOR OPERATIONAL DECISIONS.` and the correct title/customer scope.
6. Generation date must be identified as local preparation time, never observation/coverage time. Source/metric limitations must be legible.
7. Save as PDF where supported and visually inspect the resulting actual file page-by-page. Opening print alone is not proof of successful saving. No application-generated downloadable PDF exists.
8. Invoke printing after customer/mode changes, while sources reload, after Edit/Reset and in Live: no stale Demo report may print. Without a prepared report, report-print layout intentionally contains no report.

## CSV acceptance

Executive has no approved example dataset and does not offer aggregate CSV. The other five reports export only enabled example sections, respecting Summary/Detailed row limits. Turning off examples or excluding every example section disables CSV.

Download actual CSVs for All/B/A/C; inspect UTF-8 BOM, CRLF, quotes/embedded commas/newlines, source/disclosure metadata, safe filenames and only permitted fictional fields. Open with a text editor and spreadsheet; dangerous leading formula/control characters must remain literal (apostrophe neutralization). Empty data must not produce a false export success. No hidden IDs/credentials are exported. Switch report/customer/mode immediately before exporting and verify no prior scope content.

## Scheduling acceptance

Weekly weekday; Monthly day 1–28; Quarterly day 1–28 of January/April/July/October; time 00:00–23:59; supplied time zones only. Up to five distinct reserved Demo addresses, comma-separated. Test invalid/duplicate/real recipients, bad cadence/time/day and unsupported zones. Review must show title, scope, sections, presentation, recipients and accurate proposed cadence. Edit/Cancel/Reset work; navigation, mode/customer/registry change and configuration editing clear schedule review.

Persistent notice: `Demonstration only. No report has been scheduled, saved, emailed or delivered.` No Activate, successful delivery, saved schedule or historical entry is valid.

## Isolation and failure stress

All → A → B → C → All; Demo → Live → Demo; rapid switching with preview/schedule open; registry replacement/revocation; invalid selected ID; wrong-scope normalized response; delayed response; retry; direct route; Back/Forward; reload defaults. Use authorized developer harnesses for source failures; do not add fake production failure controls. Loading/error/retry/unavailable/empty must remain distinct from healthy/zero reporting. Configuration scope is a presentation check, never server authorization.

## Open integration/deployment gates

No Laravel backend/authenticated tenant enforcement/provider reporting/persistent schedules/email delivery/history/private output storage/server PDF generation exists. Future role/tenant policies and sensitive report access require backend enforcement. GitHub synchronization and Vercel deployment NOT VERIFIED; working directory is not a Git repo. F06 NOT STARTED; review and approval required.
