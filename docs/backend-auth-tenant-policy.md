# Authentication and tenant policy — DESIGNED, not enforced

## Principal and authentication

Authenticated User is a human account, Tenant is an isolated organization, Membership is an explicitly granted user/tenant relationship, Role is a set of separately granted capabilities. An MSP operator may span assigned tenants; that does not grant every tenant. Demo mode/customer IDs are unrelated to production identity. No login/UI authentication is implemented in Prompt 020.

Preferred approved-domain topology uses native Laravel sessions with Sanctum first-party SPA authentication. Framework password hashing/verification only; no custom crypto. Regenerate session ID after successful authentication and privilege changes. Logout invalidates server session and regenerates CSRF token; frontend discards sensitive responses. Define server-authoritative idle/absolute expiry, revocation and concurrent-session policy before implementation. No auth bearer tokens in localStorage. Secure HttpOnly cookies for session, HTTPS, appropriate SameSite and CSRF protection; exact domain/origin details depend on architecture decision.

Use Laravel authentication mechanisms and policies, not frontend Boolean/role checks. Rate limit login/recovery by sensible account and request-source controls; avoid permanent attacker-triggered lockout. Use progressive delay/temporary lockout, safe generic credential errors and abuse monitoring. MFA required for privileged access; select tested framework-compatible implementation, enrollment/step-up/recovery process and protected recovery codes. Reset credentials through established expiring single-use tokens, with safe error messages, rate limits, session-revocation decisions and event logging. Session duration, MFA factor and recovery staffing remain decisions, not guessed production policy.

## Proposed module permission matrix

All entries require authenticated principal, active membership and explicit capability; none are currently granted. “Read” means authorized reporting only, not provider configuration or account mutation.

| Module | MSP Administrator | Client Administrator | Client Viewer |
|---|---|---|---|
| Dashboard | Read assigned tenants; portfolio requires additional aggregate permission | Own tenant read | Own tenant read |
| Security | Assigned-tenant read | Own tenant read | Own tenant read |
| Backup | Assigned-tenant reporting, no restore | Own tenant reporting, no restore | Own tenant reporting, no restore |
| Customers | Assigned tenant directory; explicitly permitted portfolio | Own tenant context | Own tenant context |
| Users & Devices | Assigned-tenant visibility | Own tenant visibility | Own tenant visibility |
| Reports | Compose authorized resources only | Own tenant reports | Own tenant reports |
| Compliance | Authorized signals, not certification | Own tenant signals | Own tenant signals |
| Administration | Planning visible; future management requires separate explicit grants | Planning visible; future own-tenant management separately approved | Planning only; no management |

No proposed role implies secret access, unrestricted portfolio, restore, licensing or provider mutation. Management permissions must be designed/tested separately before any action exists.

## Request policy sequence

1. Authenticate server session; reject missing/expired session with 401, never data.
2. Validate route/request identifiers; malformed scope 422. Never treat invalid/omitted ID as All.
3. Resolve resource with tenant-constrained access and principal’s active memberships; unknown or concealed unauthorized resources return safe 404, without existence leaks.
4. Check per-resource capability. 403 when permission disclosure is appropriate.
5. Explicit portfolio endpoint requires MSP aggregate capability and computes the authorized tenant set server-side. Client users cannot invoke it; empty assignment is denied, not an unrestricted query.
6. Query/cache/provider mapping is constrained to authorized tenants. Compare nested resource tenant against parent. Bind principal/scope consistently through all layers.
7. Check membership changes/revocation authoritatively; do not trust a stale frontend list or long-lived role cache. Define permission version invalidation and safe transaction semantics; immediate revocation is a requirement.
8. Validate outbound resource before returning minimal data; log safe correlation/outcome. No unscoped fallback queries.

All Customers is not a bypass flag. Current frontend all scope is a demonstration display semantic; production portfolio needs a reviewed adapter and explicit server-authorized scope identity. Frontend parseScope validates structure, not membership or permission; retain rejected (-1) UI scope and do not use it as a backend resource ID.

## Auth/failure presentation contract

Future states: not_authenticated; authenticated_authorized for an explicitly granted operation; insufficient_permissions; session_expired; backend_unavailable; request_failed. Backend reachability or Demo mode never establishes authentication. Authenticated principal does not imply all operations are authorized.

401 clears sensitive visibility and triggers safe authentication-required/expired presentation; 403 shows denied operation; 404 safe unavailable/not-found; 422 validation error; 429 rate-limited with bounded retry; 503 backend/integration unavailable. None normalize into successful empty reporting or Demo fallback. Loading is local only. Existing normalizers consume successful resource responses, so future service transport must branch on HTTP/auth outcomes before normalization; no transport added here.

## Threat model and required executable backend tests

| Risk | Proposed mitigation | Required test (NOT RUN) |
|---|---|---|
| Cross-tenant exposure / IDOR | Membership policy plus tenant-constrained parent/nested queries | Client A requests B IDs, nested record IDs and guessed paths; no data/existence leak |
| Unauthorized portfolio | Separate aggregate capability; assigned set only | Client All request denied; MSP subset cannot retrieve other tenants; malformed ID never All |
| Session theft/fixation | TLS, Secure/HttpOnly cookie, rotation, expiry and revocation | Session ID rotates on login; expired/logged-out/revoked sessions rejected |
| CSRF | Framework CSRF and verified stateful origin config | Missing/invalid CSRF denied on cookie state changes, trusted request succeeds |
| Credential leakage | Server vault/encryption; minimal resources and safe errors | Bundle/response/log scan contains no credentials; rotation/revocation tested |
| Frontend privilege spoofing | Server principal/permission source only | Forged role/header/customer values grant nothing |
| Provider account mix-up | Verified tenant/account mapping | Adapter cannot fetch tenant B via A connection or cache |
| Unvalidated payload | Schema/enum/semantics validation before storage/return | Wrong tenant/count/basis/timestamp/provider shape rejected, never zero |
| Sensitive caching | No-store; tenant/principal scope plus grant-version keying | Shared cache/CDN cannot serve A to B; revoked user cannot reuse cache |
| Insufficient auditability | Server-attributed append-only audit pathway | Auth and privileged grant/config events attributed with tenant/outcome; secret-free errors |

Additional acceptance: anonymous requests no customer data; logout invalidation; invalid tenant, revoked membership and unassigned MSP tenant denied; viewer mutations denied; client administrator cannot cross tenant or read secrets; rate limits enforced without account enumeration; failure never Demo; unavailable distinct from zero; sanitized auth errors; audit readers tenant/permission scoped. Future privileged MSP actions explicitly bounded and logged. These are future tests, not current frontend results.

Sources: https://laravel.com/framework/docs/sanctum
https://laravel.com/docs/13.x/authentication
https://laravel.com/docs/13.x/authorization
