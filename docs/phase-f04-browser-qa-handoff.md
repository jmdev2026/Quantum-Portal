# F04 Remediation R1 — browser acceptance handoff

Date: 2026-11-20. Product: Quantum Shield Command / Quantum Shield IT.

**Browser QA: NOT RUN.** No browser or screenshot tool is available in this environment. All boxes below are unexecuted developer acceptance checks; source contracts, unit assertions and a production build do not establish rendered accessibility or production readiness. Historical screenshots in docs/screenshots predate F04 and are not F04 evidence.

## Actual routes and matrix

Six implemented App Router route families: `/customers`, `/customers/[id]`, `/customers/onboarding`, `/users-devices`, `/users-devices/users`, `/users-devices/devices`.

Settings Preview is inline within a matching `/customers/[id]` profile. User/device details are native dialogs within the respective explorers. They are not separate routes; do not invent `/customers/settings`, `/users-devices/users/[id]` or `/users-devices/devices/[id]`.

Execute each concrete route below at **320, 375, 768, 1024, 1280, 1440 and 1920px**, in **Live / All Customers**, **Demo / All Customers** and **Demo / Customer B**. Each row has 21 route/width/context cases, all currently NOT RUN.

| Actual concrete route | Live / All | Demo / All | Demo / Customer B | Cases |
|---|---|---|---|---:|
| `/customers` | Unavailable, no fictional records | Searchable canonical three-customer portfolio | Only B detail and full-profile link | 21 |
| `/customers/1` | Unavailable | Explicit matching-scope requirement; no A profile revealed | Scope mismatch; no A details | 21 |
| `/customers/2` | Unavailable | Explicit matching-scope requirement | B profile, summaries and Settings Preview | 21 |
| `/customers/3` | Unavailable | Explicit matching-scope requirement; no C profile revealed | Scope mismatch; no C details | 21 |
| `/customers/onboarding` | Unavailable; no form | Complete local prospective-organization wizard | Explicit All Customers requirement; no draft | 21 |
| `/users-devices` | Unavailable metrics and observations | 146 users / 83 devices; six observations/resource | 48 users / 27 devices; two observations/resource | 21 |
| `/users-devices/users` | Unavailable; no fictional detail | Six canonical identity observations | Two B identity observations | 21 |
| `/users-devices/devices` | Unavailable; no fictional detail | Six canonical endpoint observations | Two B endpoint observations | 21 |

**Required base matrix: 8 concrete routes × 7 widths × 3 contexts = 168 cases.** Counting only route families would give 126, but that omits the independent A/C profile entries; 168 is the selected acceptance matrix, not an executed count.

Supplementary matched-profile coverage: `/customers/1` in Demo / Customer A at all seven widths, and `/customers/3` in Demo / Customer C at all seven widths: **14 additional cases**, minimum **182 cases** including supplements. Details and settings expand cases within these routes, not route count. Invalid routes, reloads, error injection and keyboard checks below are additional, not included in 182.

## Portfolio and profile checks

- [ ] In Demo All, verify exactly canonical A/B/C, no duplicated registry entries; search with spaces and mixed case, no-match feedback, reset, name A–Z/Z–A and ID sort.
- [ ] Availability filter uses supported normalized reporting states only. “Demo data present” is not a healthy/protected/connected claim; no unsupported service-health filter.
- [ ] Counts describe currently scoped reporting records. Search/filter/sort do not mutate registry or shared summaries.
- [ ] View customer explicitly changes the shared selection. Open full customer profile navigates to the matching numeric route. Back to all customers is an explicit selection action, not a hidden invalid-scope fallback.
- [ ] Inspect Organization Overview, Technology, Security, Backup, Users & Devices, Settings Preview, Reports and integration limitations for each matching customer.
- [ ] Metrics: A 62 users / 35 devices; B 48 / 27; C 36 / 21; All 146 / 83. Backup protected summaries A/B/C 18/27/16 and All 61 remain separate from device totals and examples.
- [ ] Security and backup summaries use normalized canonical values, distinguish unavailable/stale/null from zero, and do not infer real protection or restoration.
- [ ] Follow Security, MDR, ITDR, Endpoint Security, Dark Web, Backup Overview/Assets/Jobs/Recovery, Users & Devices and Reports links. The shared selection remains unchanged; links do not create associations, reports or exports.
- [ ] Direct `/customers/1` while B is selected shows mismatch, never A’s profile. Direct profiles under All request explicit matching scope, not automatic selection.
- [ ] Direct invalid IDs `/customers/0`, `/customers/-1`, `/customers/999`, `/customers/not-a-customer`, `/customers/1.5`, `/customers/01`, and an unsafe-size numeric ID fail closed. `/customers/onboarding` is the static wizard route, not parsed as an ID.
- [ ] Fresh reload defaults to Live. After switching to Demo, explicitly select a matching customer before profile inspection; no claim that a route ID establishes authorization.

## Onboarding preview

