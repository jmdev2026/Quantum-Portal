# Frontend completion roadmap — F08 Final Functionality Closure

## Current milestone — 2026-11-23

F08 delivered for owner review: Compliance Assessment Report, final audits, insight investigation, mobile menu and storage fixes, consolidated browser acceptance list, developer handoff and production readiness gates. Tests 892/892. Frontend development is complete pending owner acceptance; browser acceptance NOT RUN, branding and support contact BLOCKED, backend NOT STARTED. Next phase (backend) must not begin without owner approval.

| Milestone | Scope | Status |
| --- | --- | --- |
| F01–F06 | Approved module completion | Approved |
| F07 | Shared application experience | Partial acceptance |
| F08 | Final functionality closure | Delivered for review |
| Backend | Laravel auth, tenancy, providers | Not started |

## Historical F07 milestone — 2026-11-23

F07 development delivered and awaiting review: sign-in/access-state preview, account workspace, Notification Center, global navigation search, Help & Support, 404/error/loading states and shell consistency. Tests 876/876. Browser QA NOT RUN (`phase-f07-browser-qa-handoff.md`).

| Milestone | Scope | Status |
| --- | --- | --- |
| F01–F06 | Approved module completion | Approved |
| F07 | Shared application experience | Delivered for review |
| F08 | Control inventory; Compliance Report print/export; browser QA reconciliation F04–F07; branding (approved logo/favicon); GitHub/Vercel verification; developer handoff | Not started — requires approval |

**STOP AFTER F07; DO NOT BEGIN F08.**

# Historical F06 Compliance & Administration

## F06 milestone — 2026-11-23

F04/F05 are approved and their historical stop/status statements below are superseded. F06 completes both assigned governance experiences using local nonpersistent previews. Ten concrete routes: Compliance overview/framework/controls/assessments/evidence and Administration overview/access/integrations/audit/settings. The eight subpages are allowlisted static App Router destinations; the existing overview foundations remain intact and gain navigation.

Compliance delivers six-function NIST navigation with truthful unavailable mappings, the exact nine canonical Security Coverage indicators/explorer/details, a staged fictional assessment with local reviewed/included progress, evidence category guidance/strict fictional register/metadata review and actual read-only assessment summary. Administration delivers proposed permission matrix/role comparison, canonical identity client-role and reserved invitation previews, three planned integration directory/details/configuration reviews, synthetic audit schema explorer and local density/report/notification preferences. All support meaningful reset/review behavior and scoped loading/error/unavailable/empty states. No backend/PHP/auth/persistence/upload/mail/access mutation/provider connection/audit recording or settings saving.

Executed evidence: TypeScript PASS; ESLint PASS; F06 focused 40/40 PASS; complete suite 846/846 PASS (806 preserved +40), no failures/skips/cancellations. Final actual compilation/BUILD_ID are delivered separately; no F05 build is reused as F06 evidence. Browser QA NOT RUN; `docs/phase-f06-browser-qa-handoff.md` specifies 210 base cases plus stress/regression cases. Source checks do not establish WCAG or production acceptance. GitHub/Vercel NOT VERIFIED.

| Milestone | Current recommendation |
|---|---|
| F06 | Development scope implemented; review final compilation evidence and delivery, then approve before advancement |
| F07 | NOT STARTED; begin shared experiences/authentication UI states/notifications/preferences/Help only after explicit F06 review and approval; no backend operational claims |
| F08 | Retain all earlier browser acceptance gates; execute responsive/focus/isolation/print/PDF regressions and dedicated Compliance Report print/export closure |

The local assessment summary is not a standalone printable Compliance Report or seventh F05 report. Canonical sources have no official NIST mappings; future validated mapping/evidence requirements need approved data, not guessed relationships. Real governance requires Laravel session/tenant/role/field authorization, private evidence lifecycle, membership/invitation/revocation, provider product/API verification, immutable audit, persistence/versioning and delivery. **STOP AFTER F06. DO NOT BEGIN F07. WAIT FOR REVIEW AND APPROVAL.**

---

# Historical F05 Reporting Center

## F05 delivered development scope — 2026-11-20

