# Backend implementation sequence — Prompt 020 design

No operational backend is created here. Each milestone requires review before advancing. Existing normalizers and service seams are sufficient; adding parallel frontend validators or fake authentication would not materially help this assignment.

## Ordered milestones

1. **Verify infrastructure outside frontend.** Locate intended backend repository (never create a duplicate Laravel project here), supported Composer 2, PHP 8.3+ compatible with Laravel 13/dependencies, required extensions, target DB driver and backend test runtime. Verify hosting process model, build pipeline, HTTPS, operational access and backups. Available PHP 8.4 alone is insufficient.
2. **Resolve topology.** Approve controlled same-registrable-domain Sanctum SPA deployment or a separately designed confidential BFF. Record actual origins, cookie domain/scope, CORS/CSRF, local/staging separation, trusted proxy configuration and revision-verification process. No cross-domain cookie workaround.
3. **Approve database and secret model.** Managed PostgreSQL recommendation versus supported MySQL tradeoffs; versions/constraints, least-privilege identities, TLS, key management and backup restore drill. Design user/tenant/membership/grant/connection/secret-reference/audit entities. Production tenant IDs separate from fixtures. No migrations until reviewed runtime is ready.
4. **Create isolated Laravel foundation in its real repository.** Lock compatible Laravel/Sanctum dependencies and configure tests, lint/static analysis, safe errors and no-store responses. No customer endpoints exposed until auth policy tests pass. Do not force an upgrade of an existing backend.
5. **Authentication milestone.** Framework password/session mechanisms, CSRF, session rotation/logout/expiry/revocation, login/recovery rate limits, privileged MFA and safe logging. Execute cookie topology, anonymous/expired/logout and recovery tests. No real client data allowed yet.
6. **Tenant authorization milestone.** Active membership/resource policies, per-module permissions, explicit MSP assigned portfolio, revocation and tenant-aware cache rules. Tests must prove A cannot access B, nested IDOR denied, forged roles ignored, client All denied, MSP restricted to assigned set. Failures stop customer API work.
7. **Authorized customer/session APIs.** Minimal membership directory, server principal, safe no-data denial, reviewed ID adapter. Replace mock registry only after Live tests; preserve independent Demo registry behavior. No frontend auth token persistence.
8. **Authorized read-only resource contracts.** Reconcile proposed v1 routes with existing types and numeric/opaque ID decision. Test schema/scope/source/time/missing semantics and errors before network transport. Live adapter checks HTTP/auth outcomes before normalizers, supports cancellation/out-of-order isolation and never Demo fallback.
9. **Provider readiness, then integration.** Verify actual Guardz and Datto Endpoint Backup access/docs. Establish server-only tenant-account mapping, credentials, rate handling/rotation/revocation and payload validation. No unsupported data promises or restore endpoints. Provider failure stays unavailable.
10. **Auditability and production security gate.** Restrict audit access; log attributed authentication/sensitive events without secrets, test caching/CSRF/abuse/privilege boundaries. Execute browser backlog against verified frontend/backend revisions. Production security testing, approved favicon, monitoring/backups/rollback and deployment/source review precede real data access.

## Test prerequisites and stop rules

Backend unit/integration/feature tests run in a Laravel-capable environment with isolated fixtures (not real clients), supported DB transactions, test clocks and mock provider adapters. Future tests in backend-auth-tenant-policy.md are acceptance requirements, NOT executed results. No blanket test skips to declare a gate passed. Unexpected provider data is rejected, not accommodated by weakening validators.

Frontend regression remains TypeScript, ESLint, all existing 602 contracts and production build. Browser matrices remain pending; old screenshots do not verify new code. Do not expose live data because the frontend compiles. Real authentication/tenant authorization must be executable and tested, not merely documented.

## Prompt 021 entry checklist

- [ ] Approved backend repository/location and supported Composer/runtime/extensions.
- [ ] Laravel version/dependency compatibility confirmed; target host separate from frontend.
- [ ] Actual domain topology and cookie/CSRF or BFF model approved.
- [ ] Database, tenant identifier strategy and secret/key ownership decided.
- [ ] Session/MFA/recovery/revocation and permission matrix approved.
- [ ] Backend acceptance tests and isolated test database available.
- [ ] Production data withheld until auth and tenant tests pass.

If these are unresolved, Prompt 021 may safely prepare infrastructure/design but cannot claim authentication deployed. Stop after Prompt 020 and await review.