- [ ] Start only in Demo All. Steps: organization, fictional primary contact, supported reporting areas, technology environment, review.
- [ ] Organization requires a Demo-prefixed fictional label (12–80 characters); contact label 10–80; only reserved `demo.example.com`, `demo.example.net`, `demo.example.org` contact domains; no whitespace/malformed addresses, links, numeric identifiers or credential-like notes.
- [ ] Supported reporting areas are nonempty and unique. Environment is Cloud-first/Hybrid/On-premises. Optional notes, if supplied, require Demo-prefixed 12–200-character fictional text.
- [ ] Empty and invalid Next submissions stay on the same step and focus an announced error. Back retains local input; review Edit returns to the selected step. Confirmation revalidates every step.
- [ ] Confirm only acknowledges inspecting a local draft. Exact notice remains: “Demonstration only. No customer account, tenant, service agreement or invitation has been created.”
- [ ] Reset clears all inputs/confirmation. Cancel returns to portfolio; leaving/returning, changing scope or Demo→Live→Demo does not resurrect the draft. B scope displays All requirement rather than a retained wizard.
- [ ] No registry append, saved tenant, service agreement, invitation, network write or persistent storage occurs. Do not enter real contact details to test the preview.

## Customer Settings Preview

- [ ] On a matching profile, open the inline preview; editable fictional review label, allowed time zone, weekly/monthly/quarterly cadence and supported report areas are meaningful proposed preferences, not active schedules.
- [ ] Reject invalid/short/long/unsafe labels, unsupported selections, duplicate or empty report areas. Review contains customer and proposed values.
- [ ] Review/Edit/Confirm/Reset/Cancel behave coherently; cancel restores the opener, invalid submission focuses error, preview transitions focus the local heading.
- [ ] Exact “Configuration preview — not saved” remains visible. Confirmation never claims a saved schedule, changed service, enabled permission or provider connection.
- [ ] Switching customer, registry replacement, mode changes, route departure or retrying profile reporting removes incompatible preview state.

## User and device explorers/details

- [ ] Both explorers reuse six canonical observations/resource, two/customer; none are complete inventories or mapped real people/devices.
- [ ] Search validated labels/customer/observation/visibility/source with trimming and case-insensitivity. Search length is bounded to 200.
- [ ] In All, customer filtering stays within visible scope; reported-visibility filter appears only when multiple supplied values exist. No invented MFA, OS, risk, owner, patch, agent or last-seen filter.
- [ ] Label ascending/descending and customer-then-ID sorting are deterministic and nonmutating. Combined filters, reset, result counts, empty and no-match feedback work.
- [ ] Every observation opens a labelled/described native dialog with canonical name, customer, observation, visibility and source only. Filtering/reset clears detail selection.
- [ ] User links: ITDR, Dark Web, Security, Awareness Training, Phishing Simulations. Device links: Endpoint Security, MDR, Detections, Backup Assets, Backup Jobs. Links open modules, not invented record associations.
- [ ] No email/MFA/license/sign-in/group/password/compromise metadata is fabricated. No OS/IP/MAC/serial/agent/last-seen/owner/patch/health metadata is fabricated. Endpoint and backup samples are not equated.
- [ ] Planned role explanations are informational; no role assignment, account/device/permission/license/agent/backup management control executes anything.

## Keyboard, responsive and context stress checks

- [ ] Tab/Shift-Tab through navigation, form fields, checkboxes, filters and all detail triggers; no keyboard dead ends; visible focus in every state.
- [ ] Native dialog containment, Escape and Close work; focus returns to connected opener or the page heading. Scroll within 85dvh dialog at mobile widths; no horizontal overflow.
- [ ] Labels, fieldsets, headings, captions, row headings, status/error announcements and current-route/current-step semantics are announced coherently with a screen reader.
- [ ] Dark/green/amber/error text has readable contrast, including disabled/hover/focus states. Check reduced motion, 200% zoom, long validated record labels and long customer/visibility/observation text using controlled fixtures accepted by validators, never bypass normalization to manufacture UI success.
- [ ] Mobile sidebar navigation and header/customer selector remain reachable at 320/375px; desktop tables and mobile cards do not duplicate accessible content.
- [ ] Rapid All→A→B→C→All, Demo→Live→Demo, registry replacement/revocation/error and repeated retry with slow/out-of-order responses clear detail/filter/draft state synchronously. No cross-customer leakage or invalid-scope All fallback.
- [ ] Direct entry, browser Back/Forward, route departure/return and reload never resurrect incompatible drafts or imply persistent settings.
- [ ] Inject loading/error/retry/valid-empty/malformed/wrong-scope responses in a controlled developer harness. Unavailable is not zero; errors do not silently fall back to Demo.
- [ ] Preserve Dashboard anchors `/users-devices#user-account-visibility-title` and `/users-devices#device-endpoint-visibility-title`, and regress Dashboard, all Security modules, Backup, Reports, Compliance, Administration and shared header/sidebar.

## Evidence and release gate

Developer should record route, width, mode/customer, browser/version, scenario, expected/actual result, PASS/FAIL, defect severity and screenshot/keyboard evidence for each executed case. Leave NOT RUN for unexecuted cases. Authenticate/authorize actual data only in a separately approved backend phase; this checklist does not authorize provider or tenant operations.

R1 automated/source evidence is recorded in the three completion documents and final delivery report. GitHub synchronization and Vercel deployment are NOT VERIFIED. Development PASS, if all automated/doc gates pass, is not browser acceptance or production readiness. STOP AFTER F04 R1; F05 requires review and approval.
