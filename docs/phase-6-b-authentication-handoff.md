# Prompt 021 / 050 — Phase 6-B authentication execution handoff

## Decision: BACKEND IMPLEMENTATION BLOCKED

No executable authentication is delivered. This record is a targeted bootstrap handoff, not a replacement architecture. Approved Prompt 020 documents remain unchanged.

### Environment evidence — 2026-11-19

- PHP CLI 8.4.28 present; satisfies recommended Laravel 13 language floor of PHP 8.3, not full framework/runtime compatibility.
- Composer, phpunit and pest not found on PATH. Combined discovery exits unsuccessfully because tooling is absent; this is not a backend test failure.
- No composer.json, artisan, phpunit.xml or phpunit.xml.dist discovered in accessible project files. No existing Laravel version/application, authenticated routes, migrations or dependency lock exists here.
- PHP has PDO but no PDO database drivers in the module list; pdo_sqlite/sqlite3 not loaded. No isolated Laravel testing database can currently run.
- curl, mbstring, DOM and XML extensions absent from loaded module list. Framework and PHPUnit extension requirements must be installed/verified in the authorized backend environment, not bypassed through Composer ignore-platform flags.
- No approved separate backend workspace/repository is accessible. This is the Next.js frontend workspace, not permission to place a half-installed backend inside it.
- Production domain topology, backend host and database remain undecided. Git metadata unavailable; no deployment/repository synchronization verified.
- The listed frontend .env.example was absent on direct read. No secret file was inspected or changed to compensate; backend configuration belongs in its future repository.

## Status ledger

| Area | Status | Actual outcome |
|---|---|---|
| Existing frontend | IMPLEMENTED | Eight existing modules, shared display scope/mode and resource validators preserved |
| Frontend automated checks | TESTED separately | Completion report supplies actual counts/build results |
| Laravel bootstrap/dependencies | BLOCKED | Composer/runtime extensions/workspace missing |
| Login/logout/current principal | NOT STARTED | No routes or implementation created |
| Session/CSRF/rate limiting | DESIGNED, NOT IMPLEMENTED | Requirements below; no protection claim |
| Tenant/roles/customer APIs | NOT STARTED | No grants, privileged accounts or data APIs enabled |
| MFA/recovery/reset delivery | NOT STARTED | Privileged access remains prohibited until reviewed implementation |
| Frontend authentication adapter | NOT STARTED | No tested backend contract; Live remains unavailable |
| Backend tests/migrations | NOT RUN | Zero backend tests executed; not a passing zero-test suite |
| Backend deployment | NOT STARTED | No Laravel production application claimed |

## Exact bootstrap handoff for an authorized backend developer

These commands are NOT executed here and are NOT instructions for the app owner to run. Use a verified separate development environment/repository, never this frontend root. Do not start any local server in this agent environment.

1. Supply approved backend repository/location, Composer 2, PHP 8.3+ with supported framework/testing extensions and isolated SQLite/PDO SQLite or a dedicated supported test DB. Validate target production PHP, dependencies, web server document root, HTTPS, storage permissions, secret management and rollback ownership.
2. Verify tools: `php --version`, `php -m`, `php --ri pdo_sqlite`, `composer --version`. Verify missing curl/mbstring/XML/DOM and all dependency-specific requirements before proceeding. Do not use `--ignore-platform-reqs`.
3. If a Laravel repository exists, inspect its composer.json/lock and run `composer install`; do not create a duplicate or upgrade it automatically. Otherwise, in the approved parent workspace only, bootstrap with `composer create-project laravel/laravel quantum-shield-backend "^13.0"` and inspect its scripts/default files before configuration changes. No production credentials or seeded administrators.
4. Inside that backend repository, run `composer validate --strict` and `composer check-platform-reqs`. Preserve its standard Laravel structure and framework auth/session conventions. The installer may create a local key or SQLite file; neither represents production configuration or approved customer data.
5. Create separate local and test configuration; preserve secret exclusions. Generate a development APP_KEY with `php artisan key:generate` in that backend only; never display or commit the resulting key. Provide backend .env.example names with safe placeholders, not actual credentials: APP_ENV=local, APP_DEBUG=true (production false), APP_KEY blank, APP_URL=<approved local origin>, DB_CONNECTION=sqlite, DB_DATABASE=<isolated absolute database path>, SESSION_DRIVER=database, SESSION_SECURE_COOKIE=true for HTTPS, SESSION_HTTP_ONLY=true, SESSION_SAME_SITE=lax. Leave production cookie domain/topology blank pending approval. Audit actual Laravel version config keys before applying.
6. Configure isolated test database explicitly. SQLite in-memory may suit feature tests; cookie/session persistence tests may need an isolated file and HTTPS test harness. Never migrate against an unverified database. Inspect stock migrations; only reviewed user/session authentication structures are needed now, no customer/membership seeding.
7. After confirming testing connection, run `php artisan migrate --env=testing`, `php artisan about --env=testing`, `php artisan test`. These bootstrap checks are prerequisites, not proof authentication is implemented. Add/run reviewed auth feature tests described below; capture exact totals/failures.
8. If reviewed same-registrable-domain SPA topology is chosen, install Sanctum using supported Laravel `php artisan install:api` in the backend, inspect generated routes and expose no customer API. Do not set wildcard credentialed CORS or broad stateful domains. If topology remains undecided, build only independently testable server session auth; browser integration stays blocked.

