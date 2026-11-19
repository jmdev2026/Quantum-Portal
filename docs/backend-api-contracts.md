# API contract foundation — proposed, no endpoints implemented

## Existing resource inventory

All source files below are under src/services. Demo fixtures are under src/demo with corresponding names unless stated. Scope is `{ type: 'all' }` or `{ type: 'customer', customer_id: number }` for current summary resources; future tenant identity reconciliation is required. Types/normalizers remain the authoritative current contract; this proposal does not modify them.

| Resource / service | Current normalized result / validation | Demo source / UI states | Future API and authorization |
|---|---|---|---|
| Asset Summary / dashboard-assets.ts | Per-key counts/status; normalizeAssetSummary/Metric validate scope, safe counts and timestamps | dashboard-assets; loading/error/ready/empty/unavailable/stale as supported per metric | Independently validate summary; tenant reporting or permitted portfolio |
| Security Severity / security-severity.ts | Total and four severity counts; scope/source/status and breakdown consistency | security-severity; loading/error/ready/stale/empty/unavailable | Independently validate reported aggregates; tenant or portfolio |
| Security Coverage / security-coverage.ts | CoverageScore percentage/basis, keyed control statuses; range, enums, duplicates, scope, timestamp | security-coverage; loading/error/ready/stale/empty/unavailable | Independently validate score semantics/control signals; tenant or portfolio |
| Insights / insights.ts | Bounded records, hiddenCount; enums/text limits/IDs/source/scope/time | insights; loading/error/ready/stale/empty/unavailable | Independently validate and paginate; permitted tenant |
| Threats / security-detections.ts | Scoped bounded Demo detections; record/text/status validation | security-detections; gated Demo examples and unavailable Live | New production adapter/contract required; tenant only initially |
| Identities / security-visibility-records.ts | Scoped bounded visibility examples; ID/relationship/text/state validation | security-identities via visibility-records; loading/error/empty/ready/unavailable | Independent production identity contract; tenant only |
| Endpoints / security-visibility-records.ts | Scoped bounded endpoint examples, no inferred protection from count | security-endpoints via visibility-records; same gated record states | Independent production endpoint contract; tenant only |
| Backup Health / backup-health.ts | protectedAssets, five freshness buckets, four outcomes with period/basis; counts/time/scope consistency | backup-health; loading/error/ready/stale/empty/unavailable | Independently validate asset/execution semantics; tenant or portfolio |
| Backup Assets / backup-assets.ts | Bounded Demo records/text/IDs/customer/scope; unverified protection label | backup-assets; Demo examples with loading/error/empty, unavailable Live | New production visibility contract required; tenant only |
| Backup Job Activity / backup-job-activity.ts | Bounded job examples; IDs/text/outcome/scope/time | backup-job-activity; gated examples, unavailable Live | New production activity contract required; tenant only |
| Customer Overview / customer-overview.ts | Customer reporting availability, validated statuses/names/source/time/scope | customer-overview; loading/error/ready/stale/empty/unavailable | Membership-filtered directory/availability, never global unscoped query |
| Reports / existing summary services | Composition through dashboard hooks and report panels, not independent metrics | Same sources; existing loading/error/unavailable presentation | No duplicate reporting API initially; authorization inherited per resource |
| Compliance / security-coverage.ts | Existing control signals plus static NIST reference; no compliance determination | security-coverage and educational references | No assessment API proposed; authorized signals only |
| Administration / none | Static planning plus shared scope; no operational records | No Demo admin registry/logs | No privileged APIs proposed |

Customers registry currently src/mocks/customers.ts via services/customers.ts; getCustomers returns fictional IDs with pagination meta. Future authorized-customer list must replace it only through reviewed integration; production identifiers cannot reuse Demo identity assumptions.

Shared dashboard-response.ts parses scope, timestamps and counts; resource validators require appropriate source and historical timing. Existing hooks choose Demo/unavailable Live sources, gate response mode/customer and cancel obsolete effects. Future transport outcomes must be checked before invoking these normalizers. Empty validated list is not auth denial or missing capability.

## Minimal versioned routes — Quantum Shield proposals, NOT provider endpoints

Proposed read-only API, all JSON, HTTPS, private no-store. No actual host chosen.