F04 approval authorizes F05; earlier stop/status statements below are historical, not current directives. Reports now has six purpose-built local experiences: Executive, Cybersecurity, Backup & Recovery, Dark Web Monitoring, Security Awareness Training and Phishing Simulations. `/reports` and its three original tabs remain; six discoverable `/reports/{report}` destinations provide configuration, actual preview, report-only browser print/Save as PDF, supported safe example CSVs and non-saving schedule review. No backend/PHP/auth/provider/persistence/history/email/server-PDF operation was added.

Report sources reuse canonical services/normalizers and F02c/F02d metrics. Aggregate totals and examples remain separate. Every section retains source/scope/fictional/metric/period limitations. Configuration validates required/optional sections, title, presentation and current scope; summary/detail/example choices affect actual output. Schedule validation supports weekly weekday, monthly/quarterly day1–28, time, supplied zones and reserved unique fictional recipients. No schedule is saved, activated, emailed or delivered.

Automated suite: 806/806 PASS (776 unchanged baseline +30 F05). Executed TypeScript PASS; ESLint PASS; separate reporting tests30/30 PASS; final full suite806/806 PASS with zero failures/skips/cancellations. Actual Next.js15.5.28 production compilation PASS on a bounded reduced-filesystem-concurrency retry after temporary EAGAIN errors on unchanged routes. No source/config workaround was added. Final compilation is repeated after documentation updates; generated BUILD_ID is included in delivery evidence. `docs/phase-f05-browser-qa-handoff.md` defines 126 report cases, 21 library cases and print/PDF/CSV/scope stress acceptance. **Browser QA NOT RUN; actual print/PDF files NOT visually inspected.** Earlier browser-QA gates stay open. Development verification is not WCAG conformance, provider acceptance or production readiness. GitHub sync/Vercel deployment NOT VERIFIED.

### Remaining milestones

| Milestone | Scope | Current status |
|---|---|---|
| F06 | Compliance frameworks/controls, assessments, evidence previews, administration settings/access governance, integration information, notifications and auditability | NOT STARTED; await F05 review and approval |
| F07 | Shared application experiences, authentication UI states, notifications, preferences and Help | Not advanced |
| F08 | Final frontend audit, executed browser/print/PDF acceptance, regressions and developer handoff | Not advanced; all earlier browser gates retained |

Future real reporting still requires Laravel auth/tenant/role enforcement, provider provenance, authorized sensitive-field aggregation, configuration/history/private-file persistence, generation/download permissions, recurrence processing, recipient authorization, email delivery, audit, retention and safe errors. See updated action inventory; none is implemented by local preview controls.

**STOP AFTER F05. DO NOT BEGIN F06 OR LARAVEL DEVELOPMENT. WAIT FOR REVIEW AND APPROVAL.**

---

# Historical F04 Remediation R1

## F04 development closeout — stop for review

2026-11-20. Customers and Users & Devices implementation is delivered for nonpersistent fictional demonstration; R1 completes documentation, route verification and developer acceptance handoff. No working frontend was rebuilt, no confirmed P0/P1 source regression was found, and no source or existing test was changed in R1. Final recommendation is gated on the final verification entry below. Development PASS is not browser acceptance, provider acceptance or production readiness.

Actual route families: `/customers`, `/customers/[id]`, `/customers/onboarding`, `/users-devices`, `/users-devices/users`, `/users-devices/devices`. Valid profile examples are `/customers/1`, `/customers/2`, `/customers/3`; they require explicitly matching selected Demo scope. All or incompatible selection shows a scope requirement rather than auto-selecting a customer. Settings is inline on the matching profile; identity/endpoint details are native explorer dialogs, not separate routes. Onboarding is available only in Demo All, deliberately not under a selected existing customer.

Customers: canonical portfolio, supported availability filter, bounded case-insensitive search, name/ID stable sorting, reset/results/resource states, explicit shared customer selection, full profile navigation. Profiles show organization/technology/security/backup/user-device summaries from canonical hooks/normalizers, all requested module links, reporting and integration limitations. Onboarding implements organization/contact/reporting-areas/environment/review with validation, Next/Back/Edit/local confirmation/Cancel/Reset. Settings implements validated label/time-zone/review-cadence/report-area edits with review/Edit/local confirmation/Cancel/Reset. No creation, tenant, agreement, invitation, saved preference or active schedule is claimed.

