# Atlas HR - Race Condition Verification Report
**Date:** 2026-05-13  
**Tested:** W2.1 (Stripe webhook idempotency), W2.2 (Usage tracking atomic)

## Test Environment
- Supabase URL: `https://guuf...supabase.co` from `.env.local` (not verified as isolated test/staging)
- `.env.test.local`: not present or did not inject variables
- Required credentials: `SUPABASE_SERVICE_ROLE_KEY` missing; `STRIPE_WEBHOOK_SECRET` missing for Stripe race tests
- Test user IDs: none created
- Vitest version: 4.1.6
- Concurrency mechanism: `Promise.all`
- Total concurrent requests fired across all tests: 0 actual; test suite is configured to fire 355 after environment setup succeeds

## W2.1 - Stripe Webhook Idempotency
### Test 1: 20 concurrent identical events
- Expected: 1 processed, 19 deduped, 1 subscription row created
- Actual: ERROR before execution: `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_WEBHOOK_SECRET` missing
- Status: ERROR

### Test 2: Handler failure recovery (manual verification)
- Automated mocking not implemented for the forced handler failure path.
- Manual verification steps are printed by the test suite.
- Status: NEEDS HUMAN REVIEW

### Test 3: 50 unique events x 2 deliveries
- Expected: 50 processed, 50 deduped, 50 unique subscription rows
- Actual: ERROR before execution: `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_WEBHOOK_SECRET` missing
- Status: ERROR

## W2.2 - Usage Tracking Atomic Consume
### Test 1: 30 concurrent gen requests vs limit of 20
- Expected: 20 allowed, 10 blocked, DB usage = 20
- Actual: ERROR before execution: `SUPABASE_SERVICE_ROLE_KEY` missing
- Status: ERROR

### Test 2: Mixed sequential + concurrent at boundary
- Actual: ERROR before execution: `SUPABASE_SERVICE_ROLE_KEY` missing
- Status: ERROR

### Test 3: Copilot daily limit
- Note: current code config is `LIMITS.free.copilot_messages_per_day = 20`, not the prompt's stated 50/day.
- Actual: ERROR before execution: `SUPABASE_SERVICE_ROLE_KEY` missing
- Status: ERROR

### Test 4: Pro user unlimited
- Actual: ERROR before execution: `SUPABASE_SERVICE_ROLE_KEY` missing
- Status: ERROR

### Test 5: Lock contention performance
- Elapsed time for 50 concurrent on fresh free user: not measured
- No deadlocks: not verified
- Actual: ERROR before execution: `SUPABASE_SERVICE_ROLE_KEY` missing
- Status: ERROR

## Test Commands Run
- `npm run test:race`: 2 files failed, 7 tests failed, 1 manual test passed
- `npm run test`: 2 files failed, 1 file passed, 7 tests failed, 49 tests passed

## Overall Verdict
- W2.1: NEEDS HUMAN REVIEW - not verified because test environment is incomplete
- W2.2: NEEDS HUMAN REVIEW - not verified because test environment is incomplete

## If Any Tests Failed
Root cause analysis:
The failures are setup errors, not evidence that either race condition is still open. The race tests intentionally refuse to create users, webhook events, subscriptions, or usage rows without a service-role Supabase key. The Stripe tests also require a webhook secret so requests are signed before reaching the mocked Stripe verifier. The repo lacks an isolated `.env.test.local`, so running against the fallback `.env.local` would be unsafe even if the keys were present.

Recommended code/config change:
Create `.env.test.local` pointing to an isolated Supabase project or disposable test database, including:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_MONTHLY_PRICE_ID=...
```

Then rerun:

```bash
npm run test:race
```

If the same isolated database has not had migrations applied, apply the Supabase migrations before rerunning.

## Cleanup Verification
- All test users deleted: yes (none created)
- All test webhook events deleted: yes (none created)
- All test subscriptions deleted: yes (none created)
- No orphan rows in usage_tracking: yes (none created)

## Recommendation
NO-GO for proceeding to integration flow tests and launch. The stress-test harness now exists, but neither P0 race fix has been proven under real concurrency because the isolated admin test environment is not configured.
