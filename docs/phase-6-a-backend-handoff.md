# Phase 6-A backend handoff — Master Prompt 020/050

## Status separation

IMPLEMENTED: existing eight-module frontend, service normalizers, Demo fixture paths, shared display scope/mode and tests. Prompt 020 adds five architecture documents only; no executable authentication/authorization, network transport, PHP, tables or provider integrations.

DESIGNED: domain-dependent auth topology, default-deny membership/permission policy, denial/envelope semantics, threat mitigations and backend acceptance plan.

PROPOSED: Laravel 13, managed PostgreSQL recommendation, logical entities, initial role capabilities and versioned Quantum Shield APIs.

NOT VERIFIED: production domains/host/database, Composer/dependencies/extensions, actual Laravel environment, providers, GitHub/Vercel revision synchronization, browser QA and production security. PHP CLI 8.4.28 was observed, Composer absent on PATH, no accessible composer.json/root artisan.

## Source reviewed / reusable seams

package.json, app route/layout/navigation source, customer/mode providers and registry from earlier integration review; current api.ts conventions, dashboard-response.ts scope guards, security-coverage.ts and backup-health.ts types/service paths; docs/phase-5-final-integration-handoff.md and laravel-backend-preflight.md. Existing source inventory covers dashboard-assets, security-severity, security-coverage, insights, customer-overview, backup-health, detection/visibility/backup-example services and their consumers. Exact resource/validator/fixture mappings are in backend-api-contracts.md; earlier preflight remains preserved, not replaced.

Shared root providers keep Demo independent of real authentication; refresh starts Live. Live still returns unavailable mock reporting, not actual API calls. Scope validation is structural/display integrity only, not backend authorization. Existing rejected scope must not broaden to All. Numeric fixture IDs are not production tenants.

## Deliverables and decisions

- backend-architecture.md: responsibilities, verified environment, deployment requirements, conceptual entities, data protection and decision register.
- backend-auth-tenant-policy.md: session lifecycle, module role matrix, server policy sequence, revocation, failure states and threat/test table.
- backend-api-contracts.md: actual source mappings, proposed v1 routes, scope/identity adapter decision, envelopes/errors and provider questions.
- backend-implementation-plan.md: ordered infrastructure/auth/tenant/API/provider milestones and Prompt 021 prerequisites.

Laravel 13 recommended for new backend after compatibility verification against PHP/runtime extensions and Composer lock. No existing framework was upgraded. Preferred first-party Sanctum sessions require controlled related frontend/API domains; unrelated vercel.app domains need topology resolution or reviewed BFF. Secure HttpOnly cookies, HTTPS, CSRF, rotation, logout invalidation, expiry/revocation, MFA/recovery and rate limiting require executable backend tests.

User/tenant/membership/grant/connection/secret-reference/audit entities are conceptual only. All portfolio access is explicitly granted MSP assigned-tenants aggregation; client roles cannot obtain it. Default deny, revoked membership denied and tenant-constrained nested query/cache rules mandatory. API roles and IDs from browser never authoritative.

Provider capability verification must resolve Guardz access/auth/organization mapping/metrics/records/controls/pagination/freshness/errors/limits and Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup API/account/inventory/job/freshness/recovery/permissions/errors/limits. All requests and credentials server-side; encrypted secrets or managed references, least privilege and tenant-account validation. No restore is promised.

## Verification and security limits

Frontend permitted checks are executed and results reported in completion response. PHP/Laravel tests NOT RUN: no Laravel application/test setup or PHP changes. Browser QA NOT RUN: environment remains restricted. Threat table and backend tests are future requirements, not current security results. Source review does not prove production authorization.

No packages installed, no fixtures/modules changed, no secret/client records added. No commit/push/deployment claimed: Git metadata absent; Vercel unverified. Approved favicon still missing. Preserve all Phase 4/5 QA docs including detailed responsive matrices. Their completion, production security testing and real backend/provider validation remain release blockers.

## Backend developer acceptance

Owner: ____ Date: ____ Repository/revision: ____ Environment: ____ PHP/Composer/Laravel: ____ DB: ____
Auth topology/domain decision: ____ Frontend source/build tested: ____ Backend revision/tests: ____

- [ ] PASS [ ] FAIL [ ] NOT TESTED — Repository/runtime/dependencies/extensions and test infrastructure verified.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Deployment domains, TLS, CORS/CSRF and session/BFF topology approved.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Database, opaque tenant IDs, secret/key/backup ownership chosen.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Role/module grants, MSP portfolio boundaries and revocation approved.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — API identity adapter/envelopes/error semantics reconciled with frontend.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Auth/session/MFA/recovery tests executable before customer APIs.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Tenant/IDOR/cache/audit/abuse/security tests executable before real data.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Provider capability questions resolved before integrations.
- [ ] PASS [ ] FAIL [ ] NOT TESTED — Browser/deployed revision/security release gates remain separately tracked.

Unresolved decisions: actual domain topology; Composer-capable repository; production PHP/extensions/dependencies; DB host/version; opaque ID adaptation; session lifetimes/MFA/recovery; audited grant workflow; audit retention; provider capabilities and hosting source verification. Do not treat this checklist as executed.

Prompt 021 requires approved architecture and verified backend runtime. This handoff completes design preparation only, not Phase 6. Stop after Prompt 020; await approval.