Users & Devices: existing overview and Dashboard anchors preserved; canonical users/devices totals All 146/83, A 62/35, B 48/27, C 36/21. Separate explorers reuse exactly six canonical identities and six endpoints, two/customer/resource. Supported scoped customer/visibility filters, validated-text search, deterministic copying label/customer/ID sorting, reset/results/empty/no-match/error/retry, native details and security/backup module navigation. Samples do not calculate aggregate inventories; no missing employee/device metadata or relationships are fabricated. Planned roles are not real authentication or authorization.

Shared providers/registry remain single source. Live hides fictional rows/metrics/previews before Demo reads. Registry membership/replacement, mode/customer/kind/retry envelopes, cancellation and keyed ready subtrees prevent incompatible detail/filter/draft persistence. Route IDs do not establish authority. No backend, PHP, Supabase/persistence, real customer data or provider operation was introduced.

R1 executed verification: `npm run typecheck` PASS; `npm run lint` PASS; `npm test` 776/776 PASS (746 unchanged F01–F03 baseline + 30 F04); separate focused Customers/Users & Devices/scope/Live-Demo/Dashboard/Backup contracts 144/144 PASS, included in the full suite. Actual `npm run build` invokes Next.js 15.5.28 `next build` and PASSed on a bounded retry after a temporary EAGAIN readdir error in the unchanged External Footprint route; no source fix was required. Final production verification is repeated after these documentation evidence updates, with the resulting actual BUILD_ID in the delivery report. No build success is inferred from a typecheck. Full sources/docs are retained; GitHub synchronization and Vercel deployment NOT VERIFIED, no Git/deployment operation performed.

Updated closeout documents: `docs/frontend-functionality-gap-register.md` (feature-by-feature source/interactions/tests/browser/backend/defects), this roadmap, `docs/frontend-backend-action-contracts.md` (future authenticated action/ownership/validation/audit/privacy/error/dependency inventory). Created `docs/phase-f04-browser-qa-handoff.md` with actual six route families/eight concrete addresses, 168 base route/width/context cases plus 14 matched A/C profiles = minimum 182; all browser cases NOT RUN. Historical screenshots do not verify F04.

### Remaining F04 acceptance, separated from integration

- Confirmed unresolved P0/P1 frontend source defects: none identified in the source/automated audit; not a blanket browser correctness claim.
- Browser acceptance: NOT RUN; developer must execute handoff covering forms, filtering/details, scope races, keyboard/focus/contrast/overflow, mobile navigation and Back/Forward. Source/native HTML semantics do not establish WCAG compliance.
- Backend dependencies: real auth/tenant permissions, organization/contacts/services/invitations/membership, complete inventories, authoritative provider observations/relationships, persistent configuration, private caches/audit and reporting/output. These remain absent by design, not fake frontend successes.

### Remaining milestones — not advanced

| Milestone | Remaining scope | Status |
|---|---|---|
| F05 | Reports, report configuration, previews, output and scheduling UI; honest scope/source/unavailable states, separately authorized future integrations | NOT STARTED; recommend only after F04 review/approval |
| F06 | Compliance and Administration, permissions/limitations and safe local interactions within approved scope | Not advanced by R1 |
| F07 | Shared application experiences, account interfaces, notifications and preferences; no real authentication absent explicit authorization | Not advanced by R1 |
| F08 | Complete frontend audit, executed browser acceptance, regression evidence and developer handoff | Not advanced; browser/backend acceptance remains open |

Preserve original F01 residual gaps and all earlier unverified browser/backend capabilities. Earlier sections below are historical milestone records; their stop/next instructions and “F04 not started” descriptions are superseded by this approved F04/R1 work only. **STOP AFTER F04 REMEDIATION R1. DO NOT BEGIN F05, Laravel or real customer integration. WAIT FOR REVIEW AND APPROVAL.**

