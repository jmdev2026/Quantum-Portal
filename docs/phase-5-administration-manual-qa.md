# Phase 5-C — Administration developer browser QA

Browser QA: NOT RUN — developer handoff pending. Agent captured no screenshots. Earlier Phase 4, Reports and Compliance handoffs remain separate and unchanged.

Tester: ____ Date: ____ Browser/version: ____ Source revision: ____
Production BUILD_ID (`.next/BUILD_ID`): ____ Browser-served BUILD_ID: ____
Development Preview source identity, if used instead: ____

Open current Bolt project Preview and Reload. In Code view confirm `src/app/administration/page.tsx`, the boundary notice and four sections in `administration-workspace.tsx`, and the neutral Live label used by `administrationScope`. Verify shared reducer rejection still uses customer scope (-1). Do not assume a previous Preview or Vercel is current. Record which source/version or served build was actually tested.

For each item record PASS / FAIL / NOT RUN and evidence. Unchecked items are not tested.

## Navigation and organization context
- [ ] PASS [ ] FAIL — /administration opens directly, through desktop, collapsed and mobile sidebar; no Soon.
- [ ] PASS [ ] FAIL — Active only on /administration; all eight routes remain enabled; Refresh and Back/Forward work.
- [ ] PASS [ ] FAIL — Heading, description and browser title match Administration.
- [ ] PASS [ ] FAIL — Four sections: Organization & Portal Overview, Access Governance, Integration Readiness, Auditability & Security.
- [ ] PASS [ ] FAIL — Only known product/provider, scope and mode facts shown; no invented account records, IDs, dates, billing or administrator identity.

## Shared scope / mode
- [ ] PASS [ ] FAIL — Demo All → A → B → C → All shows correct scope, without permission claims.
- [ ] PASS [ ] FAIL — Navigate all modules and return; selection persists.
- [ ] PASS [ ] FAIL — Demo B → Live: fictional name disappears immediately from page, header and accessibility tree. Live scope is neutral.
- [ ] PASS [ ] FAIL — Return Demo: B restored. Reload: Live default.
- [ ] PASS [ ] FAIL — Invalid/removed customer shows Customer unavailable, never All. Technical tester may dispatch existing reducer using React developer tools in isolated Preview, with no source change; if unavailable record NOT RUN. Explicit All works afterward.
- [ ] PASS [ ] FAIL — Rapid switching produces no stale fictional context. No administration service requests are expected.

## Security boundaries
- [ ] PASS [ ] FAIL — Planning notice explicit; no claim of authenticated administrator or enforced permissions.
- [ ] PASS [ ] FAIL — Proposed MSP Administrator, Client Administrator, Client Viewer roles labelled “Proposed access model — not enforced”; no assignments/counts.
- [ ] PASS [ ] FAIL — Future Laravel authentication, MFA, sessions, permissions, tenant boundaries, validation, least privilege and audit requirements are described, not claimed operational.
- [ ] PASS [ ] FAIL — No Save/Edit/Delete/Configure, login, invitation, role-changing, licensing or other operational controls.
- [ ] PASS [ ] FAIL — Laravel, Guardz and Datto Endpoint Backup show pending backend integration, not external provider health.
- [ ] PASS [ ] FAIL — Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup identified; capabilities conditional on verification.
- [ ] PASS [ ] FAIL — No connected claims, sync dates, credentials, endpoints or secret configuration. Restore operations unavailable.
- [ ] PASS [ ] FAIL — Future audit categories only; no log entries, timestamps, counts, search or exports. Portal limitation does not imply absence of external activity.

## Responsive matrix — 21 combinations
Enter PASS / FAIL / NOT RUN in each cell, using actual CSS viewport widths.
| Width | Live / neutral | Demo / All | Demo / B |
|---|---|---|---|
|320|___|___|___|
|375|___|___|___|
|768|___|___|___|
|1024|___|___|___|
|1280|___|___|___|
|1440|___|___|___|
|1920|___|___|___|

Check card stacking, long integration names, role explanations, audit categories, status wrapping and mobile menu. No horizontal scrolling, clipped labels or interactive-looking informational cards.

## Accessibility and diagnostics
- [ ] PASS [ ] FAIL — One h1, logical h2/h3, meaningful section labels and decorative icons hidden from assistive technology.
- [ ] PASS [ ] FAIL — Shared navigation keyboard accessible; visible focus, no traps or nested controls. No page actions/links are expected.
- [ ] PASS [ ] FAIL — Neutral Live accessible scope; context announcement is concise and not excessive.
- [ ] PASS [ ] FAIL — Reduced-motion preference respected; actual rendered WCAG AA contrast measured.
- [ ] PASS [ ] FAIL — Console/network checked across all eight routes; record missing favicon separately.
These targeted checks do not establish full WCAG compliance. Methods/tools: ____

## Actual screenshots
Capture full-page and review under `docs/screenshots/phase-5-c/`:
- [ ] administration-1440-live-all.png
- [ ] administration-1440-demo-all.png
- [ ] administration-1920-demo-all.png
- [ ] administration-375-demo-all.png
- [ ] administration-320-demo-b.png
- [ ] administration-1440-demo-b.png
- [ ] administration-768-demo-all.png

Results/defects/evidence: ____
Dashboard/Security/Backup/Customers/Users & Devices/Reports/Compliance regressions: ____
Browser recommendation: PASS / FAIL / BLOCKED: ____
GitHub/Vercel synchronization remains UNVERIFIED unless independently evidenced. Approved favicon remains missing. No commit, push or deployment is claimed.
Source-development approval is not production readiness. Future secure backend authorization and actual provider integration validation remain required. Stop after 018; await review.
