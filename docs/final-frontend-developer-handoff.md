# Final frontend developer handoff — F08

Status: frontend development complete for owner review. No backend, authentication, tenant authorization, provider integration or persistence exists. Do not treat any Demo data as operational.

## Stack and commands

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, lucide-react. No other runtime dependencies.
- `npm run typecheck` · `npm run lint` · `npm test` (Node test runner, `tests/**/*.test.ts`, alias loader `tests/register-alias.mjs`) · `npm run build` · `npm start`.
- If the build fails with EAGAIN in constrained sandboxes, retry with `UV_THREADPOOL_SIZE=1`.
- Path alias `@/` → `src/`.

## Structure

| Folder | Purpose |
| --- | --- |
| `src/app` | Routes (inventory below), layout, error/loading/not-found/global-error |
| `src/components` | UI per module: dashboard, security, backup, customers, customer-workflows, users-devices, reports, governance, sidebar, shared-experience |
| `src/services` | The only data-access layer. Each function carries a `TODO(api)` marker and returns fixtures through a strict normalizer |
| `src/mocks` | Fictional Demo fixtures, Laravel API-resource shaped (`{ data, meta }`) |
| `tests/contracts` | Source and behaviour contract tests |

## Route inventory (30 page files)

`/` Dashboard · `/security` + 11 capabilities (`insights`, `detections`, `endpoint-security`, `email-protection`, `cloud-data-protection`, `dark-web`, `external-footprint`, `itdr`, `mdr`, `awareness-training`, `phishing-simulations`) · `/backup`, `/backup/assets`, `/backup/jobs`, `/backup/recovery` · `/customers`, `/customers/[id]`, `/customers/onboarding` · `/users-devices`, `/users-devices/users`, `/users-devices/devices` · `/reports`, `/reports/[report]` (7 reports) · `/compliance`, `/compliance/[section]` · `/administration`, `/administration/[section]` · `/[experience]` (account, notifications, help, sign-in preview).

## Providers, modes and scope

- `DashboardModeProvider` (default **Live**) wraps `CustomerViewProvider`. Never duplicate either provider.
- Live: every service returns an unavailable/not-connected state before reading fixtures. No fictional content appears in Live.
- Demo: fictional Customers A/B/C (ids 1/2/3) plus All. An invalid, unknown or revoked scope fails closed and never widens to All.
- Loaders use the envelope `{ selected, registry, attempt, state }` with an `active` flag so late responses for an old scope are dropped.
- `WorkflowBoundary` keys children by `${mode}:${customerId}:${profileId}` and checks the registry, so drafts, dialogs and print portals unmount on any context change.
- Only browser storage use: the sidebar collapsed flag (wrapped in try/catch). No drafts, tokens or data are stored.

## Reporting handoff

- Seven reports in `report-model.ts`: Executive, Cybersecurity, Backup, Customer, Users & Devices, Administration/Audit, and **Compliance Assessment** (Governance).
- `report-data.ts` builds each report from existing services only; Compliance uses `getGovernanceData` and `compliance-report.ts`.
- Configuration is validated by `validateConfig`; required sections come from `requiredSections` (Compliance: Cover, Framework Overview, Evidence Limitations, Methodology, Data Source & Legal).
- Print uses `window.print()` with an isolated `.report-print-root` portal. CSV uses `csvContent`: UTF-8 BOM, quoting, formula neutralization, the demo disclosure row, scoped rows only and no internal ids.
- Assessment drafts preview a local Compliance report inside the Assessment Workspace. Draft notes are never output.
- Backend: report generation, stored history, scheduling and server-side PDF are future responsibilities; contracts in `frontend-backend-action-contracts.md`.

## Authentication and authorization handoff

Reconciled with `backend-auth-tenant-policy.md` and `phase-6-b-authentication-handoff.md` (no conflicts found):

- The sign-in screen is a preview only. The real Laravel Sanctum exchange (CSRF cookie, credentials, generic errors, rate limiting, lockout, sign-out) is marked `TODO(api)`.
- Session states already rendered by the UI (expired, permission changed, access revoked) must be driven by server signals.
- Tenant scope must be enforced server-side on every request. The client scope selector is a convenience, not a security boundary.
- Privileged actions (remediation, restore, campaign sends, user changes) are disabled in the UI and must stay disabled until the backend has permissions, step-up, CSRF, audit and idempotency.

## Provider handoff

- **Guardz** (security capabilities): API access, auth model, customer mapping, field vocabulary, pagination, freshness and rate limits are unverified. No endpoints are defined.
- **Datto Endpoint Backup v2 / Kaseya 365 Endpoint Backup** (backup): API availability, entitlement, asset/job/recovery-point semantics and restore support are unverified. Do not substitute SIRIS or SaaS Protection. Restore is not offered.
- All provider calls must happen server-side in Laravel; the browser never holds provider credentials. Detailed verification lists: `backend-api-contracts.md`, `frontend-backend-action-contracts.md`.

## Known open items

Browser acceptance NOT RUN · branding assets missing · support contact unverified · no Git/Vercel evidence. See `production-readiness-gates.md`.