## Historical completion checkpoints

## Delivered F03 — Backup & Recovery, stop for review

Implemented /backup, /backup/assets, /backup/jobs and /backup/recovery using canonical Backup services/normalizers, existing root shell/providers and already-correct nested sidebar matching. Overview connects protected summary, scoped freshness explanations, precise execution-outcome definitions and filtered example navigation, original sample previews with individual inspections, Recovery Information and existing Reports. Both explorers provide bounded trimmed case-insensitive search, schema-supported status filters, stable name/customer/status sorting, reset/result counts, native details and all loading/error/retry/empty/no-match/Live-unavailable states.

No fixtures were added or changed. Canonical protected assets reconcile 18+27+16=61; freshness distributions equal protected assets in each scope; outcomes reconcile 19+27+17=63 executions and category-by-category [48,3,5,7]. Six asset and six job examples (two/customer) are independent. Actual example outcomes are 3 successful, 2 partial, 1 degraded and no not-available example. No sample freshness field or asset/job relationship exists, so drilldowns explain summary categories and independent views rather than invent associations/history. No date filters, operational metadata, coverage percentages, recovery points or successful restore records were fabricated.

Recovery Information delivers capability/backup-vs-restore explanations, seven unmarked readiness questions, seven intended read-only process steps, honest external-support-channel guidance and existing PortalHelp, provider limitations and reporting requirements. “Restore operations are not available in Quantum Shield Command.” stays prominent. No executable recovery workflow, support request, approval, readiness score or restore promise. /reports opens the existing general Reports page; users may select the existing Backup & Recovery Report there. Configuration/export belongs to F05, not this milestone.

Live returns before requests and exposes no fictional rows/names/metrics/details. Current registry/membership checks, synchronous mode/scope/retry/registry gates, cancellation and ready-only keyed content clear stale details and filters. Legacy preview hooks and shared summary hook are strengthened without altering baseline tests; sample normalizers reject unknown/revoked scopes even with empty responses while preserving safe error wording. These are presentation controls, not tenant authorization.

F03 DEVELOPMENT PASS: TypeScript PASS, ESLint PASS, 746/746 automated tests PASS (727 unchanged baseline + 19 focused). Production build PASS on retry after temporary EAGAIN filesystem errors; 25 pages generated and the query-aware jobs route is dynamic. Final build is repeated after documentation updates, with final BUILD_ID in the delivery report. Initial full regression exposed two baseline conflicts, corrected without weakening tests. Browser QA NOT RUN; the explicit 84 route/width/context handoff plus keyboard/mobile/context/error/regression checks remains open. Source semantics do not establish rendered accessibility, browser acceptance or production readiness.

F05 requirements: authorized separate protected inventory/summary, freshness and execution bases, verified history and relationships, source/availability/freshness, recovery-point/test evidence only if independently supported, role-redacted metadata, reporting/export audit and no fictional successful restore inference. Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup access/authentication/metric/history/restore capabilities remain unverified; Laravel/provider integration is paused.

STOP AFTER F03. F04 has NOT STARTED. Exact next recommendation: F04 — Customers and Users & Devices, only after review and approval; complete portfolio management previews, profiles/onboarding/settings, user/device inventories/details/filtering and developer contracts without real operations. Preserve F05 Reports and Export/Configuration, F06 Compliance and Administration, F07 Shared Application Experiences, F08 Full Frontend Acceptance and Developer Handoff, and original F01 residual gaps. Earlier stop/next-batch records below are historical and superseded by approved F03 scope only.


## Delivered F02d — stop for review; not browser or production acceptance

Both Awareness Training and Phishing Simulations have distinct complete Demo experiences at /security/awareness-training and /security/phishing-simulations. Delivered: program overviews, campaign explorer/details, training assignments/participation/completion/course catalog/details, simulation outcome explorer/results/training opportunities/inert scenario details, and validated local configuration draft/preview/confirm/edit/cancel/reset. All nine Security hub links are active; canonical controls/statuses, six baseline capability definitions, three historical milestones, Dashboard and existing module sources remain unchanged.

