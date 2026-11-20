# Project memory

## Product intent & audience

- **Quantum Portal**: MSP-facing web portal for managing a customer portfolio across cybersecurity, backup, identity, and endpoint services.
- Audience: MSP administrators and client administrators; role-dependent visibility (tenant-scoped).
- Frontend build only on Next.js; backend is Laravel (not implemented in this phase — no auth, no real data).

## Brand personality & voice

- Professional, enterprise-grade, production-worthy; avoid cookie-cutter UI.
- Clarity over decoration; preview/demo states must be honestly labeled.

## Visual design & UX direction

- Tailwind CSS, JSX, Lucide React icons; `@/` path alias maps to `src/`.
- Customer-scoped nested routes with scope validation and fail-closed behavior on invalid/wrong-scope access.
- Detail dialogs, keyboard interaction, focus restoration, mobile nav, no horizontal overflow.
- Demo Mode (fictional/sample data) vs Live Mode separation is enforced; never mix aggregate counts with example records.
- Accessibility and responsive behavior are required deliverables.

## Decisions, constraints & rationale

- **No real customer/user/device data**; no fake privileged write actions; no persistence of onboarding/settings.
- Onboarding and Settings are local, validated, non-saving previews only.
- Users & Devices are observation explorers reusing existing canonical identity/endpoint records — not full inventories; no duplicate registries.
- Referenced providers (Guardz, M365, SentinelOne, Datto) are documented as future contracts; their fields are not invented.
- Cross-provider identity/device identifier resolution deferred to developers.
- Documentation trio maintained: `frontend-functionality-gap-register.md`, `frontend-completion-roadmap.md`, `frontend-backend-action-contracts.md`.
- Roadmap milestones: F04 (Customers, Users & Devices — partial/paused), F05 (Reports), F06 (Compliance/Admin), F07 (Shared app experiences/auth UI), F08 (Final acceptance).
- Current status: 776 tests pass, TypeScript + ESLint + production build pass; browser QA NOT RUN (prohibited). F04 partial — final docs/report deferred.

## Open questions & assumptions

- Upcoming user specifications referenced but not yet provided; current scope inferred from F04 task list.
- Browser QA must be performed by developer; cannot be automated here.
- Real API contracts, tenant authorization, audit logging, and privileged writes are future work (F06/F08).
- F05 not started; awaiting review/approval of F04.