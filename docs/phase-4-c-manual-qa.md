# Quantum Shield Command — 015/050 R2 manual QA handoff

Status: BLOCKED — browser QA required. No browser checks or screenshots were executed by the agent in R2.

## Tester and source identification

Tester: __________ Date: __________ Browser/version: __________
Preview address (record, do not assume Vercel is current): __________
Current build identifier: record from `.next/BUILD_ID`: __________
Preview-served build identifier, if available: __________
Source verified: PASS / FAIL / NOT VERIFIED

Open this project in Bolt, choose Preview, and use Reload. Use Responsive mode for viewport checks; the More preview controls menu offers Open in new window and Full screen. Open in new window for browser Back/Forward and developer tools. Do not start a separate server in the restricted agent session.

Before testing, use Code view to confirm the current source:
- `src/components/customer-view/customer-view-state.ts`: invalid selection and a removed selection both return customer scope with `customerId: -1`, never All Customers; notice says to explicitly choose All Customers.
- `src/components/customer-view/customer-view-provider.tsx`: Demo uses stored view; Live uses `LIVE_VIEW`; selectedCustomer is null in Live.
- `src/components/dashboard-mode/dashboard-mode-provider.tsx`: initial mode is Live.

A loaded page or old screenshot alone does not identify source. Record source revision/version shown in Bolt if available. Preview may run development source, so a production BUILD_ID may not exist there. Record that distinction, not an invented match. If preview freshness cannot be established, mark source verification NOT VERIFIED and stop approval. Do not assume GitHub or Vercel contains these changes.

## Workflow and figures

For each line record PASS / FAIL and evidence:
- [ ] Start Live on `/`; enable Demo; open `/customers`.
- [ ] All Customers lists A (ID 1), B (ID 2), C (ID 3).
- [ ] View Customer selects B; detail contains only B.
- [ ] Open `/users-devices`: B has 48 users, 27 devices, two identity examples and two endpoint examples, all belonging to B.
- [ ] Open `/security`: B scope and B-only records; no records from A/C.
- [ ] Open `/backup`: B has 27 protected assets and 20 successful fictional job executions. Executions are not unique assets.
- [ ] Return to Customers; explicitly choose All Customers; all three customers return.
- [ ] Return to Dashboard; Demo remains enabled and All Customers remains selected.
- [ ] Browser Back/Forward between modules preserves current shared selection and Demo mode; no unexpected scope reset.
- [ ] Repeat customer detail and linked module navigation for A and C.

| Scope | Users | Devices | Identity examples | Endpoint examples |
|---|---:|---:|---:|---:|
| All | 146 | 83 | 6 | 6 |
| A | 62 | 35 | 2 | 2 |
| B | 48 | 27 | 2 | 2 |
| C | 36 | 21 | 2 | 2 |

Examples must be labelled fictional/simulated and incomplete, not a complete inventory or verified protection. No management actions are expected.

## Live/Demo isolation

Record PASS / FAIL separately for `/`, `/security`, `/backup`, `/customers`, `/users-devices`.
1. Reload: Live is default. Scope labels are neutral/unavailable; no fictional customer names, metrics or records.
2. Enable Demo, select B and navigate all five routes. Verify B-only content.
3. Switch to Live on each route. Inspect page text, header, selector, accessibility tree and live-region announcements: all fictional names, values and records disappear immediately.
4. Switch back to Demo: B is restored. Reload: Live returns.
5. Rapidly change A/B/C and Live/Demo while recording frames with browser tools. Review intermediate frames for mixed-customer or Demo-in-Live content. Mark NOT RUN if frame capture is unavailable.

## Invalid and removed customer checks