Each program has six campaigns, nine synthetic participants and eighteen same-customer campaign-participant records; training has six descriptive courses and simulation five inert scenarios. All training completion is 6/18 = 33.3%; simulation delivered = 12/18, click = 6/12 = 50%, report = 6/12 = 50%, including overlap. These are fictional record-instance metrics, not employee coverage, safety or Dashboard totals. Zero denominators are Not applicable. Strict response/relationship normalization and Live/context/cancellation/registry/retry gates protect presentation. Ready-only unmount clears details/filters/drafts. Preview validation rejects malformed fields, wrong customer/participant scope and duplicate topic assignments. No real operation, persistence, provider or auth integration.

F02d DEVELOPMENT PASS: TypeScript PASS, ESLint PASS, 727/727 tests PASS (701 unchanged baseline + 26 focused), production build PASS on retry after temporary filesystem EAGAIN errors; 22 static pages. Final production verification is repeated after documentation edits. Browser QA NOT RUN: mandatory 42 route/width/context combinations plus detail/forms/focus/mobile/navigation/error/context coverage are specified there. Source contracts do not prove rendered acceptance. Future server permissions, identity mapping, LMS/phishing provider support, scheduling/delivery/tracking/evidence/audit/notifications remain BACKEND-DEPENDENT. Three completion documents now cover delivered behavior, metrics, file inventory, safety/verification and future action contracts.

F05 reporting additions: authorized scoped campaign/content/assignment/progress and outcome-record aggregates, exact eligible/delivered denominators, overlap definitions, source/freshness/availability, privacy-preserving participant presentation and honest missing delivery/evidence/history. Existing Reports has no dedicated training/simulation report, export, trend or provider data; no report completion is claimed.

Historical F02d stop/next-batch recommendation was superseded by the approved F03 delivery above. F04 Customers & Users/Devices, F05 Reports, F06 Compliance & Administration, F07 Shared experiences and F08 final acceptance/handoff remain unchanged; retain original F01 gaps and outstanding browser/backend acceptance. Earlier checkpoint statements below are historical and superseded only for delivered F02d capabilities.


## Delivered F02c — stop for review, not browser acceptance

Dedicated /security/dark-web now includes derived fictional overview and severity/category/review summaries, findings search and combined filters/sorting/reset, meaningful account and reserved-domain relationship sections, unified finding/account/domain investigations with linked back navigation, informational recommendations and validated nonpersistent Demo review form/preview/edit/cancel/reset. Security hub presents Dark Web as active; only the two F02d modules remain visually planned. Existing Reports and ITDR destinations are linked accurately, without a dedicated Dark Web report or verified identity match claim.

Six fictional findings (two per Demo Customer A/B/C) link three fictional exposure accounts and reserved domains through one strict normalized combined service. Exact schemas, enums/markers/authoring dates, IDs and forward/reverse cross-customer relationships are checked before presentation. Canonical F02a/F02b metrics/fixtures/normalizers/controls remain unchanged. Live never requests the Dark Web fixture and has no fictional rows, counts, account/domain names or draft forms. Loading/error/retry/empty/no-match/unavailable are distinct. Cancellation, current registry and mode/customer/retry-envelope gates invalidate stale data; keyed ready content unmounts filters/details/review drafts. No provider/backend/persistence/auth code or dependency was added.

The API configuration review removed unsupported VITE_API_BASE_URL fallback; Next-supported public build configuration/default remains, unused by mocks. This was an unsupported-config defect, not an evidenced malicious outbound destination. Runtime regression verifies default/public value/Vite ignored behavior. No public variable may carry a secret.

F02c DEVELOPMENT PASS. Verification: TypeScript PASS, ESLint PASS, 701/701 tests PASS (640 unchanged baseline + 61 focused), production build PASS on retry after a temporary EAGAIN filesystem error; 20 static pages. Final build will be rerun after document edits, with final BUILD_ID in the closing report. Browser NOT RUN. Browser acceptance remains the explicit 21 width/context matrix in the gap register, covering all six views plus controls/focus/long labels/context switches/direct routes/BackForward and prior-module regressions. No browser or screenshot evidence is claimed.

