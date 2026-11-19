# Backend architecture — Prompt 020 / Phase 6-A

Status: DESIGNED / PROPOSED. No backend protections are implemented. Existing eight-module Next.js frontend remains unchanged.

## Verified environment

Frontend Next.js 15, React 19, TypeScript and Node contract tests. PHP CLI 8.4.28 exists; Composer was not found on PATH; no composer.json or root artisan was found. No Laravel application, migrations, backend authentication or backend test tooling was discovered in this project. No backend database connection is established by application source. Tool availability is not a production runtime guarantee.

Recommend Laravel 13 for a new separately maintained backend, conditional on Composer/dependency/PHP-extension compatibility and target-host verification. Official release documentation was consulted on 2026-11-19; it recommends ^13.0 and identifies PHP 8.3 minimum. Available PHP 8.4 satisfies the language floor, not the complete runtime requirement. Do not upgrade an unseen existing backend or install infrastructure here.

## Responsibilities and flows

Next.js: accessible presentation, shared customer/mode preferences, validated response rendering, reports composition and loading/error/unavailable states. It is not the permission authority. Laravel: authentication/session lifecycle, policy enforcement, authorized tenant queries, provider normalization, audit logging, safe errors and secrets. Database: users, tenants, memberships, permission assignments, connection metadata and audit records. Provider adapters: authorized server-to-server reporting only, with verified account mappings and capabilities.

Flow: browser → authenticated Laravel boundary → principal permission check → explicit membership/portfolio scope → constrained query/cache → validated server provider adapter if necessary → minimal authorized response → existing frontend normalization. Provider failures never become zero counts. Demo builders stay a separate frontend fixture path, never a backend fallback.

## Authentication topology decision

Preferred: first-party Sanctum SPA cookie sessions when frontend and backend use controlled sibling subdomains under the same registrable domain. Actual production names are UNDECIDED; do not invent them. Laravel docs require SPA/API to share the same top-level domain (subdomains allowed). An unrelated vercel.app/frontend and backend domain is not approved for direct Sanctum SPA cookies.

If related-domain hosting cannot be arranged, evaluate a same-origin Next.js BFF before implementation: browser owns a secure HttpOnly BFF session; Next server authenticates to Laravel using a specifically designed confidential server-side credential/session exchange. No browser bearer tokens/localStorage. This is a separate security design, not a transparent insecure proxy; determine CSRF, expiry, revocation and downstream authorization before enabling it. No BFF route is added now. Native Laravel sessions underpin Sanctum; personal API tokens are not the preferred first-party SPA mechanism.

## Deployment requirements

Frontend Vercel source revision remains unverified. Backend needs separately supported PHP host/container, Composer deployment pipeline, writable restricted storage, correct public document root, configured workers/scheduler only when needed, health checks and secure database connectivity. Never place a Laravel app inside this frontend simply to satisfy the roadmap.

Require HTTPS everywhere including server-to-server calls. Exact CORS origin allowlist per environment, credentialed requests only for approved origins, no wildcard credentials. Sanctum stateful host/port list, credential inclusion, session domain and CSRF cookie behavior must be tested against chosen topology. Use Secure/HttpOnly session cookies, narrow cookie scope, appropriate SameSite and expiry; CSRF cookie is intentionally readable while session cookie is not. Preview origins must not gain production tenant access by broad wildcard.

Separate development/staging/production accounts, keys, databases and tenant data. Backend secrets are server-only managed secrets, never NEXT_PUBLIC variables. Database not publicly reachable from browsers; least-privilege application identity and separately controlled migration identity. TLS, encrypted backups, restore drills, monitoring and rollback plan required. Verify GitHub source and deployed frontend/backend revisions independently before release.

## Proposed logical entities (not existing tables)

| Entity | Purpose / relationships | Boundary and sensitive fields | Constraints / access |
|---|---|---|---|
| User | Human principal; many memberships | Password hash, recovery/MFA material, email | Framework hashing; unique normalized identity; principal/admin-only minimal reads |
| Tenant | Organization; owns scoped resources/connections | Organization metadata, external account mapping | Production opaque identifier distinct from Demo 1/2/3; approved membership reads only |
| Membership | User ↔ tenant | Granted/revoked state and access scope | Unique relationship; revocation authoritative; no browser writes |
| Role/permission assignment | Scope-bounded grants to membership/operator | Privileged grant metadata | Default deny; controlled audited grant changes; never trust client role names |
| Integration connection | Tenant ↔ verified provider account | Mapping/configuration metadata | Unique appropriate mapping; authorized management separate from reporting |
| Credential/secret reference | Connection ↔ encrypted secret or managed vault ref | Tokens/keys/rotation data | Server integration identity only; absent from all browser resources and logs |
| Audit event | Attributed sensitive action/event | Actor, tenant, outcome and safe metadata | Append-only application pathway; restricted reads; retention/legal requirements unresolved |

Database recommendation: managed PostgreSQL for relationships, constraints and transactional revocation/grants. Existing tool-provisioned storage does not establish the Laravel production database; deployment choice remains unresolved. Alternatives: supported MySQL if operational expertise/hosting requires it, with equivalent constraints/transactions. No migrations executed. Choose runtime DB version, encryption, extensions, backup ownership and operational access before schema implementation.

## Threat boundaries and data protection

Browser IDs/roles are untrusted; provider data is external input; cross-tenant cache and account mappings are security boundaries. Tenant caches include authorized scope, membership/permission version and environment; recheck revocation before use. Sensitive API responses use Cache-Control: private, no-store and avoid shared CDN caching. No secrets or PII in public error details/correlation IDs. Encrypt sensitive storage using separately managed rotation-ready keys; minimize PII and API fields. Audit access is permission-scoped; key/backup recovery and audit retention require explicit ownership.

See backend-auth-tenant-policy.md for mitigations/tests and backend-api-contracts.md for proposed envelopes. Unresolved: deployment domains, BFF decision, database host/version, session lifetime, MFA/recovery policy, role grant workflow, provider access and audit retention. No real customer data is permitted until these are implemented and tested.

Sources: https://laravel.com/docs/13.x/releases
https://laravel.com/framework/docs/sanctum
