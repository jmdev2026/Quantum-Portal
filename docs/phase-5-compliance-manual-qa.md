# Phase 5-B — Compliance browser QA handoff

Agent browser QA: NOT RUN — developer verification pending. No screenshots captured. Preserve Phase 4 and Reports handoffs; they remain pending separately.

Tester: ____ Date: ____ Browser/version: ____ Source revision: ____
Production BUILD_ID from `.next/BUILD_ID`: ____ Browser-served BUILD_ID: ____
Preview source identity (if using development Preview rather than production build): ____

Open the current project in Bolt Preview and Reload. Verify Code view includes `src/app/compliance/page.tsx`, six functions in `compliance-view.ts`, and the live guard in `complianceControls`. Confirm the shared reducer still rejects invalid customer IDs with customer scope (-1). Do not assume an old Preview or Vercel contains current source. Record whether evidence identifies development source or a served production build.

For each item record PASS / FAIL / NOT RUN with evidence; unchecked means not tested.

## Navigation and framework
- [ ] PASS [ ] FAIL — /compliance opens directly and through desktop, collapsed and mobile sidebar.
- [ ] PASS [ ] FAIL — Active only on /compliance; no Soon; Administration disabled; other six routes enabled.
- [ ] PASS [ ] FAIL — Refresh and browser Back/Forward work; refresh defaults to Live.
- [ ] PASS [ ] FAIL — Four sections appear: Framework Overview, Security Control Visibility, Assessment Evidence, Compliance Summary.
- [ ] PASS [ ] FAIL — Official functions GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER; educational explanations identified as Quantum Shield wording.
- [ ] PASS [ ] FAIL — NIST official publication link works; disclaimer explicitly excludes formal assessment, audit and certification.
- [ ] PASS [ ] FAIL — No framework percentages, maturity levels, category mappings or endorsement claims.

## Customer controls and isolation
- [ ] PASS [ ] FAIL — Demo All shows the nine controls; compare each status directly against Security for All (do not aggregate A/B/C).
- [ ] PASS [ ] FAIL — Repeat for A, B and C; exact canonical names and normalized statuses match Security.
- [ ] PASS [ ] FAIL — All → A → B → C → All preserves accurate names and controls.
- [ ] PASS [ ] FAIL — Reports → Compliance → Security → Compliance retains scope and mode.
- [ ] PASS [ ] FAIL — Live contains neutral scope labels and Not connected controls; no fictional statuses or names, including accessibility tree.
- [ ] PASS [ ] FAIL — Demo B → Live clears immediately; returning Demo restores B. Reload defaults Live.
- [ ] PASS [ ] FAIL — Rapid customer/mode switching with frame recording shows no previous-customer or Demo-in-Live frames; delayed requests do not overwrite current view.
- [ ] PASS [ ] FAIL — Invalid/removed customer yields rejected scope, not All. Technical tester may dispatch existing reducer in isolated Preview using React developer tools without modifying source. If unavailable, mark NOT RUN rather than treating valid clicks as invalid-input testing.
- [ ] PASS [ ] FAIL — Explicit All remains functional after rejection.

Nine controls: Managed Detection & Response; Identity Threat Detection & Response; External Footprint Scan; Dark Web Monitoring; Email Protection; Endpoint Security; Cloud Data Protection; Security Awareness Training; Phishing Simulations. Supported simulated labels: Covered / Needs Attention / Unknown. No control card is clickable.

## Evidence and summary safeguards
- [ ] PASS [ ] FAIL — Demo lists six illustrative evidence categories, with no completed/failed checks, files or evidence actions.
- [ ] PASS [ ] FAIL — Live states evidence reporting is not connected without judging evidence outside the portal.
- [ ] PASS [ ] FAIL — Evidence not collected or verified through the application; no formal assessment performed through it.
- [ ] PASS [ ] FAIL — “Compliance status has not been assessed” does not determine actual regulatory compliance.
- [ ] PASS [ ] FAIL — Covered explicitly does not satisfy formal compliance requirements. Simulated signals are not compliance evidence or NIST outcome assessments.
- [ ] PASS [ ] FAIL — No score, assessment results, certification, upload, approval or download actions.

## Responsive matrix — 21 combinations
In each cell enter PASS / FAIL / NOT RUN; test actual CSS viewport widths.
| Width | Live / neutral | Demo / All | Demo / B |
|---|---|---|---|
|320|___|___|___|
|375|___|___|___|
|768|___|___|___|
|1024|___|___|___|
|1280|___|___|___|
|1440|___|___|___|
|1920|___|___|___|

Check framework/control grids, evidence/summary readability, names and status wrapping, no horizontal overflow or clipped labels, mobile navigation and noninteractive card styling.

## Accessibility/diagnostics
- [ ] PASS [ ] FAIL — One h1; logical h2/h3; textual statuses independent of color.
- [ ] PASS [ ] FAIL — Keyboard navigation and external link/Retry have visible focus; no traps/nested interactive controls.
- [ ] PASS [ ] FAIL — Loading/error/empty states readable; announcements not excessive; neutral Live labels.
- [ ] PASS [ ] FAIL — Reduced-motion setting respected; WCAG AA contrast measured on rendered text and controls.
- [ ] PASS [ ] FAIL — Console/network checked; record errors and missing favicon separately.
These targeted checks are not a full manual WCAG audit. Record tools and manual methods: ____

## Actual screenshots
Capture full-page, save and visually review under `docs/screenshots/phase-5-b/`:
- [ ] compliance-1440-demo-all.png
- [ ] compliance-1920-demo-all.png
- [ ] compliance-375-demo-all.png
- [ ] compliance-320-demo-customer-b.png
- [ ] compliance-1440-demo-customer-b.png
- [ ] compliance-1440-live-all.png
- [ ] compliance-768-demo-all.png

Results/evidence/defects: ____
Dashboard/Security/Backup/Customers/Users & Devices/Reports regressions: ____
GitHub synchronization: UNVERIFIED; Vercel deployment: UNVERIFIED unless independently evidenced.
Approved favicon missing; do not invent one. Laravel must enforce future customer authorization.
Final browser recommendation: PASS / FAIL / BLOCKED: ____
Source-development PASS is not production approval, compliance approval or Phase 5 completion. Stop after 017; await approval.
