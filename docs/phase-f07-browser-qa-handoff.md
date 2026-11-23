# Phase F07 — Shared Application Experience browser QA handoff

Agent browser QA: NOT RUN. The agent environment has no browser or screenshot tool. Every case below is NOT RUN and must be executed by a developer. Earlier F04, F05 and F06 handoffs remain separate and pending.

## Routes and shared controls under test

| Route / surface | Expected behavior |
| --- | --- |
| /sign-in | Authentication design preview; disabled email/password fieldset with no form or submit; access-state selector (16 states) with reset; text states selecting a state does not authenticate |
| /access-denied | Same preview opened in denied context; 401, 403, invalid scope, revoked membership and privileged-action-unavailable states are distinct |
| /account | Live: sign-in-required message only. Demo: fictional profile, membership, shared preference preview (edit/validate/preview/cancel/reset), security info, notification preferences, support |
| /notifications | Live: unavailable, no records. Demo: fictional scoped examples; search, category, local status, sort, reset, details dialog, local reviewed marker, reset; no unread count |
| /help | Ten guides with anchor navigation and related-workspace links; no support email, phone, ticket or chat |
| Unknown route (e.g. /does-not-exist) | 404 page with navigation, no stack trace |
| Route error | Error page with Retry, no error details, not described as empty data |
| Loading | Status text and skeleton; no zero values |
| Header search | Opens dialog; Ctrl/Cmd+K opens when focus is not in a field; ArrowUp/Down moves through results; Escape closes and returns focus; navigation results only |
| Header notifications / help / account | Links reach /notifications, help dialog with "Open Full Help & Support", /account; no badge count |
| Skip link | First Tab shows "Skip to content"; activating focuses portal content |
| Mobile menu | Opens below 1024px; closes on route change and Escape |

## Contexts

- L-All: Live mode, All customers
- D-All: Demo mode, All customers
- D-B: Demo mode, Demo Customer B

## Base matrix — 5 routes × 7 widths × 3 contexts = 105 cases

| Route | Width | L-All | D-All | D-B |
| --- | --- | --- | --- | --- |
| /sign-in | 320 | NOT RUN | NOT RUN | NOT RUN |
| /sign-in | 375 | NOT RUN | NOT RUN | NOT RUN |
| /sign-in | 768 | NOT RUN | NOT RUN | NOT RUN |
| /sign-in | 1024 | NOT RUN | NOT RUN | NOT RUN |
| /sign-in | 1280 | NOT RUN | NOT RUN | NOT RUN |
| /sign-in | 1440 | NOT RUN | NOT RUN | NOT RUN |
| /sign-in | 1920 | NOT RUN | NOT RUN | NOT RUN |
| /access-denied | 320 | NOT RUN | NOT RUN | NOT RUN |
| /access-denied | 375 | NOT RUN | NOT RUN | NOT RUN |
| /access-denied | 768 | NOT RUN | NOT RUN | NOT RUN |
| /access-denied | 1024 | NOT RUN | NOT RUN | NOT RUN |
| /access-denied | 1280 | NOT RUN | NOT RUN | NOT RUN |
| /access-denied | 1440 | NOT RUN | NOT RUN | NOT RUN |
| /access-denied | 1920 | NOT RUN | NOT RUN | NOT RUN |
| /account | 320 | NOT RUN | NOT RUN | NOT RUN |
| /account | 375 | NOT RUN | NOT RUN | NOT RUN |
| /account | 768 | NOT RUN | NOT RUN | NOT RUN |
| /account | 1024 | NOT RUN | NOT RUN | NOT RUN |
| /account | 1280 | NOT RUN | NOT RUN | NOT RUN |
| /account | 1440 | NOT RUN | NOT RUN | NOT RUN |
| /account | 1920 | NOT RUN | NOT RUN | NOT RUN |
| /notifications | 320 | NOT RUN | NOT RUN | NOT RUN |
| /notifications | 375 | NOT RUN | NOT RUN | NOT RUN |
| /notifications | 768 | NOT RUN | NOT RUN | NOT RUN |
| /notifications | 1024 | NOT RUN | NOT RUN | NOT RUN |
| /notifications | 1280 | NOT RUN | NOT RUN | NOT RUN |
| /notifications | 1440 | NOT RUN | NOT RUN | NOT RUN |
| /notifications | 1920 | NOT RUN | NOT RUN | NOT RUN |
| /help | 320 | NOT RUN | NOT RUN | NOT RUN |
| /help | 375 | NOT RUN | NOT RUN | NOT RUN |
| /help | 768 | NOT RUN | NOT RUN | NOT RUN |
| /help | 1024 | NOT RUN | NOT RUN | NOT RUN |
| /help | 1280 | NOT RUN | NOT RUN | NOT RUN |
| /help | 1440 | NOT RUN | NOT RUN | NOT RUN |
| /help | 1920 | NOT RUN | NOT RUN | NOT RUN |

## Supplementary cases — all NOT RUN

| ID | Case | Result |
| --- | --- | --- |
| S01 | Switch D-All → D-B on /notifications: explorer resets, only Customer B examples shown | NOT RUN |
| S02 | Switch Demo → Live on /account and /notifications: fictional content removed immediately | NOT RUN |
| S03 | Invalid or revoked scope: notifications/account fail closed, search trigger disabled, never widens to All | NOT RUN |
| S04 | Search: Escape closes, focus returns to trigger; no-match text and Clear Search | NOT RUN |
| S05 | Ctrl/Cmd+K ignored while typing in inputs, textareas, selects | NOT RUN |
| S06 | Every search result navigates to an existing page (no 404) | NOT RUN |
| S07 | Notification details dialog: Escape closes, focus returns; local reviewed marker resets | NOT RUN |
| S08 | Account preferences: invalid input shows validation; cancel and reset restore defaults; no persistence after reload | NOT RUN |
| S09 | 404 for unknown root path and unknown shared route | NOT RUN |
| S10 | Error boundary Retry recovers; no stack trace visible | NOT RUN |
| S11 | Keyboard-only traversal of header, sidebar and each route; visible focus everywhere | NOT RUN |
| S12 | Screen reader announces search result count and loading status | NOT RUN |
| S13 | 200% zoom and 320px reflow without horizontal scrolling | NOT RUN |
| S14 | Reduced motion: no sidebar or dialog animation | NOT RUN |
| S15 | Contrast check of green accents and muted text on charcoal (WCAG 2.2 AA) | NOT RUN |
| S16 | Header titles correct for all shared routes; sidebar active item unchanged for module routes | NOT RUN |

## Known gaps to record during QA

- No approved logo, favicon or app icon exists; the brand is a shield icon with text. Do not substitute an invented logo.
- No verified support email, telephone, ticketing or chat channel exists in source.
- Authentication, sessions, MFA, recovery, notifications delivery and account data are design previews only.