There is no public UI to enter arbitrary customer IDs. Do not pretend valid clicks test invalid input. A technical tester may use React developer tools to dispatch the existing CustomerView reducer in an isolated Preview; do not modify source or add product controls.
- Dispatch `select_customer` with ID 999 and the canonical customers: rejected customer scope (-1), notice and error/unavailable displays; no All portfolio and no other customer's data.
- Select B, then dispatch `reconcile` with a customer list excluding B: same safe rejection.
- Explicitly choose All Customers afterward: three customers return normally.
- Select valid A/B/C afterward: normal customer switching resumes.
- If reducer dispatch is unavailable, mark these browser checks NOT RUN. Existing automated tests cover the reducer and wrong-scope rejection; they do not constitute browser verification.

Frontend checks protect display integrity only. Laravel must enforce authorization and tenant isolation.

## Responsive matrix — 42 results

Each cell must contain PASS / FAIL / NOT RUN. Columns are separate mode/scope runs. Use actual CSS viewport widths, not merely device names.

| Page | Width | Live / neutral All | Demo / All | Demo / B |
|---|---:|---|---|---|
| Customers | 320 | | | |
| Customers | 375 | | | |
| Customers | 768 | | | |
| Customers | 1024 | | | |
| Customers | 1280 | | | |
| Customers | 1440 | | | |
| Customers | 1920 | | | |
| Users & Devices | 320 | | | |
| Users & Devices | 375 | | | |
| Users & Devices | 768 | | | |
| Users & Devices | 1024 | | | |
| Users & Devices | 1280 | | | |
| Users & Devices | 1440 | | | |
| Users & Devices | 1920 | | | |

In every cell check no horizontal scrolling, clipped names, badge overlap, broken grids, hidden actions or misleading clickable record styling. Check wrapping, card alignment, mobile navigation and focus position. Record defect, route, width, mode and scope for any failure.

## Accessibility and diagnostics

Record PASS / FAIL / NOT RUN for each:
- [ ] Logical heading hierarchy and meaningful accessible names.
- [ ] Keyboard-only navigation, selector open/select/close, Escape and focus return.
- [ ] Visible focus rings; no keyboard traps; mobile menu reachable.
- [ ] Neutral Live accessible labels and readable loading/error states.
- [ ] No excessive live-region announcements.
- [ ] Reduced-motion preference respected (enable in browser rendering tools).
- [ ] WCAG AA contrast: normal text 4.5:1; large text 3:1; relevant controls/focus 3:1. Measure actual rendered states.
- [ ] Console reviewed across workflow; errors recorded below.
- [ ] Network reviewed; failed requests recorded separately from app defects.

Method/tool used: __________ Findings: __________
These targeted checks are not a complete manual WCAG audit. No automated accessibility scan has been executed by the agent.
Favicon: approved asset is missing; record any actual `/favicon.ico` 404 separately. Do not invent an asset.

## Required actual full-page screenshots

Save under `docs/screenshots/phase-4-c/`. Check off only after capture and visual review. Never reuse earlier-phase screenshots as current evidence.
- [ ] customers-1920-demo-all.png
- [ ] customers-1440-demo-all.png
- [ ] customers-375-demo-all.png
- [ ] customers-320-demo-b.png
- [ ] customers-1440-demo-b.png
- [ ] customers-1440-live-all.png
- [ ] users-devices-1920-demo-all.png
- [ ] users-devices-1440-demo-all.png
- [ ] users-devices-375-demo-all.png
- [ ] users-devices-320-demo-b.png
- [ ] users-devices-1440-demo-b.png
- [ ] users-devices-1440-live-all.png
- [ ] shared-header-live-after-demo-b.png

## Approval

Browser workflow: __________ Live isolation: __________ Invalid-scope checks: __________
Responsive passed: ___ / 42 Accessibility: __________ Screenshot review: __________
Console/network findings: __________ Module regressions: __________
GitHub synchronization: UNVERIFIED unless independently evidenced.
Vercel deployment: UNVERIFIED unless independently evidenced.
Final recommendation: PASS / FAIL / BLOCKED
Do not recommend PASS with missing browser evidence or unresolved module-breaking defects. Stop at 015/050 R2; do not start 016.

Preview controls reference: https://support.bolt.new/building/preview-controls
