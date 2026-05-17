# Runbook: Sentry Alert Spike

## Symptoms

- New issue alert fires.
- Error-rate alert exceeds threshold.
- Crash-free sessions drop below target.
- Users report blank pages, failed actions, or failed generation.

## Immediate Actions

1. Open Sentry Issues and filter by latest release.
2. Identify whether the error started after the most recent deploy.
3. Check affected route, browser, user count, and first-seen timestamp.
4. If it is a deploy regression, roll back in Vercel immediately.
5. Create or update the status-page incident if users are affected.

## Triage

- Client rendering error: check stack trace, route, browser, and recent component edits.
- API route error: check request context, auth state, dependency failure, and Sentry breadcrumbs.
- Database error: check Supabase logs and query shape.
- Third-party error: check Stripe, Resend, Anthropic, Sentry, or PostHog status.

## Communication

Use the status page if users are blocked:

- Investigating: "We are investigating errors affecting [area]."
- Identified: "We identified the cause and are working on a fix."
- Monitoring: "A fix has been deployed and we are monitoring."
- Resolved: "The issue is resolved. We apologize for the disruption."

## Resolution

- Roll back first if many users are affected.
- Fix forward only if the patch is small and low-risk.
- Add a regression test for the broken path.
- Tag the Sentry issue with the root cause and release.