| METHOD path | Purpose / policy |
|---|---|
| GET /api/v1/session | Minimal principal/session expiry and permitted capability context; 401 for no valid session |
| GET /api/v1/customers | Active authorized memberships only; paginated minimal tenant identity |
| GET /api/v1/customers/{tenant}/asset-summary | Authorized tenant asset totals |
| GET /api/v1/customers/{tenant}/security/severity | Reported severity aggregate |
| GET /api/v1/customers/{tenant}/security/coverage | Verified coverage semantics and signals |
| GET /api/v1/customers/{tenant}/security/insights | Authorized insights |
| GET /api/v1/customers/{tenant}/security/detections | Validated production visibility, capability conditional |
| GET /api/v1/customers/{tenant}/security/identities | Conditional identity visibility |
| GET /api/v1/customers/{tenant}/security/endpoints | Conditional endpoint visibility |
| GET /api/v1/customers/{tenant}/backup/health | Protected assets/freshness/outcomes |
| GET /api/v1/customers/{tenant}/backup/assets | Conditional asset visibility |
| GET /api/v1/customers/{tenant}/backup/jobs | Conditional activity visibility |
| GET /api/v1/portfolio/{resource} | Allowlisted asset-summary/security-severity/security-coverage/insights/backup-health/customer-overview summaries ONLY with MSP aggregation capability |

No arbitrary resource passthrough, provider URL parameter or omitted-tenant portfolio inference. Validate opaque tenant ID format then membership; query parameters limited to reviewed pagination/filter allowlists. Session login/logout/CSRF exchange stays a separately reviewed framework auth boundary, not an implemented v1 endpoint. Existing unversioned TODO routes are earlier proposals; reconcile rather than implement both naming systems.

## Response proposal / adapter decision

Success: `{ data: <existing reviewed resource>, meta: { request_id: <opaque correlation>, authorized_scope: <server tenant or portfolio identity> } }`. Customer resource data retains scope/status/source and nullable values; list resources include validated pagination metadata. Tenant identity comes from server policy, never request echo alone. Correlation identifier is opaque, not a secret or historical activity record.

Portfolio authorized_scope includes explicit portfolio semantics/permission revision sufficient for isolation; browser need not receive all internal grants. The existing numeric customer_id contract cannot directly represent arbitrary opaque production tenant identifiers. Decide a versioned adapter/internal mapping versus type evolution before enabling Live requests. Do not coerce UUIDs into Demo numbers or weaken sameScope. Both authoritative identity and requested scope must match in transport/normalization.

Authorized empty: HTTP 200, validated scoped resource status empty/list data [], source semantics appropriate; never fabricated zero summary. A zero count is supplied only when authoritatively measured. Provider capability unavailable: HTTP 503 with safe unavailable error; future transport maps to unavailable presentation, not successful empty. Partial reporting can be HTTP 200 only with authorized resource/metric unavailable markers and null missing values, independently validated.

Errors: `{ error: { code: <allowlisted code>, message: <safe public text> }, meta: { request_id: <opaque> } }`; 422 may include safe field-validation errors. No customer data, secrets, stack traces, provider bodies or private connection details.

| HTTP | Proposed code / frontend disposition |
|---|---|
|401|authentication_required or session_expired; clear sensitive visibility; no normalizer success path |
|403|permission_denied; authenticated but denied operation |
|404|not_found; intentionally safe/concealed resource absence |
|422|validation_failed; invalid scope/input, never broaden to All |
|429|rate_limited; honor bounded server Retry-After, no infinite retries |
|503|backend_unavailable / integration_unavailable; no Demo/zero fallback |
|other/network|request_failed or backend_unavailable when unreachable; never authenticated by assumption |

Loading is exclusively local. Successful session identity does not imply authorized every resource. Error messages do not reveal whether another tenant exists. Backend must enforce membership before resource availability is queried/disclosed. Permission failures are never HTTP 200 empty data.

## Reporting semantics and provider unknowns

Users ≠ devices; sample detections ≠ security total; coverage ≠ compliance certification; devices ≠ protected assets; executions ≠ assets; successful job ≠ recoverability. Unavailable does not mean failure/zero. No computed aggregates from incomplete samples.

Guardz adapter awaits verified API access/auth, customer mapping, supported severity/controls/identity/endpoint/detection fields, pagination, freshness/errors/rate limits. Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup awaits actual API access, account identifiers, inventory/history/status/freshness, recovery visibility/permission/rate/error semantics. Do not invent endpoints/scopes or substitute SIRIS/SaaS Protection. Restore operations are not available in Quantum Shield Command.

All adapters server-only, credential encrypted or vault-referenced, tenant mapping validated, least privilege, revocation, bounded retries/circuit breaking and sanitized errors. No provider-specific contract is approved yet.
