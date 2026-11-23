# F06 Compliance and Administration browser QA handoff

2026-11-23. Development verification is not browser acceptance or production readiness. Every browser case below is **NOT RUN**. No browser, screenshot, real evidence file, operational invitation, provider connection or actual audit event was produced.

## Actual implemented destinations

Compliance: `/compliance`, `/compliance/framework`, `/compliance/controls`, `/compliance/assessments`, `/compliance/evidence`.
Administration: `/administration`, `/administration/access`, `/administration/integrations`, `/administration/audit`, `/administration/settings`.

Nested destinations use allowlisted App Router section routes with static parameters and Suspense. Unknown sections must not render a workspace. Overview foundations remain read-only; navigation exposes all assigned destinations.

## Required matrix

Execute all ten destinations at **320, 375, 768, 1024, 1280, 1440 and 1920px**, in Live All, Demo All and Demo Customer B: **210 minimum route/viewport/context cases, all NOT RUN**. Add matching A/C scope checks and supplementary stress cases below. Record exact route, context, width, browser/version, result, screenshot/artifact, defect and retest evidence. Planned cases are not executed cases.

## Acceptance checklist

| Area | Required execution |
|---|---|
| Shared navigation | Discover every destination from its overview; verify sidebar active state, aria-current, browser back/forward and unknown section not-found. Preserve Reports/Security/Customers links. |
| Framework | Choose each of six functions; verify exact canonical descriptions, explicit unavailable mapping and reset. One NIST framework only; official reference opens safely. Never infer absent safeguards from missing mapping. |
| Controls | Verify nine canonical definitions and scoped normalized statuses. Search case-insensitively, filter mapping/status where supplied, change ascending/descending sorting, reset, inspect no-match and details. No invented official control IDs or observations. |
| Assessment | Explicit customer selection under All; include unique existing controls; Next/Back; each local review state; safe optional Demo notes; requested categories; review summary; progress numerator/included-row denominator; Edit/Cancel/Reset. Unknown query rejected. Change query on same route and confirm previous draft disappears. |
| Evidence | Inspect educational categories and fictional register; search/category/control/sort/reset; details and assessment link. Validate customer/control/category/required safe description/optional safe note; review/Edit/Cancel/Reset. No file chooser, document bytes, attachment, verified requirement or saved evidence. |
| Access | Switch three proposed roles, filter categories, compare all roles, inspect permission rationale, reset. Select canonical same-customer identity and client role; review/Edit/Cancel/Reset. MSP role elevation is not assignable. Invitation preview accepts at most five unique reserved addresses, never sends mail or creates accounts/tokens. |
| Integrations | Search exactly Laravel Backend, Guardz Security Platform and Datto Endpoint Backup. Inspect canonical plan and verification questions; configure requested categories/permission-review questions; review/Edit/Cancel/Reset. Areas are unverified requests, not active capabilities. No secret, URL, connection test or live status. Datto v2/Kaseya 365 is not SIRIS/SaaS Protection. |
| Audit | Inspect synthetic category, actor and tenant metadata. Search/category/sort/reset/details. No actual chronology, IP/session values, download or real activity claims. Fixture created_at is authoring metadata and never rendered as event time. |
| Settings | Comfortable/Compact changes only local sample spacing; Summary/Detailed changes sample text; supplied cadence/zone and each notification category; review/Edit/Cancel/Reset. No account preference is saved and no notification is sent. Global header remains sole mode/scope control. |
| Isolation | Open each draft/detail, switch A→B→All→Live→Demo, replace/revoke registry, retry source, navigate routes and test late response. Old private-looking data must disappear synchronously and never return with incompatible context. Invalid selection must never widen to All. |
| States | Loading, unavailable, validation alert, source error/retry, empty source and no-match. Empty is distinct from zero compliance achievement or absence of audit events. Failure must not show a previous draft. |
| Accessibility | Keyboard-only navigation; labeled inputs/fieldset legends; selected button announcements; visible focus; dialog initial focus, native modal containment, Escape, Close and opener/fallback restoration; validation focus; review-heading focus; heading hierarchy and readable contrast. No WCAG conformance claimed from source checks. |
| Responsive | No page-level horizontal overflow at 320/375; wrap long canonical names and metadata; scroll dialog within 85dvh; usable touch controls; assessment table readable; no clipped review buttons. Check 200% zoom and mobile landscape. |
| Regression | Recheck F04 portfolio/profile/onboarding/users/devices and F05 six reports/configuration/print/PDF/CSV/scheduling. Retain all earlier browser acceptance gates; no F06 standalone compliance PDF/export exists. |

## Evidence and boundaries

Automated checks: TypeScript PASS, ESLint PASS, focused F06 40/40 PASS; full 846/846 PASS, including unchanged 806 baseline; zero failed/skipped/cancelled. Actual production compilation and final BUILD_ID are recorded in final delivery, not assumed from F05. Browser QA, screenshots, print/PDF inspection, GitHub synchronization and Vercel deployment are NOT VERIFIED.

A local assessment reporting summary is implemented. Dedicated Compliance Report print/export remains F08 closure work and is not a seventh F05 report. Backend dependencies: Laravel session authentication, tenant/role/field authorization, validated NIST mappings, persistence/versioning, authorized private evidence uploads/review/retention, membership/invitation/revocation, secure provider secrets and verified product APIs, immutable server audit, preferences/notification delivery and safe failures. None is implemented here.

**STOP AFTER F06. DO NOT BEGIN F07. WAIT FOR REVIEW AND APPROVAL.**
