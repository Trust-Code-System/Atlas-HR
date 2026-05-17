# Atlas HR - Integration Flow Verification
**Date:** 2026-05-13  
**Environment:** BLOCKED - no isolated test/staging environment configured  
**Test users created:** 0

## Preflight Safety Check
- `.env.test.local`: missing
- `NEXT_PUBLIC_SUPABASE_URL`: `https://guuf...supabase.co` from `.env.local`; not verified as test/staging/local
- `SUPABASE_SERVICE_ROLE_KEY`: missing
- `STRIPE_SECRET_KEY`: placeholder value beginning with `your_str...`, not a usable `sk_test_...` key
- `STRIPE_WEBHOOK_SECRET`: missing
- `RESEND_FROM_EMAIL`: missing
- Race-condition gate: not passed. `docs/race-condition-verification.md` reports W2.1 and W2.2 as NEEDS HUMAN REVIEW because the race tests could not execute without a service-role Supabase key.

Result: integration flows were not executed. Running them now would either fail immediately or risk mutating an unverified Supabase project. This is a NO-GO condition.

## Flow Results Summary
| # | Flow | Status | Critical Issues | Notes |
|---|------|--------|-----------------|-------|
| 1 | Sign-up -> first generation | ❌ BLOCKED | No isolated DB/admin env; email env incomplete | Not executed |
| 2 | Free -> trial -> paid -> cancel | ❌ BLOCKED | Stripe key is placeholder; webhook secret missing | Not executed |
| 3 | Team plan creation -> invite -> seat sync | ❌ BLOCKED | Stripe Checkout/Portal unavailable | Not executed |
| 4 | Employee onboarding workflow -> tasks -> completion | ❌ BLOCKED | No clean workspace/test users available | Not executed |
| 5 | Leave request -> approval -> calendar | ❌ BLOCKED | No employee/workspace state available | Not executed |
| 6 | Document upload -> compliance -> expiry alert | ❌ BLOCKED | No test workspace; cron secret/env not verified | Not executed |
| 7 | Community post -> reply -> notification -> vote | ❌ BLOCKED | No controlled users/email setup | Not executed |
| 8 | Copilot context-aware persistence | ❌ BLOCKED | No controlled dual-role user; AI/env not verified | Not executed |
| 9 | Tool generation -> save -> DOCX download | ❌ BLOCKED | No authenticated Pro+ test user; AI/env not verified | Not executed |
| 10 | Cookie consent -> analytics gating | ❌ BLOCKED | Could not safely run full browser/session flow | Not executed |

## Detailed Findings Per Flow
### Flow 1: Sign-up -> Onboarding -> First Generation -> Save
Pre-conditions were not met. A fresh isolated database and email-capable test environment are required to verify profile creation, email verification, welcome email delivery, generated document persistence, usage tracking, and saved article persistence.

Notable pre-run mismatch: the prompt expects free saved item limit = 100, but current code has `LIMITS.free.saved_items = 50` in `src/lib/limits.ts`.

### Flow 2: Free -> Trial -> Paid -> Cancel
Not executed. Stripe is not configured with a usable test secret key, and the webhook secret is missing. This flow cannot verify Checkout, webhook processing, subscription state, role upgrades, or retention override behavior.

### Flow 3: Team Plan Creation -> Invite -> Seat Sync
Not executed. This requires Stripe test Checkout/seat updates plus a clean organisation and invitation email setup.

### Flow 4: Employee Onboarding Workflow -> Tasks -> Completion
Not executed. This depends on a Team workspace from Flow 3 and fresh employee/test-user state.

### Flow 5: Leave Request -> Approval -> Calendar
Not executed. This depends on the employee and approver state from Flow 4.

### Flow 6: Document Upload -> Compliance -> Expiry Alert
Not executed. This depends on Flow 4 employee state and verified cron/test secrets.

### Flow 7: Community Post -> Reply -> Notification -> Vote
Not executed. This requires two controlled accounts and working notification/email infrastructure.

### Flow 8: Copilot Context-Aware Persistence
Not executed. This requires a controlled dual-role user and configured AI provider keys.

Notable pre-run mismatch: the prompt expects a 50/day free Copilot limit, but current code has `LIMITS.free.copilot_messages_per_day = 20` in `src/lib/limits.ts`.

### Flow 9: Tool Generation -> Save -> DOCX Download
Not executed. This requires an authenticated Pro+ user and configured generation backend.

### Flow 10: Cookie Consent -> Analytics Gating
Not executed. This can be tested after a safe dev/staging environment is running, but the broader integration pass is blocked by missing foundational env.

## Additional Spot Checks
- Theme + accent persistence: not executed
- Mobile responsiveness: not executed
- Email template rendering: not executed
- `/api/health`: not executed
- Lighthouse performance: not executed

## Issues Discovered
### P0 - Integration environment is not configured
Evidence:
- `.env.test.local` is missing.
- `SUPABASE_SERVICE_ROLE_KEY` is missing.
- `STRIPE_SECRET_KEY` is a placeholder, not `sk_test_...`.
- `STRIPE_WEBHOOK_SECRET` is missing.
- `RESEND_FROM_EMAIL` is missing.

Impact:
The 10 integration flows cannot be run safely or meaningfully. User creation, Stripe Checkout, webhook processing, emails, and cleanup verification all depend on this setup.

Recommended fix:
Create an isolated `.env.test.local` with test/staging Supabase, Stripe test mode keys, webhook secret, Resend test sender, and any required AI provider/test secrets. Apply all Supabase migrations to that database before rerunning.

### P0 - Race-condition gate has not passed
Evidence:
- `docs/race-condition-verification.md` reports W2.1 and W2.2 as NEEDS HUMAN REVIEW.
- The race tests errored before executing because `SUPABASE_SERVICE_ROLE_KEY` was missing.

Impact:
The integration prompt explicitly says not to proceed until the race tests pass. Proceeding would violate the launch gate.

Recommended fix:
Configure the isolated test environment, run `npm run test:race`, and only proceed with these 10 flows after W2.1 and W2.2 are verified closed.

### P1 - Prompt expectations differ from current code limits
Evidence:
- `src/lib/limits.ts` has `copilot_messages_per_day: 20` for free users, while Flow 8 expects 50/day.
- `src/lib/limits.ts` has `saved_items: 50` for free users, while Flow 1 expects 100.

Impact:
Even after environment setup, those flow assertions will fail unless the prompt or code is updated.

Recommended fix:
Confirm the intended R.6/W2.5 limits. If the prompt is authoritative, update `src/lib/limits.ts` and related UI copy/tests before rerunning integration verification.

## Test Data Cleanup
- Test users deleted: not applicable; none created
- Test organisations deleted: not applicable; none created
- Stripe test subscriptions canceled: not applicable; none created
- Orphan row checks: not run because there is no service-role database access

## Recommendation
NO-GO for final pre-launch checklist.

Required next steps:
1. Configure an isolated `.env.test.local`.
2. Apply migrations to the isolated database.
3. Run `npm run test:race` and get W2.1/W2.2 to VERIFIED CLOSED.
4. Re-run this 10-flow integration verification against that same safe environment.
