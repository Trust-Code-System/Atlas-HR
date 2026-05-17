# Atlas HR - Final Pre-Launch Checklist
**Date:** 2026-05-13  
**Verdict:** NO-GO  
**Status counts:** ✅ Done: 5 | ⚠️ Pending: 43 | ❌ Blocker: 23 | 🔍 N/A: 0

## Environment Safety
| Check | Status | Evidence |
|---|---:|---|
| Current branch | ❌ | Current branch is `master`, not `main` or a named release branch. |
| Last commit | ✅ | `0767900 Add discipline and grievance article batch` |
| Working directory clean | ❌ | Worktree has many modified/untracked files, including checklist docs and app/source changes. |
| `npm run build` | ❌ | Compiles, then fails TypeScript on `src/app/api/cron/document-compliance/route.ts:6` BigInt target. |
| `npx tsc --noEmit` | ❌ | 6 errors: BigInt target, missing RPC types for `consume_usage`/advisory locks, Stripe handler query typing. |
| `npm run test` | ❌ | 49 passed, 7 failed. Race tests blocked by missing `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_WEBHOOK_SECRET`. |
| `npm run lint` | ❌ | 19 errors, 1 warning. Race tests use `any`; admin tools page calls `Date.now()` during render. |
| Local env shape | ❌ | `.env.test.local` missing. Stripe/Resend/Anthropic values are placeholders; no service role key or webhook secret. |

## Section 1: Product Integrity
| Item | Status | Evidence / Action |
|---|---:|---|
| 1.1 Race condition tests pass | ❌ | `docs/race-condition-verification.md` is NO-GO; W2.1/W2.2 not verified. |
| 1.2 Integration flow tests pass | ❌ | `docs/integration-verification.md` is NO-GO; all 10 flows blocked by env. |
| 1.3 Build is clean | ❌ | `npm run build` fails during TypeScript. No route bundle summary available. |
| 1.4 TypeScript is clean | ❌ | `npx tsc --noEmit` has 6 errors. `@ts-ignore`/`@ts-expect-error` count: 0. |
| 1.5 No `console.log` leaking | ❌ | `src/lib/email/send.ts` logs recipient email; Stripe/webhook logs print Stripe IDs/event types. |
| 1.6 No TODO/FIXME in critical paths | ✅ | No matches in `src/app/api`, `src/lib/stripe`, `src/lib/auth`. |
| 1.7 No hardcoded test credentials | ✅ | No matches for `test@test`, `test123`, `admin@admin`, `password123` in `src`. |
| 1.8 Feature flags configured | ⚠️ | `src/lib/analytics/feature-flags.ts` lists flags, but PostHog launch states were not verified. |
| 1.9 Default workspace settings sensible | ❌ | Could not verify seeded workflows/templates/requirements without safe DB. |
| 1.10 Onboarding re-tested | ❌ | Not executed; no safe test env/email configuration. |

## Section 2: Billing & Payments
| Item | Status | Evidence / Action |
|---|---:|---|
| 2.1 Stripe live keys configured | ❌ | Local Stripe keys are placeholders, not `sk_live_`/`pk_live_`; production env not verified. |
| 2.2 Stripe live products created | ⚠️ | Setup script exists and includes Pro/Team/Business prices, but live dashboard not verified. |
| 2.3 Live webhook endpoint configured | ❌ | `STRIPE_WEBHOOK_SECRET` missing; live endpoint/events not verified. |
| 2.4 Customer portal configured | ⚠️ | Requires Stripe dashboard confirmation. |
| 2.5 Tax configuration decided | ❌ | No `docs/tax-handling.md`; Stripe Tax/manual decision not documented. |
| 2.6 Refund policy defined | ❌ | No `docs/refund-policy.md`; terms only say generally non-refundable. |
| 2.7 Live payment flow tested | ❌ | Not executed. |
| 2.8 Live seat sync tested | ❌ | Not executed. |
| 2.9 Failed payment handling tested | ⚠️ | Code has invoice failure handler; test not executed. |
| 2.10 Pricing page matches Stripe | ⚠️ | Pricing code exists; live Stripe products and UI not verified. |