Historical F02c was delivered as automatically verified development UI, not rendered browser acceptance or real integration. Its stop/next-batch instruction was superseded by the approved F02d assignment and delivery above. F03–F08 remain unchanged below. Laravel/provider integrations are paused. Real monitoring, evidence, persistent review/audit/alerts/domain enrollment and Dark Web report composition remain backend-dependent.

F05 reporting addition: scoped finding/account/domain associations; category/severity and simulated-versus-real review state; recommendations and unavailable evidence/freshness disclosures. Reporting must not fabricate historical trends, scan outcomes, monitored-domain coverage or compromise counts. Existing Reports does not currently consume the Dark Web dataset.

## Delivered F02b (development; browser acceptance outstanding)

Six dedicated routes: /security/mdr, /security/itdr, /security/external-footprint, /security/email-protection, /security/endpoint-security, /security/cloud-data-protection. At the F02b checkpoint the directory linked six and listed three pending capabilities; F02c above promotes Dark Web and leaves two pending. Existing nested sidebar active matching/root providers preserve customer/mode navigation.

All six provide capability-specific context, overview, limitations, search/supported filters/deterministic sorting/reset, every-example native detail, Reports/back navigation and loading/error/retry/empty/no-match/Live-unavailable. MDR also links full Detection Explorer. Canonical detection/identity/endpoint services and normalizers reused unchanged; three new strict fictional resources in src/mocks. All=6 and A/B/C=2 each; sample rows never calculate Dashboard aggregates or operational monitoring status. Nine controls unchanged.

Scope/mode/capability/retry changes invalidate details; cancellation/context and current registry gates prevent stale/wrong-scope records. Live clears examples and performs no fixture read. No provider or privileged operations added. Strict tests: 640/640 PASS (617 baseline + 23 focused), TypeScript and ESLint PASS. Final production build/BUILD_ID recorded in completion report. Browser NOT RUN; 126 minimum responsive combinations plus keyboard/detail/Back/Forward/scope tests are developer acceptance requirements in the register.

Historical F02b next steps were F02c then F02d; F02c above is now delivered for development review. F03 Backup & Recovery; F04 Customers & Users/Devices; F05 Reports; F06 Compliance & Administration; F07 Shared experiences; F08 final frontend acceptance and handoff. Historical stop-after-F02b instruction has been superseded by the approved F02c assignment. The current stop boundary is F03; wait for review.

F02a delivered explicit Dashboard navigation, /security/detections with scoped search/severity/sort/detail/retry and /security/insights reusing validated insight presentation. Canonical metrics/examples unchanged; no provider/action APIs added. Native dialog and render-key invalidation implemented; browser QA remains NOT RUN. Original F02a investigation scope is complete for existing fields only; service-specific detail remains future work.

F02a and F02b are delivered development implementations. F02c/F02d were subsequently delivered, and F03 is now delivered above for review. F04–F08 remain below; do not start F04 in this assignment.

Laravel implementation paused. Batches deliver working frontend workflows, not new documentation-only phases. F01 shipped Help and shared scope/label corrections; F02a implementation is now delivered as recorded above. Gap IDs and F02a status changes are in frontend-functionality-gap-register.md. All batches retain existing root customer/mode providers, validators, read-only Live unavailable state and existing regression suite. No package/theme replacement needed.

## Shared interaction architecture

Navigation uses Next Link for destinations and native buttons for local changes. Static cards are not disguised actions; add explicit labelled detail links/buttons where a workflow exists. Reuse existing Tailwind focus styles and native HTML. PortalHelp currently uses native dialog.showModal/close: browser handles top-layer focus containment, Escape and modal background isolation. Future detail consumers may extract a shared dialog only when actually used by both, with labelled title/description, close/cancel, focus restoration, bounded scroll and nested-dialog policy tested. Do not add unused global UI wrappers.

Search/filter/sort act on validated scoped records, never on aggregate totals. Each explorer has explicit label, clear/reset, result count, empty match and loading/error/retry. Scope/mode change resets selection/filter draft as defined per workflow; hide mismatched details during render, not merely after an effect. Hooks continue envelope gating and cancellation. State remains owned by the relevant screen; no new global customer provider or mutable singleton.

