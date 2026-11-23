# Production readiness gates — 2026-11-23

The application is **not production ready**. Each gate is independent; passing one does not imply another.

| Gate | Status | Evidence | Exit criteria |
| --- | --- | --- | --- |
| 1. Frontend development | PASS (pending owner review) | Typecheck, lint, 892/892 tests, production build — see F08 report | Owner accepts F08 |
| 2. Browser acceptance | NOT RUN | `final-frontend-browser-acceptance.md` | All P0 and P1 rows PASS with evidence |
| 3. Branding | BLOCKED | No logo, favicon or app icons exist in the project | Owner supplies approved assets (below) |
| 4. Support contact | BLOCKED | No verified support email, phone or URL exists; the UI shows a neutral "contact your administrator" fallback | Owner supplies verified contact details |
| 5. Backend security | NOT STARTED | `backend-auth-tenant-policy.md`, `phase-6-b-authentication-handoff.md` | Laravel Sanctum auth, tenant authorization, rate limiting, audit, security review |
| 6. Integrations | NOT STARTED | `final-frontend-developer-handoff.md` provider section | Guardz and Datto/Kaseya connected server-side with verified documentation |
| 7. Deployment | NOT VERIFIED | Project folder is not a Git repository; no Vercel evidence | Source pushed, deployment built from that revision, BUILD_ID matched |

## Branding assets required (owner action)

| File | Format | Location | Notes |
| --- | --- | --- | --- |
| Primary logo | SVG (plus PNG fallback 512 px) | `public/brand/logo.svg` | Light-on-dark variant for the charcoal sidebar |
| Logo mark | SVG, square | `public/brand/mark.svg` | Collapsed sidebar and small spaces |
| Favicon | ICO (16/32/48) | `src/app/favicon.ico` | Next.js picks it up automatically |
| App icon | PNG 512×512 | `src/app/icon.png` | Browser/app icon |
| Apple touch icon | PNG 180×180 | `src/app/apple-icon.png` | iOS home screen |
| Social preview (optional) | PNG 1200×630 | `src/app/opengraph-image.png` | Link previews |

Each asset needs written owner approval before use. Until then the brand stays as the shield icon plus the "Quantum Shield" text.

## Deployment sync steps (when a repository exists)

1. Initialize or connect the repository and commit the current source.
2. Push to the branch Vercel builds from.
3. Confirm the Vercel build log shows the same commit.
4. Compare the deployed BUILD_ID with a local build of that commit.
5. Run the browser acceptance list against the deployed URL.
