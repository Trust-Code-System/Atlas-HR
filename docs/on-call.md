# On-Call and Incident Response

## Ownership

Until Atlas HR has a larger operations team, the founder is primary on-call.

Alert routes:

- Sentry: production errors, new issues, crash-free session drops
- Status monitoring: `/api/health`, landing page, dashboard redirect, API checks
- Stripe: webhook failures and payment incidents
- Support: urgent tickets and billing tickets

## Severity

| Severity | Definition | Response target |
| --- | --- | --- |
| P0 | Site down, auth broken, billing broken, or data loss risk | 30 minutes |
| P1 | Core feature broken for many users: generation, Copilot, support, workspace | 2 hours |
| P2 | Minor degraded behavior or single-user issue | Next business day |

## Incident Process

1. Acknowledge the alert.
2. Check Sentry, `/api/health`, Stripe webhook logs, and recent deploys.
3. If users are affected, publish an incident on the status page.
4. Mitigate quickly: roll back, disable a feature flag, or ship a focused fix.
5. Update the status page when investigating, identified, monitoring, and resolved.
6. Write a short post-incident note for P0/P1 incidents.

## Status Copy

- Investigating: "We are investigating reports of [issue]."
- Identified: "We have identified the cause of [issue] and are working on a fix."
- Monitoring: "A fix has been deployed and we are monitoring."
- Resolved: "[Issue] was resolved at [time]."

## Launch Week Routine

- Morning: review Sentry, support tickets, Stripe failures, and `/admin/launch-metrics`.
- Midday: check activation and signup funnel health in PostHog.
- Evening: review open support tickets and unresolved production errors.
