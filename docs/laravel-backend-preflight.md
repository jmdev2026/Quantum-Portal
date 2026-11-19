# Laravel backend preflight — Prompt 019

This is an inventory of the current frontend, not the backend architecture for Prompt 020. No Laravel code, database design or provider integration is implemented here.

## Existing boundaries

`src/services/api.ts` exports API_BASE_URL from NEXT_PUBLIC_API_BASE_URL. No browser fetch/axios or provider calls were found in src during this review. Existing services return unavailable mock responses or fictional Demo responses. Replace service bodies only after authentication, authorization and response contracts are agreed; components should continue calling services/hooks, not providers directly.

| Service | Existing boundary / normalizer | Current consumers |
|---|---|---|
| customers.ts | getCustomers; CustomerListResponse | Shared customer provider/selector |
| dashboard-assets.ts | getAssetSummary / getDemoAssetSummary; normalizeAssetSummary / normalizeAssetMetric | Dashboard, Users & Devices, Reports |
| security-severity.ts | Security Severity summary and normalization | Dashboard, Security, Reports |
| security-coverage.ts | getSecurityCoverage / getDemoSecurityCoverage; normalizeSecurityCoverage | Dashboard, Security, Reports, Compliance |
| insights.ts | getInsights / getDemoInsights; normalizeInsights | Dashboard, Security, Reports |
| backup-health.ts | getBackupHealth / getDemoBackupHealth; normalizeBackupHealth | Dashboard, Backup, Reports |
| customer-overview.ts | getCustomerOverview / getDemoCustomerOverview; normalizeCustomerOverview | Dashboard and Customers |
| security-detections.ts | Demo detection service/normalizer | Security |
| security-visibility-records.ts | Demo identity/endpoint validation | Security, Users & Devices |
| backup-assets.ts | getDemoBackupAssets; normalizeDemoBackupAssets | Backup example assets |
| backup-job-activity.ts | getDemoBackupJobActivity; normalizeDemoBackupJobActivity | Backup example jobs |

Reports is composition, not a system of record. Compliance adds educational reference content; Administration has no operational requests.

## Existing proposed frontend contracts — not approved backend routes

TODO(api) comments already describe `/api/customers` and `/api/dashboard/asset-summary`, `/security-severity`, `/security-coverage`, `/insights`, `/backup-health`, `/customer-overview` under the dashboard prefix. These are Quantum Shield proposals, not Guardz/Datto endpoints. Reconcile them with Laravel before use; do not assume provider APIs resemble them.

Resources use `{ data: ... }`; the registry also has pagination meta. Dashboard resources carry requested scope and status, nullable metrics, source and optional historical synchronization information. Assets normalize per-metric status. Severity supplies four categories and a reported total. Coverage supplies percentage plus required basis and canonical keyed statuses. Insights are validated records with display limits and hiddenCount. Backup has nullable protectedAssets, freshness and jobOutcomes with period/basis. Preserve the distinction between missing data and zero.

`dashboard-response.ts` provides record/count validation, timestamp parsing/checks, parseScope and sameScope. Resource normalizers reject malformed and wrong-scope responses. Text limits, enum allowlists, duplicate checks and historical timestamp requirements vary by resource; inspect actual types before implementing real responses. Do not weaken them to accommodate unexpected provider data.

## Scope and lifecycle

DashboardScope/AssetScope: `{ type: 'all' }` or `{ type: 'customer', customer_id: number }`. Frontend CustomerView: `{ mode: 'all' }` or `{ mode: 'customer', customerId: number }`. Null customerId means explicit All in hook envelopes, not authorization. Invalid/removed selection remains rejected customer scope (-1), never silently All. Registry IDs 1/2/3 and names A/B/C are fictional only.

Shared layout owns one mode and customer provider. Reload starts Live; Demo selection is in memory and restored when returning from Live during that page session. Live presents neutral scope/null selection. Hooks gate visible responses by mode and customerId before rendering and cancel obsolete effects; backend authorization must independently enforce tenant access.

UI expects loading, error, empty, unavailable, ready and (where supported) stale states. Errors need usable messages and retry paths, never fabricated zero totals. Provider failures and permission failures must not become successful empty responses. Normalize before binding to UI.

## Required future security work

Agree authentication and session model, appropriate privileged MFA, expiration/revocation, secure token handling and CSRF protection where session cookies require it. Enforce role/permission and tenant-resource authorization server-side, including explicit permitted MSP aggregation versus client-only access. Deny unauthorized All requests; never infer authorization from a customer selector or submitted ID. Use least privilege, consistent safe errors and server-side request/response validation. Keep Demo data separate from production identities and telemetry.

Provider credentials belong on the server only; establish tenant binding, rotation/revocation, restricted scopes and failure handling. Audit sensitive actions with actor and tenant attribution without logging secrets. No current proposed role is deployed or assigned. Production security testing must cover cross-tenant access and direct API requests, not merely UI filtering.

## Provider questions — resolve before writing integration code

Guardz: What verified API access and licensing exist? Which reporting capabilities, tenant identifiers, permissions, pagination and error semantics are actually documented? Can identity/endpoint/control information and issue severity be retrieved with validated definitions? What synchronization timestamps are truly supplied? Do not assume webhook support or operational APIs.

Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup: Confirm exact product/account API access. Which protected asset, freshness, activity and outcome fields exist? Are outcomes executions or asset statuses, with what period/boundaries? Is recovery information available at all, and with what limitations? Do not substitute SIRIS/SaaS Protection or promise restore capability. Restore operations remain unavailable in Quantum Shield Command.

## Unresolved decisions / acceptance

Owner: ____ Date: ____ Source revision: ____
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Auth/session/MFA and tenant authorization design agreed.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Frontend response contracts reconciled with backend types.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Provider access/capabilities verified against actual documentation.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Missing/stale/error semantics, aggregation and reporting periods agreed.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Production data segregation, secrets and audit protections designed.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Browser QA and deployment-source verification completed separately.

Unknowns are blockers for real integration, not reasons to invent endpoints or schemas. Stop at Prompt 019; architecture work awaits Prompt 020 approval.