## Section 3: Email Deliverability
| Item | Status | Evidence / Action |
|---|---:|---|
| 3.1 Resend production key configured | ❌ | Local value is placeholder; production env not verified. |
| 3.2 Sending domain verified | ❌ | Requires Resend/DNS confirmation. |
| 3.3 From address appropriate | ❌ | `RESEND_FROM_EMAIL` missing locally; reply-to not verified. |
| 3.4 Unsubscribe mechanism verified | ⚠️ | `Layout` and `sendEmail` support unsubscribe/List-Unsubscribe; all templates and endpoint not end-to-end verified. |
| 3.5 Domain warmup | ⚠️ | Requires Adaeze operational confirmation. |
| 3.6 Templates render across clients | ⚠️ | 33 email TSX files present; client rendering not tested. |
| 3.7 Transactional vs marketing classification | ⚠️ | Some templates pass unsubscribe props; full classification not audited. |
| 3.8 Email failure alerting | ⚠️ | Retry code exists; Sentry alert not verified. |

## Section 4: Observability
| Item | Status | Evidence / Action |
|---|---:|---|
| 4.1 Sentry projects active | ⚠️ | Client/server/edge configs exist; production projects/source maps/releases not verified. |
| 4.2 Sentry PII scrubbing verified | ⚠️ | All configs call `scrubPII`; no live Sentry event verified. |
| 4.3 Sentry alerts configured | ⚠️ | Requires dashboard confirmation. |
| 4.4 PostHog dashboards built | ⚠️ | Tracking plan exists; dashboards not verified. |
| 4.5 Server-side consent gating | ⚠️ | `trackServer` checks `profiles.cookie_consent`; end-to-end consent flow not executed. |
| 4.6 Health endpoint/status page | ⚠️ | `/api/health` exists with DB/AI/email/Stripe checks; not runnable with current env. Public status monitoring not verified. |
| 4.7 Cron job monitoring | ⚠️ | Vercel crons exist for digest/reports/compliance/escalation; webhook-health and alerting not verified. |
| 4.8 Log retention sane | ⚠️ | Requires Vercel/Sentry/PostHog plan confirmation. |

## Section 5: Legal & Compliance
| Item | Status | Evidence / Action |
|---|---:|---|
| 5.1 Legal pages attorney-reviewed | ❌ | `reviewedBy` is blank in legal MDX files; `draft: true` still present. |
| 5.2 GDPR compliance | ⚠️ | Consent/privacy/export/delete pieces exist, but end-to-end rights flows not verified. |
| 5.3 CAN-SPAM compliance | ❌ | Physical mailing address and all marketing unsubscribe behavior not fully verified. |
| 5.4 NDPR compliance | ❌ | Breach plan mentions Nigerian rules, but privacy policy does not explicitly document NDPR/controller/transfer mechanism enough for launch. |
| 5.5 Children's privacy | ✅ | Terms require age 16+; privacy says not intended for children under 16. |
| 5.6 Subprocessor list maintained | ⚠️ | DPA/privacy list subprocessors, but no standalone `docs/subprocessors.md`; DPA says list must be finalised. |
| 5.7 Cookie list maintained | ⚠️ | Cookie page lists broad categories; not reviewed against production cookies. |
| 5.8 Dispute resolution clause | ✅ | Terms specify Nigerian law, Lagos venue, informal resolution, arbitration/court may apply. |

## Section 6: Security
| Item | Status | Evidence / Action |
|---|---:|---|
| 6.1 Production secrets rotated | ❌ | Production secrets not configured/verified; local env contains placeholders. |
| 6.2 RLS policies tested under load | ❌ | Not executed; no safe DB/service env. |
| 6.3 Rate limiting active | ⚠️ | `src/lib/rate-limit.ts` exists; generate/copilot have usage limits, but endpoint hammer tests not run and auth rate limiting not verified. |
| 6.4 CSP/security headers | ⚠️ | Headers are configured in `next.config.ts`; production scan not performed. |
| 6.5 Admin access protected | ⚠️ | `/admin` is protected by middleware; direct non-admin server-side access test not run. |
| 6.6 Backup/recovery | ❌ | Supabase plan/backups/restore not verified; no `docs/disaster-recovery.md`. |