Demo draft changes are nonpersistent, scoped to customer and mode, visibly simulated. Separate edit/preview screens; validation, cancel restores original draft, confirmation names the simulated action. No save/invite/delivery success claim. Backend-required actions show capability-specific unavailable explanations, not inert unexplained buttons. Native loading/errors remain resource-specific; extract common presentation only when concrete consumers need it. No direct fetch/provider call in components.

## F02a — Dashboard and Security explorer foundation (first recommended batch)

Deliver explicit metric → scoped inventory links, severity → filtered detection navigation, coverage/insight detail, scoped customer overview links. Build detection search/severity/status/sort and investigation detail with related reporting navigation. Add actual retry to record/error paths. Reuse asset-summary, SS/SC/IN/BH hooks, DetectionFeed and existing fictional detections, not new aggregate calculators. New screens: detection explorer/detail plus insight/control detail consumers. Validate local filters/route parameters and selected IDs; unknown record fails closed. Tests: filtering/sorting/no-match/reset, scope/rapid-mode mismatch, keyboard semantics, matching links, retry behavior. No remediation, provider API or manufactured totals. Acceptance: every advertised action navigates or changes visible content; detail closes/reset on scope changes; Live contains no examples.

## F02b — Security service detail experiences

Deliver dedicated read-only details for MDR, ITDR, External Footprint Scan, Email Protection, Endpoint Security and Cloud Data Protection. Awareness Training and Phishing Simulations are delivered in F02d with the same safety requirements. Generic detections/identities/endpoints are reusable observations, not evidence these services ran. Reuse canonical SECURITY_CONTROLS keys and SC status explanations; add a service navigation surface with honest capability limitations. For each service: purpose, available scoped observations, status interpretation, related account/endpoint/report links, error/empty/unavailable and safe recommended guidance. Only add new fictional resources when genuinely needed, in src/mocks with Laravel-shaped nested relationships through services. No scans/campaign sends/policy changes, invented rates, licenses or verified agent claims. Tests validate category navigation, no conflation of coverage with scan/outcomes and no live action. F02b development delivery: all six assigned categories have meaningful explorers/details, not badge-only duplication. Rendered browser acceptance is outstanding; the three historical remaining capabilities were subsequently implemented in F02c/F02d as described above.

## F02c — Dedicated Dark Web Monitoring (P1, mandatory)

Deliver Security → Dark Web Monitoring overview, exposure summary/severity, findings explorer (search, severity/type/status filters, stable sorting/reset), synthetic affected-account/domain views, investigation detail and related Security/Reports links. Define route and service/type seam, fictional Laravel-shaped resource src/mocks/dark-web-findings.ts, and service-only access. Use reserved example domains/synthetic identities and clearly labelled created_at demonstration metadata, never breach dates or passwords. Keep SC dark_web_monitoring status independent of findings and monitoring assertions.

Required screens: overview/explorer/detail/account/domain visibility, loading/error/retry/no-match/empty/Live-unavailable. Existing providers only. Test All/A/B/C, invalid/revoked registry IDs, wrong-scope response, rapid switching and open detail → Live removal. Test all filters/sort/search/detail/reset/report navigation. Approved F02c review disposition/note form now provides a validated nonpersistent proposed preview, edit/cancel/reset and explicit no-save/no-remediation disclosure; live dismissal/remediation remains unavailable. Backend integration questions remain unverified, no guessed Guardz endpoints/fields. Acceptance: complete locally meaningful workflow with no live findings or scan/evidence claims.

## F02d — Security Awareness Training and Phishing Simulations

Deliver category navigation, meaningful read-only service details and explicitly fictional preview workflows only where approved. Reuse canonical coverage keys, service-detail patterns introduced by F02b and the existing scope providers. No campaigns are sent, no completed-training rates or historical simulation results invented. Validate local configuration drafts/cancel/reset; tests must distinguish fictional previews from verified provider capabilities and immediately clear them in Live. Browser accessibility/responsive checks required before acceptance.

## F03 — Backup & Recovery