Reference installation/version documentation: https://laravel.com/docs/13.x/installation and https://laravel.com/docs/13.x/releases. Sanctum topology reference: https://laravel.com/framework/docs/sanctum.

## Authentication work required after bootstrap (not current routes)

Use supported Laravel credential validation/session auth. Proposed login/logout/current-principal paths must be reviewed against backend-api-contracts.md; no route exists today. Disable self-registration, invitations and reset-email delivery. Test-only fictional user factories must never become production seeders.

Requirements: safe generic invalid-credential response; session regeneration on successful login; server logout invalidation and CSRF token regeneration; secure expiry/revocation; Secure/HttpOnly session cookie for HTTPS; reviewed SameSite and narrow domain; native CSRF protection for cookie-authenticated state changes; no credentials/session identifiers in logs. Exact frontend/API domains unresolved. Do not issue browser localStorage tokens or fake logged-in Boolean state.

Initial proposed rate policy for review: bounded attempts per normalized account identity plus request-source limits, temporary throttling and consistent generic responses with safe Retry-After. Select/test numeric limits in the real backend; no production traffic requirement is invented here. Audit safe authentication outcomes without passwords/session tokens and avoid account enumeration/permanent attacker-induced lockout.

Current-principal proposal: successful `{ data: { id, name, authentication_status: 'authenticated' }, meta: { request_id } }` with minimal approved fields; no password hash/session ID/tenant list/privileged role default. 401 unauthenticated or expired; 403 denied operation; 503 unavailable. Do not infer expired versus absent session without trustworthy server evidence. A valid session grants no customer access. Future resource routes need authentication + tenant membership + permission + validated response scope, and remain disabled until Prompt 022 enforcement.

## Required backend test evidence — NONE executed here

1. Anonymous principal/protected test request denied without customer data.
2. Valid isolated test credentials establish supported session; invalid password denied generically.
3. Login rotates session ID; principal excludes secrets/customer/privileged grants.
4. Logout invalidates previous session; logged-out/expired sessions denied.
5. CSRF enforced for cookie state changes; Laravel tests often disable middleware, so explicitly enable appropriate CSRF checks or use real HTTP integration tests. Do not count disabled middleware as CSRF coverage.
6. Login rate limiting/failure consistency tested with controlled clock/cache; no enumeration.
7. No public self-registration endpoint, no superuser/default role, no customer endpoints or data.
8. HTTPS cookie flags, origin restrictions, safe errors/logging, configuration and revocation tested.

Tests use isolated database and fictional factories only. Composer validation, boot checks, migrations, auth/session/guard/throttle/configuration tests all NOT RUN in this workspace. No PHP files added.

## Frontend preservation and inspected seams

Reviewed approved architecture/auth/API/implementation/handoff/preflight records from Prompt 020, plus current src/services/api.ts, root layout, DashboardModeProvider and customer-view-state reducer. Layout continues owning one shared provider pair, reload starts Live and invalid/removed customer remains -1 rather than All. Existing Live services still return unavailable reporting; no network adapter added. Existing normalizers remain unchanged. No auth token persistence, provider call or customer privilege introduced.

Exact change: created docs/phase-6-b-authentication-handoff.md only. No source, dependencies, fixtures, existing docs or repository configuration modified. Frontend regression results supplied in final report. Browser QA NOT RUN; preserve Phase 4/5 backlog and approved favicon task. GitHub push/commit and Vercel/backend deployment not performed or claimed.

## Prompt 022 prerequisites / acceptance

Prompt 021 authentication implementation gate is unmet. Do not proceed to tenant rollout merely because this handoff exists.

- [ ] Approved separate repository/workspace and compatible Composer/PHP/extensions/test database available.
- [ ] Executable Laravel bootstrap, locked dependencies, safe config and boot checks completed.
- [ ] Tested login/logout/principal/expiry/CSRF/throttle/default-deny foundation implemented.
- [ ] Exact test totals/evidence and secret-free failure/configuration review recorded.
- [ ] Browser topology approved or browser-facing integration explicitly deferred.
- [ ] Membership/role/opaque tenant identifier design approved for Prompt 022; no current customer API access.
- [ ] MFA/recovery work tracked before privileged access; production security/browser/deployment gates remain open.

Developer: ____ Date: ____ Backend revision: ____ Runtime/DB: ____ Test totals: ____ Decision: ____

Stop after Prompt 021/050. Recommendation: BACKEND IMPLEMENTATION BLOCKED; frontend-only handoff and regression preservation do not qualify as full authentication DEVELOPMENT PASS.