## Section 7: Customer Support
| Item | Status | Evidence / Action |
|---|---:|---|
| 7.1 Support email monitored | ⚠️ | `SUPPORT_EMAIL=support@atlas-hr.com` locally; mailbox/auto-reply/SLA not verified. |
| 7.2 In-app support widget | ⚠️ | Support routes/admin pages exist; not end-to-end tested. |
| 7.3 Help articles published | ✅ | 62 help MDX articles found. |
| 7.4 Onboarding email sequence | ⚠️ | Requires email tool/Resend workflow confirmation. |
| 7.5 Founder availability | ⚠️ | Requires Adaeze calendar/runbook confirmation. |

## Section 8: Content & Marketing
| Item | Status | Evidence / Action |
|---|---:|---|
| 8.1 Landing page final review | ⚠️ | Landing content exists, but beta/placeholder copy remains in marketing components. |
| 8.2 SEO basics | ⚠️ | Metadata, robots, sitemap exist; Search Console and production URLs not verified. |
| 8.3 Knowledge Hub populated | ⚠️ | 52 knowledge MDX articles found; HR pro review/internal link checks not verified. |
| 8.4 Social accounts ready | ⚠️ | Requires external account confirmation. |
| 8.5 Press/blog content ready | ⚠️ | `/press` and launch docs exist; placeholders remain and scheduling not verified. |
| 8.6 Launch announcement assets | ⚠️ | `docs/launch-marketing-assets.md` exists; final assets not verified. |

## Section 9: Operational Readiness
| Item | Status | Evidence / Action |
|---|---:|---|
| 9.1 Domain and DNS | ❌ | DNS/SSL/email records not verified; local support email uses `atlas-hr.com`, while launch target says `atlashr.com`. |
| 9.2 Hosting limits understood | ⚠️ | Requires plan/billing confirmation. |
| 9.3 Cost monitoring | ⚠️ | Requires provider alert confirmation. |
| 9.4 Founder runbook | ⚠️ | `docs/runbook.md` created, but dashboard links and emergency contacts must be filled. |
| 9.5 Disaster scenarios prepared | ⚠️ | `docs/incidents.md` created plus detailed runbooks exist; final owner/contact details pending. |

## Section 10: Launch Day Prep
| Item | Status | Evidence / Action |
|---|---:|---|
| 10.1 Launch date chosen | ⚠️ | Requires Adaeze confirmation. |
| 10.2 Launch checklist visible | ⚠️ | Requires Adaeze confirmation. |
| 10.3 Beta users notified | ⚠️ | Requires Adaeze confirmation. |
| 10.4 Network primed | ⚠️ | Requires Adaeze confirmation. |
| 10.5 Mental preparation | ⚠️ | Requires Adaeze confirmation. |

## Blockers
1. Race-condition verification is NO-GO.
2. Integration verification is NO-GO.
3. Build fails TypeScript.
4. TypeScript check fails.
5. Test suite fails.
6. Lint fails.
7. Worktree is not clean.
8. Production/test environment is not configured safely.
9. Stripe live keys, products, webhook, and live flow are not verified.
10. Tax/refund policy docs are missing.
11. Resend production sender/domain/from address are not verified.
12. Legal pages are still draft/unreviewed.
13. CAN-SPAM/NDPR launch compliance is incomplete.
14. RLS/security tests were not executed.
15. Backup/recovery is not verified.
16. Domain/DNS/SSL/email DNS are not verified.

## Pending Items That Can Be Resolved After Core Blockers
- External Sentry/PostHog dashboards and alerts.
- Email rendering across Gmail/Outlook/iPhone.
- Status page monitoring.
- Social/press/launch-day operational confirmations.
- Final runbook links, emergency contacts, and support calendar details.

## Stripe Live Mode Flip
Not performed.

Reasons:
- Verdict is NO-GO.
- Local Stripe env values are placeholders, not live keys.
- Webhook secret is missing.
- Build/test/typecheck are not clean.
- Product integrity gates are not passed.

## Final Recommendation
NO-GO for launch and NO-GO for Stripe live mode.

Recommended sequence:
1. Configure an isolated `.env.test.local` and rerun race tests.
2. Fix TypeScript/build/lint/test failures.
3. Rerun the 10 integration flows.
4. Complete legal/email/DNS/Stripe live dashboard setup.
5. Re-run this checklist only after the product gates are green.