Deliver protected-asset explorer/search/filter/sort/detail and job explorer/outcome filters/detail; explain execution periods/bases and freshness nulls. Reuse BA/BJ services, hooks, BackupSectionFrame/StateMessage, BH and recovery guidance. New screens: asset/job details and recovery-information read-only view, not restore operations. Add record retry. Validate selected scoped IDs, enums and missing records. Tests: filters/no-match/reset/ordering, outcome descriptions, summaries never derived from samples, immediate Live clear. Acceptance: assets/jobs navigable with useful details, unavailable recovery capability remains honest. Restore operations are not available in Quantum Shield Command.

## F04 — Customers and Users & Devices

Deliver portfolio search/filter/sort; complete customer profile layout and related scope-aware navigation; separate user/device explorers/details and observation context. Reuse CustomersPortfolio detail/back/links, CO/C, AS and V. New screens: profile and inventory details; optional explicitly simulated onboarding/settings preview only with approved fictional resource/service. No actual customer creation/persistence, role grant, agent IDs/licenses fabricated. Validation: profile draft required fields, reserved examples, cancel/reset, selected IDs/route filters. Tests: customer detail links retain shared scope, invalid ID rejected, list filters do not mutate scope, separate asset categories. Acceptance: real local explorer/detail interactions, not summary-only inventory.

## F05 — Reports

Deliver labelled local report configuration/preview and real print output if supported; reuse three ReportsWorkspace choices and existing authorized source composition. New screens: configuration/print-friendly preview plus honest history/scheduling unavailable/empty views. No fabricated historical records or scheduled success. Print artifact must visibly identify Demo scope/source and limitations, carry no arbitrary assumed dates, and never leak hidden other-customer data. Validation: bounded preview options, available resource selection, cancellation. Tests: view selection, configuration changes actual preview, mode/scope reset, unavailable data not zero, printable disclosure retained. Browser print/PDF QA required before acceptance; no claim export works based on source alone.

## F06 — Compliance and Administration

Deliver reference-framework/control detail, validated fictional assessment draft and preview/progress measured as draft completion (not compliance score); evidence preparation/metadata interface with no actual upload/storage. Reuse NIST functions, SC, evidence categories and existing disclaimers. Administration: separate organization/settings preview, proposed permission matrix and role-preview screen; integration configuration explanatory screen and honest audit empty/detail layout when authorized data eventually exists. No real secret entry, grants, audit history, certification, MFA or privileged operational action. Tests: form errors/cancel/confirmed simulated change/scope reset, matrix never permission authority, evidence never verified from draft. Acceptance: meaningful local workflows plus explicit backend unavailable screens, no fake operational success.

## F07 — Shared application experiences and authentication UI states

Deliver notifications empty/unavailable inbox shell, preferences preview, context help improvements, authenticated/guest/expired/denied/backend-unavailable presentation designs without fake login state. Only implement real auth adapter when executable reviewed backend exists. Reuse Help native modal and sidebar patterns. Validate sidebar storage-denied behavior, mobile background focus, dialog focus restoration and route-change handling; fix based on evidence. Define draft lifetime/reset and safe confirmation patterns with real consumers. No sensitive browser persistence. Tests: guest/denied/error distinct, Demo never auth, preferences explicitly local and no privilege mutation. Acceptance: no unexplained dead-end header controls, truthful account availability, coherent keyboard flows.

## F08 — Final frontend acceptance and integration handoff

Close all register rows or explicitly approve deferred backend capabilities. Run full contracts/type/lint/build, complete browser responsive/keyboard/screen-reader/contrast/print matrices, inspect console/network and real verified deployed revision. Reconcile every service TODO/request/response with integration contracts and pending provider capabilities. Preserve existing QA docs; record actual screenshots only in permitted environment. Approved favicon and GitHub/Vercel sync verification required. Production remains gated by executable authentication/tenant authorization/provider validation/security testing, regardless of frontend completion.

Acceptance record per batch: owner/revision/build/date, features delivered, exact tests, browser NOT RUN or evidence, defects, deferred backend functions and approval. Do not mark a module complete merely because it renders. Stop after F02b for approval; F02c not started.
