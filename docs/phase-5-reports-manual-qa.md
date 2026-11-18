# Phase 5-A — Reports developer browser QA

015 browser QA remains pending in `phase-4-c-manual-qa.md`; this checklist does not supersede it.
Agent browser QA: NOT RUN. No screenshots captured. GitHub/Vercel synchronization unverified; approved favicon missing.

Tester: ____ Date: ____ Browser: ____ Preview/source revision: ____
Final production BUILD_ID (read `.next/BUILD_ID`): ____
Browser-served BUILD_ID or verified current Preview source: ____

Open current Bolt project Preview, reload, and verify Code view contains `src/app/reports/page.tsx`, the three report selections in `reports-workspace.tsx`, and rejected customer scope (-1) in `customer-view-state.ts`. Do not assume Vercel is current. Production BUILD_ID and development Preview source identity are different evidence; record which was verified.

For every check record [ ] PASS [ ] FAIL [ ] NOT RUN and evidence.
- [ ] Reports sidebar opens /reports, no Soon; active only on Reports. Desktop, collapsed and mobile navigation work. Compliance/Administration remain disabled.
- [ ] Direct navigation and browser Back/Forward work across all six enabled routes.
- [ ] Executive is default; all three selections work by keyboard and mouse, with one pressed selection. Selection preserves customer/mode.
- [ ] Each report identifies scope, Demo/Live availability, sources and limitations.

## Expected validated figures
| Scope | Users | Devices | Issues | Critical | Coverage | Insights | Backup assets | Successful executions |
|---|---:|---:|---:|---:|---|---:|---:|---:|
| All |146|83|80|4|73.5%|5|61|48|
| A |62|35|24|1|88%|3|18|15|
| B |48|27|31|2|61%|4|27|20|
| C |36|21|25|1|70%|3|16|13|

Severity Critical/High/Medium/Low: All 4/23/41/12; A 1/7/12/4; B 2/9/16/4; C 1/7/13/4.
Freshness Under 1h/1–3h/4–24h/Over 24h/No successful backup: All 4/8/28/15/6; A 2/3/9/3/1; B 1/3/11/9/3; C 1/2/8/3/2.
Outcomes Successful/Partial/Degraded or failed/Not available: All 48/3/5/7; A 15/1/1/2; B 20/1/3/3; C 13/1/1/2.

- [ ] Verify every scope in every report against these expectations.
- [ ] Nine canonical controls and statuses match Security. Coverage measurement explanation retained; no score calculated from statuses.
- [ ] Backup basis is job_executions; last_24_hours is illustrative. Executions and assets distinct; no success rate, restore action or verified recovery points.
- [ ] No new findings, history, dates, export/email/scheduling actions or provider claims.

## Isolation
- [ ] Select B in Demo; visit each report and other modules; scope persists.
- [ ] Switch Live: fictional names, figures, controls and backup content clear immediately; header and accessibility tree are neutral.
- [ ] Switch Demo: B restored. Reload: Live default.
- [ ] Rapid A/B/C and mode switching with frame capture: no mixed sources or outdated figures. Record NOT RUN if capture unavailable.
- [ ] Invalid ID/removed customer produces rejected scope, never broader portfolio. Technical tester can dispatch existing reducer via React developer tools in isolated Preview (no source change); otherwise mark browser check NOT RUN. Explicit All restores normal selection. Automated invalid/wrong-scope tests are not browser evidence.

## Responsive/accessibility results
For each width test all three reports in Live, Demo All and Demo B (63 combinations). Fill each cell with PASS/FAIL/NOT RUN and attach defects.
| Width | Executive: Live / All / B | Security: Live / All / B | Backup: Live / All / B |
|---|---|---|---|
|320|___ / ___ / ___|___ / ___ / ___|___ / ___ / ___|
|375|___ / ___ / ___|___ / ___ / ___|___ / ___ / ___|
|768|___ / ___ / ___|___ / ___ / ___|___ / ___ / ___|
|1024|___ / ___ / ___|___ / ___ / ___|___ / ___ / ___|
|1280|___ / ___ / ___|___ / ___ / ___|___ / ___ / ___|
|1440|___ / ___ / ___|___ / ___ / ___|___ / ___ / ___|
|1920|___ / ___ / ___|___ / ___ / ___|___ / ___ / ___|

- [ ] No overflow, clipped titles/values, broken grids or overlapping controls.
- [ ] One h1; meaningful heading hierarchy; native keyboard-operable selection; visible focus; no traps or nested controls.
- [ ] Loading/error/empty states readable; Retry works; announcements not excessive.
- [ ] Reduced motion respected; measure WCAG AA contrast in actual rendered states. These targeted checks are not a full manual WCAG audit.
- [ ] Console/network reviewed; record errors and favicon 404 separately.

## Actual screenshots
Capture full-page, review, save under `docs/screenshots/phase-5-a/`:
- [ ] reports-1440-demo-executive-all.png
- [ ] reports-1920-demo-executive-all.png
- [ ] reports-375-demo-executive-all.png
- [ ] reports-1440-demo-security-all.png
- [ ] reports-1440-demo-backup-all.png
- [ ] reports-1440-demo-customer-b.png
- [ ] reports-1440-live-all.png
- [ ] reports-320-demo-customer-b.png

Workflow: ____ Isolation: ____ Responsive: ____ Accessibility: ____
Console/network findings: ____ Screenshots reviewed: ____
Dashboard/Security/Backup/Customers/Users & Devices regressions: ____
Final browser recommendation: PASS / FAIL / BLOCKED
Browser verification is mandatory before release. Source-development PASS does not approve Phase 5 or close Phase 4 QA. Stop after 016; await approval.
